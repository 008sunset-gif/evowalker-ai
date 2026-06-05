import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { AI_PROFILES } from '../data/aiProfiles';
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
      
      {/* ヒーロー画像ヘッダー */}
      <div style={{ width: '100%', height: '200px', borderRadius: '16px', overflow: 'hidden', backgroundImage: 'url(/ai_config.png)', backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '32px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to right, rgba(15,23,42,0.9), rgba(15,23,42,0.4))' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '40px', transform: 'translateY(-50%)', color: 'white' }}>
          <div className="portfolio-badge" style={{ background: 'var(--color-primary)', display: 'inline-block', marginBottom: '8px' }}>AI CONFIGURATION</div>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>歩行AIの設定</h2>
          <p style={{ margin: '8px 0 0 0', opacity: 0.8 }}>遺伝的アルゴリズムのパラメータと学習環境を設定します。</p>
        </div>
      </div>

      <div className="config-form-container" style={{ background: 'rgba(255,255,255,0.8)', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        
        {/* AIの性格設定 */}
        <div className="form-group" style={{ marginBottom: '32px' }}>
          <label className="form-label" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>歩行方針（優先事項） <span className="recommended" style={{ background: '#e0f2fe', color: 'var(--color-primary)', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>おすすめ</span></label>
          <p className="form-desc" style={{ color: '#64748b', marginBottom: '16px' }}>
            AIが学習を進めるうえで最も重視する行動評価軸です。初期設定では「安定重視」が選択されています。そのままでも始められます。
          </p>
          <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {AI_PROFILES.map((opt) => (
              <div
                key={opt.id}
                className={`option-card ${aiPersonality === opt.id ? 'selected' : ''}`}
                onClick={() => updateAIConfig({ aiPersonality: opt.id })}
                style={{
                  border: aiPersonality === opt.id ? '2px solid var(--color-primary)' : '1px solid #cbd5e1',
                  background: aiPersonality === opt.id ? '#f0f9ff' : 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', color: aiPersonality === opt.id ? 'var(--color-primary)' : '#334155' }}>{opt.title}</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{opt.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          {/* 学習スタイル（突然変異の強さ） */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>学習スタイル（変異の強さ）</label>
            <div className="segmented-control" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
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
                  style={{ flex: 1, padding: '8px', border: 'none', background: learningSpeed === opt.id ? 'white' : 'transparent', borderRadius: '4px', fontWeight: learningSpeed === opt.id ? 700 : 400, color: learningSpeed === opt.id ? 'var(--color-primary)' : '#64748b', boxShadow: learningSpeed === opt.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 車両数 */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>1世代の同時個体数</label>
            <div className="segmented-control" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
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
                  style={{ flex: 1, padding: '8px', border: 'none', background: carCount === opt.id ? 'white' : 'transparent', borderRadius: '4px', fontWeight: carCount === opt.id ? 700 : 400, color: carCount === opt.id ? 'var(--color-primary)' : '#64748b', boxShadow: carCount === opt.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 学習世代数 */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>最大学習世代数</label>
            <div className="segmented-control" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
              {[10, 30, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`segment-btn ${maxGenerations === num ? 'active' : ''}`}
                  onClick={() => updateAIConfig({ maxGenerations: num as GenerationOptionType })}
                  style={{ flex: 1, padding: '8px', border: 'none', background: maxGenerations === num ? 'white' : 'transparent', borderRadius: '4px', fontWeight: maxGenerations === num ? 700 : 400, color: maxGenerations === num ? 'var(--color-primary)' : '#64748b', boxShadow: maxGenerations === num ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="navigation-actions" style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
        <button onClick={() => navigate('/scenario')} className="btn btn-secondary btn-lg" style={{ width: '200px' }}>
          戻る
        </button>
        <button
          onClick={() => navigate('/briefing')}
          disabled={!aiPersonality}
          className="btn btn-primary btn-lg pulse-glow"
          style={{ width: '250px' }}
        >
          最終確認へ進む
        </button>
      </div>
    </div>
  );
};
export default ConfigPage;
