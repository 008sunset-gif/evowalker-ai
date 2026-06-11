import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { toMeters, GOAL_DISTANCE_M } from '../simulation/walkerPhysics3D';
import { Button } from '../components/Button';

export const AnalysisPage = () => {
  const navigate = useNavigate();
  const {
    mockEvolutionHistory,
    isSimulationCompleted,
    completeSimulation,
    carCount,
  } = useSimulation();

  useEffect(() => {
    if (!isSimulationCompleted && mockEvolutionHistory.length === 0) {
      navigate('/simulation');
    }
  }, [isSimulationCompleted, mockEvolutionHistory, navigate]);

  const maxCarCount = carCount === 'high' ? 50 : carCount === 'low' ? 15 : 30;

  interface WalkerGraphPoint {
    stableRate: number;
    avgDistance: number;
    fallRate: number;
    outOfLaneRate: number;
    goalRate: number;
    bestScore: number;
    averageScore: number;
  }

  const getGraphData = (): WalkerGraphPoint[] => {
    if (mockEvolutionHistory && mockEvolutionHistory.length > 0) {
      return mockEvolutionHistory.map((g) => {
        const total = maxCarCount; // 母数は常に初期個体数とする

        // 平均前進距離は実データ（各個体の distanceTravelled の平均をメートル換算した値）を使用。
        // スコアからの逆算は行わない。0〜GOAL_DISTANCE_M(ゴール)の範囲。
        const avgDistance = Math.max(0, Math.min(GOAL_DISTANCE_M, Math.floor(g.averageDistance ?? 0)));

        // 各種レート (0〜100%)
        const stableRate = Math.min(100, Math.max(0, Math.floor((g.aliveCount / total) * 100)));
        const fallRate = Math.min(100, Math.max(0, Math.floor((g.fallenCount / total) * 100)));
        const outOfLaneRate = Math.min(100, Math.max(0, Math.floor((g.outOfLaneCount / total) * 100)));
        const goalRate = Math.min(100, Math.max(0, Math.floor((g.completedCount / total) * 100)));
        
        return {
          stableRate,
          avgDistance,
          fallRate,
          outOfLaneRate,
          goalRate,
          bestScore: g.bestScore,
          averageScore: g.averageScore
        };
      });
    }
    
    return [{
      stableRate: 0, avgDistance: 0, fallRate: 0, outOfLaneRate: 0, goalRate: 0, bestScore: 0, averageScore: 0
    }];
  };

  const graphData = getGraphData();
  const firstPoint = graphData[0];
  const lastPoint = graphData[graphData.length - 1];
  const finalBestScore = lastPoint.bestScore;
  const initialBestScore = firstPoint.bestScore;

  // 集団としての改善判定（バナー・結論ヘッドラインで共通利用。データ計算ロジックは従来どおり）
  const isImproved = lastPoint.avgDistance > firstPoint.avgDistance + 5 || lastPoint.goalRate > firstPoint.goalRate;
  const isWorsened = lastPoint.avgDistance < firstPoint.avgDistance - 5;
  const verdictLabel = isImproved ? '改善あり' : isWorsened ? '悪化' : '停滞';
  const verdictColor = isImproved ? '#10b981' : isWorsened ? '#ef4444' : '#f59e0b';

  // 第1世代→最終世代の Before/After を、数値の大小とバーで一目で見せる（少ない世代数でも有効）
  const renderMetric = (
    label: string,
    before: number,
    after: number,
    unit: string,
    higherIsBetter: boolean,
    barMax: number
  ) => {
    const improved = higherIsBetter ? after > before : after < before;
    const worsened = higherIsBetter ? after < before : after > before;
    const color = improved ? '#34d399' : worsened ? '#f87171' : '#fbbf24';
    const status = improved ? '改善' : worsened ? '悪化' : '横ばい';
    const delta = after - before;
    const pct = (v: number) => Math.max(2, Math.min(100, (v / (barMax || 1)) * 100));
    return (
      <div className="metric-card card" style={{ padding: '20px 22px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</span>
          <span style={{ fontSize: '11px', fontWeight: 800, color, background: `${color}22`, padding: '3px 10px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
            {status}{delta !== 0 ? `　${delta > 0 ? '+' : ''}${delta}${unit}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-faint)' }}>{before}{unit}</span>
          <span style={{ fontSize: '15px', color: 'var(--text-faint)' }}>→</span>
          <span style={{ fontSize: '34px', fontWeight: 900, color, lineHeight: 1 }}>{after}{unit}</span>
        </div>
        <div style={{ position: 'relative', height: '8px', borderRadius: '999px', background: 'var(--bg-inset)', overflow: 'visible' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct(after)}%`, background: color, borderRadius: '999px', transition: 'width 0.6s ease' }} />
          {/* 第1世代の位置マーカー */}
          <div title={`第1世代 ${before}${unit}`} style={{ position: 'absolute', top: '-4px', bottom: '-4px', left: `calc(${pct(before)}% - 1px)`, width: '2px', background: 'var(--text-faint)', borderRadius: '2px' }} />
        </div>
      </div>
    );
  };

  const lastResult = mockEvolutionHistory && mockEvolutionHistory.length > 0
    ? mockEvolutionHistory[mockEvolutionHistory.length - 1]
    : null;

  const ranking = lastResult ? lastResult.topVehicles : [
    { id: 1, finalScore: 1210, waypointsPassed: 5, distanceTravelled: 300, aliveTime: 1200, crashReason: 'ゴール到達', reachedGoal: true },
    { id: 3, finalScore: 1140, waypointsPassed: 5, distanceTravelled: 300, aliveTime: 1280, crashReason: 'ゴール到達', reachedGoal: true },
    { id: 7, finalScore: 920, waypointsPassed: 4, distanceTravelled: 210, aliveTime: 920, crashReason: '転倒', reachedGoal: false },
  ];

  const handleNextPage = () => {
    // ResultPageに飛ぶ前に評価データを生成してセットする
    import('../simulation/resultEvaluation').then(({ evaluateEvolutionHistory }) => {
      const finalResult = evaluateEvolutionHistory(mockEvolutionHistory);
      completeSimulation(finalResult);
      navigate('/result');
    });
  };

  return (
    <div className="analysis-page-container fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      
      {/* ヘッダーバナー */}
      <div className="page-banner">
        <div className="page-banner__inner">
          <div className="portfolio-badge" style={{ background: 'var(--color-primary)', color: '#06131f', display: 'inline-block', marginBottom: '10px' }}>TELEMETRY & ANALYTICS</div>
          <h2 style={{ margin: 0, fontSize: 'clamp(24px, 3vw, 34px)', color: 'var(--text-title)' }}>歩行データの世代分析</h2>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)' }}>全世代にわたる学習過程を可視化し、進化の成果を分析します。</p>
        </div>
      </div>

      {/* ========== 結論ヘッドライン（初見でも一目で成果が分かる） ========== */}
      <div className="conclusion-headline card" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        background: 'var(--bg-inset)',
        color: 'var(--text-title)',
        padding: '20px 28px',
        borderRadius: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        <span style={{
          flexShrink: 0,
          fontSize: '20px',
          fontWeight: 900,
          padding: '8px 18px',
          borderRadius: '12px',
          background: verdictColor,
          color: '#0b1220',
        }}>{verdictLabel}</span>
        <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.7', color: 'var(--text-main)', flex: 1, minWidth: '280px' }}>
          第1世代から第{graphData.length}世代までの学習で、
          平均前進距離 <b style={{ color: '#fff' }}>{firstPoint.avgDistance}m → {lastPoint.avgDistance}m</b>、
          ゴール率 <b style={{ color: '#fff' }}>{firstPoint.goalRate}% → {lastPoint.goalRate}%</b>、
          転倒率 <b style={{ color: '#fff' }}>{firstPoint.fallRate}% → {lastPoint.fallRate}%</b>、
          コースアウト率 <b style={{ color: '#fff' }}>{firstPoint.outOfLaneRate}% → {lastPoint.outOfLaneRate}%</b> へ変化しました。
        </p>
      </div>

      {/* ========== 第1世代 → 最終世代の変化（Before/After を視覚化） ========== */}
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-title)', margin: '0 0 6px' }}>
        第1世代 → 最終世代の変化
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 18px' }}>
        バーは最終世代の値、細い縦線が第1世代の位置です。緑＝改善 / 赤＝悪化。
      </p>
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {renderMetric('平均前進距離', firstPoint.avgDistance, lastPoint.avgDistance, 'm', true, GOAL_DISTANCE_M)}
        {renderMetric('ゴール率', firstPoint.goalRate, lastPoint.goalRate, '%', true, 100)}
        {renderMetric('安定歩行率', firstPoint.stableRate, lastPoint.stableRate, '%', true, 100)}
        {renderMetric('転倒率', firstPoint.fallRate, lastPoint.fallRate, '%', false, 100)}
        {renderMetric('コースアウト率', firstPoint.outOfLaneRate, lastPoint.outOfLaneRate, '%', false, 100)}
        {renderMetric('最高スコア', initialBestScore, finalBestScore, '', true, Math.max(finalBestScore, initialBestScore, 1))}
      </div>

      {/* ========== ランキング & 進化比較（下部2カラム） ========== */}
      <div className="analysis-bottom-grid">

          <div className="milestones-panel card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-title)' }}>
              第 {lastResult?.generation || graphData.length} 世代 歩行ランキング
            </h3>
            <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)', fontSize: '13px' }}>最新世代における、優秀なトップ3ロボットの評価</p>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                完走・生存: {lastResult ? lastResult.aliveCount : maxCarCount - 6}体
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                転倒: {lastResult ? lastResult.crashCount : 6}体
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ranking.map((car, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'var(--bg-inset)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `6px solid ${idx === 0 ? '#ecc94b' : idx === 1 ? '#cbd5e1' : '#ed8936'}`
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px',
                    fontWeight: '800',
                    background: idx === 0 ? '#ecc94b' : idx === 1 ? '#94a3b8' : '#ed8936',
                    color: '#fff',
                    fontSize: '12px',
                  }}>{idx + 1}</div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: 'var(--text-title)', fontSize: '14px', marginBottom: '4px' }}>
                      <span>個体-{String(car.id).padStart(2, '0')}</span>
                      <span style={{ color: '#0ea5e9' }}>{car.finalScore} pts</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                      <span>距離: {car.reachedGoal ? GOAL_DISTANCE_M : toMeters(car.distanceTravelled)}m</span>
                      <span>生存: {car.aliveTime}F</span>
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: car.reachedGoal ? '#10b981' : '#ef4444', 
                      marginTop: '8px', 
                      fontWeight: '700',
                    }}>
                      {car.reachedGoal ? '完走（ゴール到達）' : car.crashReason || '歩行停止'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      <div className="page-nav">
        <Button variant="ghost" onClick={() => navigate('/simulation')}>← 戻る</Button>
        <Button variant="primary" size="lg" onClick={handleNextPage}>
          総合診断レポートを作成 →
        </Button>
      </div>
    </div>
  );
};
export default AnalysisPage;
