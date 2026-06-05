import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { SCENARIOS } from '../data/scenarios';
import { AI_PROFILES } from '../data/aiProfiles';

export const BriefingPage = () => {
  const navigate = useNavigate();
  const {
    selectedScenarioId,
    learningSpeed,
    aiPersonality,
    carCount,
    maxGenerations,
  } = useSimulation();

  useEffect(() => {
    if (!selectedScenarioId || !aiPersonality) {
      navigate('/config');
    }
  }, [selectedScenarioId, aiPersonality, navigate]);

  const selectedScenario = SCENARIOS.find((sc) => sc.id === selectedScenarioId);
  const scenarioName = selectedScenario
    ? `${selectedScenario.title} (${selectedScenario.difficulty.split('：')[1]})`
    : '未選択';

  const selectedProfile = AI_PROFILES.find((p) => p.id === aiPersonality);
  const specs = selectedProfile
    ? selectedProfile.specs(learningSpeed)
    : {
        maxSpeed: '未設定',
        sensorRange: '未設定',
        mutationRate: '未設定',
        decisionLogic: '未設定',
        prediction: '未設定',
      };

  return (
    <div className="briefing-page-container fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <div className="page-header-section" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div className="portfolio-badge" style={{ marginBottom: '12px' }}>MISSION BRIEFING</div>
        <h2 className="page-title" style={{ fontSize: '2.2rem', fontFamily: 'var(--font-heading)' }}>AI歩行 実験ブリーフィング</h2>
        <p className="page-subtitle" style={{ fontSize: '15px' }}>
          シミュレーション開始前に、生成されるAIの初期スペックと予測レポートを確認します。
        </p>
      </div>

      <div className="briefing-content-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        
        {/* 左側：設定サマリー & 今回の見どころ */}
        <div className="left-briefing-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="summary-panel card" style={{ padding: '32px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--color-primary)' }}>■</span> 実験パラメーター概要
            </h3>
            <div className="summary-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>歩行レーン</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-primary)' }}>{scenarioName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>歩行AIの方針</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                  {selectedProfile ? selectedProfile.title : '未設定'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>学習スタイル</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                  {learningSpeed === 'fast' ? '高速進化' : learningSpeed === 'slow' ? '慎重進化' : '通常'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>同時歩行個体数</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                  {carCount === 'high' ? '50個体 (密集)' : carCount === 'low' ? '15個体 (少なめ)' : '30個体 (標準)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>学習世代数</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{maxGenerations} 世代</span>
              </div>
            </div>
          </div>

          <div className="key-points-panel card" style={{ padding: '32px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#f59e0b' }}>■</span> 今回の歩行実験の見どころ
            </h3>
            <ul style={{ paddingLeft: '20px', color: '#475569', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
              <li style={{ marginBottom: '12px' }}><strong style={{ color: '#0f172a' }}>初期探索の失敗体験：</strong> 第1世代はパラメータのばらつきが大きく、最初の数ステップで転倒が多発します。</li>
              <li style={{ marginBottom: '12px' }}><strong style={{ color: '#0f172a' }}>世代交代による進化：</strong> 優秀なエリート個体の選抜と突然変異により、無駄なふらつきが抑えられ、バランスよく進む特性が引き継がれます。</li>
              <li><strong style={{ color: '#0f172a' }}>最終診断レポート：</strong> 完了時に全体の歩行データを評価し、S〜Cランクの総合診断書を生成します。</li>
            </ul>
          </div>
        </div>

        {/* 右側：AI Brain Card */}
        <div className="brain-card-panel card spec-card" style={{ padding: '32px', borderRadius: '16px', background: '#0f172a', color: '#ffffff', border: 'none', position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(15,23,42,0) 70%)', borderRadius: '50%' }}></div>

          <div style={{ marginBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 8px 0', fontFamily: 'var(--font-heading)', color: '#38bdf8' }}>NEURAL SPEC CARD</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>設定から変換されたAIの初期遺伝子状態</p>
          </div>
          
          <div className="spec-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '4px' }}>目標の歩行スピード</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>{specs.maxSpeed}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '4px' }}>ふらつき補正</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>{specs.sensorRange}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '4px' }}>学習中の試行錯誤の大きさ</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>{specs.mutationRate}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '4px' }}>歩き方の方針</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>{specs.decisionLogic}</span>
            </div>
          </div>

          <div className="prediction-box" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h4 style={{ fontSize: '13px', color: '#10b981', fontWeight: '800', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
              初期進化挙動の予測
            </h4>
            <p style={{ fontSize: '14px', color: '#f8fafc', lineHeight: '1.7', margin: 0 }}>
              {specs.prediction}
            </p>
          </div>
        </div>
      </div>

      <div className="navigation-actions" style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '48px' }}>
        <button onClick={() => navigate('/config')} className="btn btn-secondary btn-lg" style={{ width: '200px' }}>
          設定を変更する
        </button>
        <button onClick={() => navigate('/simulation')} className="btn btn-primary btn-lg pulse-glow" style={{ width: '300px' }}>
          歩行実験を開始する
        </button>
      </div>
    </div>
  );
};
export default BriefingPage;
