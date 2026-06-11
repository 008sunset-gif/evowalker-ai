import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';

export const TopPage = () => {
  const navigate = useNavigate();
  const { resetSimulation } = useSimulation();

  const handleStart = () => {
    resetSimulation();
    navigate('/scenario');
  };

  return (
    <div className="top-page-container fade-in">
      {/* フルスクリーンのキービジュアル（背景画像＋暗いオーバーレイ＋テキスト） */}
      <section
        className="hero-cover"
        role="img"
        aria-label="ネオングリッドの実験施設を歩く EvoWalker AI のロボット"
      >
        <div className="hero-cover__overlay" aria-hidden="true" />

        <div className="hero-cover__content">
          <span className="hero__eyebrow">
            <span className="hero__eyebrow-dot" />
            進化シミュレーター
          </span>

          <h1 className="hero-cover__title" translate="no">
            EvoWalker <span className="hero__title-accent">AI</span>
          </h1>

          <p className="hero-cover__lead">
            遺伝的アルゴリズムで、AIが歩き方を自分で学習していく。
            その進化の過程を、3Dでリアルタイムに観察できるシミュレーターです。
          </p>

          <ol className="hero__steps hero__steps--on-image">
            <li className="hero__step">
              <span className="hero__step-head">
                <span className="hero__step-dot" style={{ background: '#ef4444' }} />
                <span className="hero__step-name">試す</span>
              </span>
              <span className="hero__step-label">ロボットたちがランダムに歩き、多くが転ぶ</span>
            </li>
            <li className="hero__step">
              <span className="hero__step-head">
                <span className="hero__step-dot" style={{ background: '#f59e0b' }} />
                <span className="hero__step-name">選ばれる</span>
              </span>
              <span className="hero__step-label">うまく歩けた個体が次の世代に遺伝子を残す</span>
            </li>
            <li className="hero__step">
              <span className="hero__step-head">
                <span className="hero__step-dot" style={{ background: '#10b981' }} />
                <span className="hero__step-name">進化する</span>
              </span>
              <span className="hero__step-label">世代を重ね、まっすぐ歩ける個体が増える</span>
            </li>
          </ol>

          <div className="hero__actions">
            <button onClick={handleStart} className="hero__cta">
              シミュレーションを始める
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="hero__cta-note">登録不要・ブラウザですぐ動きます</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TopPage;
