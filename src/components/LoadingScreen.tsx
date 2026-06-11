import { useEffect, useState } from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  /** 演出完了後に呼ばれる（親側でアンマウントする） */
  onDone: () => void;
}

const PHASES = [
  '個体群を生成中',
  'ニューラルパラメータを初期化中',
  'シミュレーション環境を構築中',
];

const prefersReduced = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * アプリ起動時の全画面ローディング演出。
 * 「AI歩行を観察する近未来サイバー実験施設」のブートシーケンスを表現する。
 * GA・3D とは独立した純粋な演出コンポーネント（ロジック非依存）。
 */
export const LoadingScreen = ({ onDone }: LoadingScreenProps) => {
  const reduced = prefersReduced();
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false); // READY 表示
  const [hide, setHide] = useState(false); // フェードアウト中

  useEffect(() => {
    const total = reduced ? 900 : 2600;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / total);
      // 終盤を少し溜める easeOutCubic（"処理してる感"を出す）
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setReady(true);
        const holdMs = reduced ? 250 : 650;
        const fadeMs = reduced ? 350 : 650;
        window.setTimeout(() => setHide(true), holdMs);
        window.setTimeout(() => onDone(), holdMs + fadeMs);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone, reduced]);

  const phaseIdx = Math.min(
    PHASES.length - 1,
    Math.floor((progress / 100) * PHASES.length)
  );

  return (
    <div
      className={`loader${hide ? ' loader--done' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="システムを起動しています"
    >
      <div className="loader__grid" aria-hidden="true" />
      <img
        className="loader__silhouette"
        src="/loader_robot_silhouette.png"
        alt=""
        aria-hidden="true"
      />
      <div className="loader__scanlines" aria-hidden="true" />
      <div className="loader__vignette" aria-hidden="true" />

      <span className="loader__corner loader__corner--tl" aria-hidden="true" />
      <span className="loader__corner loader__corner--tr" aria-hidden="true" />
      <span className="loader__corner loader__corner--bl" aria-hidden="true" />
      <span className="loader__corner loader__corner--br" aria-hidden="true" />

      <span className="loader__tag loader__tag--tl" aria-hidden="true">EVO-LAB // SYSTEM</span>
      <span className="loader__tag loader__tag--tr" aria-hidden="true">NEURAL CORE // ONLINE</span>
      <span className="loader__tag loader__tag--bl" aria-hidden="true">SECTOR 01 // WALK</span>
      <span className="loader__tag loader__tag--br" aria-hidden="true">GA ENGINE // v0.0</span>

      <div className="loader__center">
        <div className="loader__eyebrow">Evolutionary Walking Simulator</div>

        <h1 className="loader__logo" data-text="EvoWalker AI">
          EvoWalker <span className="loader__logo-accent">AI</span>
        </h1>

        <div className="loader__bar">
          <div className="loader__bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="loader__status">
          <span className={`loader__phase${ready ? ' loader__phase--ready' : ''}`}>
            {ready ? 'READY' : `${PHASES[phaseIdx]}…`}
          </span>
          <span className="loader__pct">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
