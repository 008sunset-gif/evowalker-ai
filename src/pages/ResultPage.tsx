import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { SCENARIOS } from '../data/scenarios';

export const ResultPage = () => {
  const navigate = useNavigate();
  const { selectedScenarioId, mockFinalResult, resetSimulation, mockEvolutionHistory, carCount } = useSimulation();
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    if (!mockFinalResult) {
      navigate('/analysis');
    }
  }, [mockFinalResult, navigate]);

  const selectedScenario = SCENARIOS.find((sc) => sc.id === selectedScenarioId);
  const scenarioTitle = selectedScenario ? selectedScenario.title : '未選択';

  const handleRestart = () => {
    resetSimulation();
    navigate('/');
  };

  if (!mockFinalResult) {
    return <div className="no-data-text">診断結果を読み込み中...</div>;
  }

  const maxCarCount = carCount === 'high' ? 50 : carCount === 'low' ? 15 : 30;
  const firstGen = mockEvolutionHistory[0];
  const lastGen = mockEvolutionHistory[mockEvolutionHistory.length - 1];

  const calcMetrics = (g: any) => {
    if (!g) return { stable: 0, dist: 0, crash: 0, goal: 0, outOfLane: 0 };
    const total = maxCarCount;
    return {
      stable: Math.min(100, Math.max(0, Math.floor((g.aliveCount / total) * 100))),
      // 平均前進距離は実データ（メートル換算済みの averageDistance）を使用。スコアからの逆算はしない。
      dist: Math.max(0, Math.floor(g.averageDistance ?? 0)),
      crash: Math.min(100, Math.max(0, Math.floor((g.fallenCount / total) * 100))),
      goal: Math.min(100, Math.max(0, Math.floor((g.completedCount / total) * 100))),
      outOfLane: Math.min(100, Math.max(0, Math.floor((g.outOfLaneCount / total) * 100))),
    };
  };

  const firstMetrics = calcMetrics(firstGen);
  const lastMetrics = calcMetrics(lastGen);

  const firstStable = firstMetrics.stable;
  const lastStable = lastMetrics.stable;
  const firstDistance = firstMetrics.dist;
  const lastDistance = lastMetrics.dist;
  const firstCrash = firstMetrics.crash;
  const lastCrash = lastMetrics.crash;

  const getRatingStyles = (rating: string) => {
    switch (rating) {
      case 'S':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', glow: '0 0 30px rgba(16, 185, 129, 0.2)' };
      case 'A':
      case 'A+':
        return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', glow: '0 0 30px rgba(59, 130, 246, 0.2)' };
      case 'B':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', glow: '0 0 30px rgba(245, 158, 11, 0.2)' };
      default:
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', glow: '0 0 30px rgba(239, 68, 68, 0.2)' };
    }
  };

  const ratingStyle = getRatingStyles(mockFinalResult.rating);

  return (
    <div className="result-page-container fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      
      {/* ヒーロー画像ヘッダー */}
      <div style={{ width: '100%', height: '220px', borderRadius: '16px', overflow: 'hidden', backgroundImage: 'url(/result_evaluation.png)', backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '32px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to right, rgba(15,23,42,0.95), rgba(15,23,42,0.5))' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '40px', transform: 'translateY(-50%)', color: 'white' }}>
          <div className="portfolio-badge" style={{ background: 'var(--color-primary)', display: 'inline-block', marginBottom: '8px' }}>DIAGNOSTIC REPORT</div>
          <h2 style={{ margin: 0, fontSize: '2.5rem', fontFamily: 'var(--font-heading)' }}>AI歩行 最終診断レポート</h2>
          <p style={{ margin: '8px 0 0 0', opacity: 0.8, fontSize: '15px' }}>シミュレーション完了。AIモデルが到達した最終世代の歩行適合特性を診断します。</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* 1. 総合評価・歩行タイプ */}
        <div className="result-card-panel card" style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.05)',
          display: 'grid',
          gridTemplateColumns: '1.2fr 2fr',
          gap: '40px',
          alignItems: 'center'
        }}>
          {/* 左カラム：評価ランクのグローバッジ */}
          <div style={{
            textAlign: 'center',
            borderRight: '1px solid #e2e8f0',
            paddingRight: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>総合歩行評価</span>
            
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: ratingStyle.bg,
              border: `3px solid ${ratingStyle.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '24px 0',
              boxShadow: ratingStyle.glow
            }}>
              <span style={{
                fontSize: '64px',
                fontWeight: '900',
                color: ratingStyle.color,
                fontFamily: 'var(--font-heading)',
                lineHeight: '1'
              }}>{mockFinalResult.rating}</span>
            </div>

            <span style={{
              fontSize: '12px',
              background: '#f8fafc',
              color: '#475569',
              padding: '6px 16px',
              borderRadius: '20px',
              fontWeight: '700',
              border: '1px solid #e2e8f0'
            }}>
              レーン環境: {scenarioTitle}
            </span>
          </div>

          {/* 右カラム：歩行タイプ解説 */}
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>獲得モデル特性</span>
            <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 16px 0', fontFamily: 'var(--font-heading)' }}>
              {mockFinalResult.typeLabel}
            </h3>
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.7', margin: '0' }}>
              {mockFinalResult.aiType}
            </p>
          </div>
        </div>

        {/* 2. 数値変化（第1世代 ➔ 最終世代の進化対比） */}
        <div className="card" style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
        }}>
          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 20px 0', letterSpacing: '0.5px' }}>進化による主要数値変化</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', textAlign: 'center' }}>
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>安定歩行率</span>
              <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '12px', color: '#0f172a' }}>
                {firstStable}% <span style={{ color: '#cbd5e1', fontSize: '20px', fontWeight: 'normal', margin: '0 8px' }}>➔</span> <span style={{ color: '#10b981' }}>{lastStable}%</span>
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>平均前進距離</span>
              <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '12px', color: '#0f172a' }}>
                {firstDistance}m <span style={{ color: '#cbd5e1', fontSize: '20px', fontWeight: 'normal', margin: '0 8px' }}>➔</span> <span style={{ color: '#3b82f6' }}>{lastDistance}m</span>
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>転倒リタイア率</span>
              <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '12px', color: '#0f172a' }}>
                {firstCrash}% <span style={{ color: '#cbd5e1', fontSize: '20px', fontWeight: 'normal', margin: '0 8px' }}>➔</span> <span style={{ color: '#ef4444' }}>{lastCrash}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 改善点・弱点・おすすめ設定 */}
        <div className="card" style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px'
        }}>
          <div>
            <h4 style={{ fontSize: '15px', color: '#10b981', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 12px 0' }}>
              <span style={{ display: 'inline-block', width: '24px', height: '24px', background: 'rgba(16,185,129,0.1)', borderRadius: '50%', textAlign: 'center', lineHeight: '24px' }}>✓</span> 
              改善されたポイント (進化の成果)
            </h4>
            <p style={{ fontSize: '14px', color: '#475569', margin: '0', lineHeight: '1.7', paddingLeft: '36px' }}>
              {mockFinalResult.improvedPoints}
            </p>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '28px' }}>
            <h4 style={{ fontSize: '15px', color: '#ef4444', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 12px 0' }}>
              <span style={{ display: 'inline-block', width: '24px', height: '24px', background: 'rgba(239,68,68,0.1)', borderRadius: '50%', textAlign: 'center', lineHeight: '24px' }}>!</span> 
              まだ残る課題 (重心制御限界)
            </h4>
            <p style={{ fontSize: '14px', color: '#475569', margin: '0', lineHeight: '1.7', paddingLeft: '36px' }}>
              {mockFinalResult.remainingWeakness}
            </p>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '28px' }}>
            <h4 style={{ fontSize: '15px', color: '#f59e0b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 12px 0' }}>
              <span style={{ display: 'inline-block', width: '24px', height: '24px', background: 'rgba(245,158,11,0.1)', borderRadius: '50%', textAlign: 'center', lineHeight: '24px' }}>*</span> 
              次回に向けたおすすめ学習設定
            </h4>
            <p style={{ fontSize: '14px', color: '#475569', margin: '0', lineHeight: '1.7', paddingLeft: '36px' }}>
              {mockFinalResult.nextAdvice}
            </p>
          </div>
        </div>

        {/* 4. 詳細レポート (就活アピール用のデザイン/アルゴリズム設計解説を兼ねたアコーディオン) */}
        <div className="card" style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px 32px',
          boxShadow: 'none'
        }}>
          <button
            onClick={() => setIsReportOpen(!isReportOpen)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              outline: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              color: '#0f172a',
              fontWeight: '800',
              fontSize: '14px',
              padding: 0
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--color-primary)' }}>■</span> 
              システム設計 ＆ アルゴリズム解説 (アーキテクチャ詳細)
            </span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>{isReportOpen ? '▲ 折りたたむ' : '▼ 展開する'}</span>
          </button>
          
          {isReportOpen && (
            <div className="fade-in" style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '24px', fontSize: '14px', color: '#475569', lineHeight: '1.8' }}>
              <h5 style={{ fontWeight: '800', color: '#0f172a', marginBottom: '12px', fontSize: '15px' }}>遺伝的アルゴリズムの仕組み</h5>
              <p style={{ marginBottom: '24px' }}>
                本シミュレーターは、ニューラルネットワークを用いず、各ロボット個体の歩行特性（歩幅 <code>strideLength</code>、歩行リズム <code>stepRhythm</code>、姿勢補正力 <code>balanceCorrection</code>、ふらつき量 <code>wobbleStrength</code>、立て直す力 <code>recoveryAbility</code>、前進速度 <code>speedFactor</code> など8つのパラメータ）を<b>「ゲノム（DNA）」</b>として定義しています。
                毎世代の評価値（前進距離・生存時間・中央維持・姿勢安定から算出された適合度スコア）に基づき、上位の優秀個体を無変更で引き継ぐ<b>「エリート選抜（保護）」</b>と、選抜された親のゲノムに一定確率でランダムな変化を加える<b>「突然変異（Mutation）」</b>により、世代を追うごとに環境に適応した歩行パターンが動的に醸成されていきます。（交叉は用いず、エリート選抜＋突然変異によるシンプルな進化モデルです。）
              </p>

              <h5 style={{ fontWeight: '800', color: '#0f172a', marginBottom: '12px', fontSize: '15px' }}>UI/UXとフロントエンド設計意図</h5>
              <p style={{ marginBottom: '24px' }}>
                シミュレーターのビジュアル面では、<b>React Three Fiber（Three.js）</b>を用いて、ブラウザ上でリアルタイムな3D描画を実現しています。
                歩行の挙動は外部物理エンジンに頼らず、サイン波ベースの歩容と重心バランスを計算する<b>自作の簡易歩行物理</b>として実装し、世代ごとに変化する歩行パターンの試行錯誤を視覚化しました。
                また、世代数の多さに起因する「ユーザーの待機ストレス」を解消するため、<b>再生倍速機能（1倍速 / 2倍速 / 5倍速）</b>や、対象個体を追う<b>カメラトラッキング</b>などを実装しています。
              </p>

              <h5 style={{ fontWeight: '800', color: '#0f172a', marginBottom: '12px', fontSize: '15px' }}>診断メトリクス実績</h5>
              <ul style={{ paddingLeft: '24px', color: '#475569', margin: '0' }}>
                {mockFinalResult.features.map((feat, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>{feat}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>

      <div className="start-actions" style={{ textAlign: 'center', marginTop: '48px' }}>
        <button onClick={handleRestart} className="btn btn-primary btn-lg pulse-glow" style={{ padding: '16px 48px', fontSize: '16px' }}>
          別の設定で実験をやり直す
        </button>
      </div>
    </div>
  );
};
export default ResultPage;
