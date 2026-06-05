import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { SCENARIOS } from '../data/scenarios';
import type { ScenarioType } from '../types/simulation';

interface ScenarioCardProps {
  id: ScenarioType;
  title: string;
  description: string;
  difficulty: string;
  curveCount: string;
  obstacleDensity: string;
  recommendedAI: string;
  isSelected: boolean;
  onSelect: () => void;
}

const ScenarioCard = ({
  id,
  title,
  description,
  difficulty,
  curveCount,
  obstacleDensity,
  recommendedAI,
  isSelected,
  onSelect,
}: ScenarioCardProps) => {
  const imageUrl = `/stage_${id}.png`;

  return (
    <div
      className={`scenario-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}
    >
      <div style={{ width: '100%', height: '180px', backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: isSelected ? 'rgba(14, 165, 233, 0.2)' : 'rgba(0,0,0,0.4)', transition: 'background 0.3s ease' }}></div>
        <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
          <span className="difficulty-badge" style={{ background: 'rgba(15, 23, 42, 0.8)', color: 'white', border: 'none', fontWeight: 600 }}>{difficulty}</span>
        </div>
      </div>
      
      <div style={{ padding: '20px' }}>
        <h3 className="scenario-title" style={{ marginTop: 0, marginBottom: '8px' }}>{title}</h3>
        <p className="scenario-desc" style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>{description}</p>
        
        <div className="scenario-specs-box" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div className="scenario-spec-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
            <span className="spec-name" style={{ color: '#64748b' }}>レーン幅</span>
            <span className="spec-val" style={{ fontWeight: 600 }}>{curveCount}</span>
          </div>
          <div className="scenario-spec-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
            <span className="spec-name" style={{ color: '#64748b' }}>障害物</span>
            <span className="spec-val" style={{ fontWeight: 600 }}>{obstacleDensity}</span>
          </div>
          <div className="scenario-spec-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span className="spec-name" style={{ color: '#64748b' }}>推奨方針</span>
            <span className="spec-val" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{recommendedAI}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ScenarioPage = () => {
  const navigate = useNavigate();
  const { selectedScenarioId, selectScenario } = useSimulation();

  return (
    <div className="scenario-page-container fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <div className="page-header-section" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div className="portfolio-badge" style={{ background: 'var(--color-primary)', color: 'white', letterSpacing: '1px', fontWeight: 700, display: 'inline-block', marginBottom: '16px' }}>STAGE SELECTION</div>
        <h2 className="page-title" style={{ fontSize: '2.5rem', color: '#0f172a' }}>歩行レーンの選択</h2>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', color: '#475569' }}>AIが学習・歩行を行うテストレーンを選択してください。</p>
      </div>

      <div className="scenarios-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {SCENARIOS.map((sc) => (
          <ScenarioCard
            key={sc.id}
            id={sc.id}
            title={sc.title}
            description={sc.desc}
            difficulty={sc.difficulty}
            curveCount={sc.curveCount}
            obstacleDensity={sc.obstacleDensity}
            recommendedAI={sc.recommendedAI}
            isSelected={selectedScenarioId === sc.id}
            onSelect={() => selectScenario(sc.id)}
          />
        ))}
      </div>

      <div className="navigation-actions" style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
        <button onClick={() => navigate('/')} className="btn btn-secondary btn-lg" style={{ width: '200px' }}>
          戻る
        </button>
        <button
          onClick={() => navigate('/config')}
          disabled={!selectedScenarioId}
          className="btn btn-primary btn-lg pulse-glow"
          style={{ width: '250px' }}
        >
          歩行AIを設定する
        </button>
      </div>
    </div>
  );
};
export default ScenarioPage;
