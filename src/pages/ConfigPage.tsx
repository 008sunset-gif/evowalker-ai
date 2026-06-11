import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { AI_PROFILES } from '../data/aiProfiles';
import { Button } from '../components/Button';
import type {
  SpeedType,
  PopulationType,
  GenerationOptionType,
} from '../types/simulation';

export const ConfigPage = () => {
  const navigate = useNavigate();
  const {
    selectedScenarioId,
    learningSpeed,
    aiPersonality,
    carCount,
    maxGenerations,
    updateAIConfig,
  } = useSimulation();

  useEffect(() => {
    if (!selectedScenarioId) {
      navigate('/scenario');
    }
  }, [selectedScenarioId, navigate]);

  return (
    <div className="config-page-container fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      
      {/* ヘッダーバナー */}
      <div className="page-banner">
        <div className="page-banner__inner">
          <div className="portfolio-badge" style={{ background: 'var(--color-primary)', color: '#06131f', display: 'inline-block', marginBottom: '10px' }}>AI CONFIGURATION</div>
          <h2 style={{ margin: 0, fontSize: 'clamp(24px, 3vw, 34px)', color: 'var(--text-title)' }}>歩行AIの設定</h2>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)' }}>遺伝的アルゴリズムのパラメータと学習環境を設定します。</p>
        </div>
      </div>

      <div className="config-form-container" style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
        
        {/* AIの性格設定 */}
        <div className="form-group" style={{ marginBottom: '32px' }}>
          <label className="form-label" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>歩行方針（優先事項） <span className="recommended" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid var(--border-strong)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>おすすめ</span></label>
          <p className="form-desc" style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            AIが学習を進めるうえで最も重視する行動評価軸です。初期設定では「安定重視」が選択されています。そのままでも始められます。
          </p>
          <div className="options-grid">
            {AI_PROFILES.map((opt) => (
              <button
                type="button"
                key={opt.id}
                className={`option-card ${aiPersonality === opt.id ? 'selected' : ''}`}
                onClick={() => updateAIConfig({ aiPersonality: opt.id })}
                aria-pressed={aiPersonality === opt.id}
                style={{
                  border: aiPersonality === opt.id ? '2px solid var(--color-primary)' : '1px solid var(--border-strong)',
                  background: aiPersonality === opt.id ? 'var(--color-primary-light)' : 'var(--bg-inset)',
                  padding: '20px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', color: aiPersonality === opt.id ? 'var(--color-primary)' : 'var(--text-main)' }}>{opt.title}</h4>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          {/* 学習スタイル（突然変異の強さ） */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>学習スタイル（変異の強さ）</label>
            <div className="segmented-control" style={{ display: 'flex', background: 'var(--bg-inset)', padding: '4px', borderRadius: '8px' }}>
              {[
                { id: 'slow', label: '慎重' },
                { id: 'normal', label: '標準' },
                { id: 'fast', label: '積極的' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`segment-btn ${learningSpeed === opt.id ? 'active' : ''}`}
                  onClick={() => updateAIConfig({ learningSpeed: opt.id as SpeedType })}
                  style={{ flex: 1, padding: '8px', border: 'none', background: learningSpeed === opt.id ? 'var(--color-primary-strong)' : 'transparent', borderRadius: '4px', fontWeight: learningSpeed === opt.id ? 700 : 400, color: learningSpeed === opt.id ? '#ffffff' : 'var(--text-muted)', boxShadow: learningSpeed === opt.id ? '0 2px 8px -2px var(--color-primary-glow)' : 'none', cursor: 'pointer' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 車両数 */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>1世代の同時個体数</label>
            <div className="segmented-control" style={{ display: 'flex', background: 'var(--bg-inset)', padding: '4px', borderRadius: '8px' }}>
              {[
                { id: 'low', label: '15' },
                { id: 'normal', label: '30' },
                { id: 'high', label: '50' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`segment-btn ${carCount === opt.id ? 'active' : ''}`}
                  onClick={() => updateAIConfig({ carCount: opt.id as PopulationType })}
                  style={{ flex: 1, padding: '8px', border: 'none', background: carCount === opt.id ? 'var(--color-primary-strong)' : 'transparent', borderRadius: '4px', fontWeight: carCount === opt.id ? 700 : 400, color: carCount === opt.id ? '#ffffff' : 'var(--text-muted)', boxShadow: carCount === opt.id ? '0 2px 8px -2px var(--color-primary-glow)' : 'none', cursor: 'pointer' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 学習世代数 */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>最大学習世代数</label>
            <div className="segmented-control" style={{ display: 'flex', background: 'var(--bg-inset)', padding: '4px', borderRadius: '8px' }}>
              {[10, 30, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`segment-btn ${maxGenerations === num ? 'active' : ''}`}
                  onClick={() => updateAIConfig({ maxGenerations: num as GenerationOptionType })}
                  style={{ flex: 1, padding: '8px', border: 'none', background: maxGenerations === num ? 'var(--color-primary-strong)' : 'transparent', borderRadius: '4px', fontWeight: maxGenerations === num ? 700 : 400, color: maxGenerations === num ? '#ffffff' : 'var(--text-muted)', boxShadow: maxGenerations === num ? '0 2px 8px -2px var(--color-primary-glow)' : 'none', cursor: 'pointer' }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="page-nav">
        <Button variant="ghost" onClick={() => navigate('/scenario')}>← 戻る</Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/simulation')}
          disabled={!aiPersonality}
        >
          歩行実験を開始する →
        </Button>
      </div>
    </div>
  );
};
export default ConfigPage;
