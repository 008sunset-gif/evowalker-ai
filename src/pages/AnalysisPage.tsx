import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { toMeters, GOAL_DISTANCE_M } from '../simulation/walkerPhysics3D';

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

  const padding = 45;
  const graphWidth = 700;
  const graphHeight = 230; // 2カラム配置に合わせ高さを抑制（変化は視認できる範囲を維持）

  // 距離グラフの縦軸は常にゴール距離(GOAL_DISTANCE_M)を上限とし、全画面で基準を統一
  const dynamicMaxDist = GOAL_DISTANCE_M;

  const renderGraph = (
    title: string,
    desc: string,
    dataKey: keyof WalkerGraphPoint,
    color: string,
    maxVal: number,
    unit: string
  ) => {
    const points = graphData.map((val, idx) => {
      const x = padding + (idx / (graphData.length - 1 || 1)) * (graphWidth - padding * 2);
      const ratio = Math.max(0, Math.min(1, Number(val[dataKey]) / maxVal));
      const y = graphHeight - padding - ratio * (graphHeight - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const finalVal = graphData[graphData.length - 1][dataKey];

    return (
      <div className="chart-panel card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 8px 0', color: '#0f172a' }}>
          <span>{title}</span>
          <span style={{ fontSize: '24px', fontWeight: '900', color }}>最終: {finalVal}{unit}</span>
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
          {desc}
        </p>
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px 16px 16px', overflow: 'hidden' }}>
          <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            {[0.25, 0.5, 0.75].map((ratio, i) => {
              const yVal = padding + ratio * (graphHeight - padding * 2);
              return <line key={i} x1={padding} y1={yVal} x2={graphWidth - padding} y2={yVal} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,4" />;
            })}
            <polyline fill="none" stroke={color} strokeWidth="4" points={points} strokeLinecap="round" strokeLinejoin="round" />
            {graphData.map((val, idx) => {
              const x = padding + (idx / (graphData.length - 1 || 1)) * (graphWidth - padding * 2);
              const ratio = Math.max(0, Math.min(1, Number(val[dataKey]) / maxVal));
              const y = graphHeight - padding - ratio * (graphHeight - padding * 2);
              return (
                <g key={idx}>
                  <circle cx={x} cy={y} r="6" fill={color} stroke="#fff" strokeWidth="3" />
                  {(idx === 0 || idx === graphData.length - 1) && (
                    <text x={x} y={y - 14} fill="#0f172a" fontSize="12" fontWeight="800" textAnchor="middle">{val[dataKey]}{unit}</text>
                  )}
                </g>
              );
            })}
            <text x={padding} y={graphHeight - 12} fill="#64748b" fontSize="12" fontWeight="700">第1世代</text>
            <text x={graphWidth - padding} y={graphHeight - 12} fill="#64748b" fontSize="12" fontWeight="700" textAnchor="end">第{graphData.length}世代</text>
            <text x={padding - 10} y={padding + 5} fill="#64748b" fontSize="12" fontWeight="700" textAnchor="end">{maxVal}{unit}</text>
            <text x={padding - 10} y={graphHeight - padding + 5} fill="#64748b" fontSize="12" fontWeight="700" textAnchor="end">0{unit}</text>
          </svg>
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
      
      {/* ヒーロー画像ヘッダー */}
      <div style={{ width: '100%', height: '180px', borderRadius: '16px', overflow: 'hidden', backgroundImage: 'url(/analysis_header.png)', backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '32px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to right, rgba(15,23,42,0.95), rgba(15,23,42,0.6))' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '40px', transform: 'translateY(-50%)', color: 'white' }}>
          <div className="portfolio-badge" style={{ background: 'var(--color-primary)', display: 'inline-block', marginBottom: '8px' }}>TELEMETRY & ANALYTICS</div>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>歩行データの世代分析</h2>
          <p style={{ margin: '8px 0 0 0', opacity: 0.8 }}>全世代にわたる学習過程を可視化し、進化の成果を分析します。</p>
        </div>
      </div>

      {/* ========== 結論ヘッドライン（初見でも一目で成果が分かる） ========== */}
      <div className="conclusion-headline card" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        background: '#0f172a',
        color: '#f8fafc',
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
          color: '#0f172a',
        }}>{verdictLabel}</span>
        <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.7', color: '#e2e8f0', flex: 1, minWidth: '280px' }}>
          第1世代から第{graphData.length}世代までの学習で、
          平均前進距離 <b style={{ color: '#fff' }}>{firstPoint.avgDistance}m → {lastPoint.avgDistance}m</b>、
          ゴール率 <b style={{ color: '#fff' }}>{firstPoint.goalRate}% → {lastPoint.goalRate}%</b>、
          転倒率 <b style={{ color: '#fff' }}>{firstPoint.fallRate}% → {lastPoint.fallRate}%</b>、
          コースアウト率 <b style={{ color: '#fff' }}>{firstPoint.outOfLaneRate}% → {lastPoint.outOfLaneRate}%</b> へ変化しました。
        </p>
      </div>

      <div className="evolution-summary-banner card" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '16px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '32px',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.02)'
      }}>
        <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>平均前進距離</span>
          <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: '#0f172a' }}>
            {firstPoint.avgDistance}m <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 'normal' }}>➔</span> <span style={{ color: lastPoint.avgDistance > firstPoint.avgDistance ? '#3b82f6' : lastPoint.avgDistance < firstPoint.avgDistance ? '#ef4444' : '#0f172a' }}>{lastPoint.avgDistance}m</span>
          </div>
        </div>
        <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>ゴール率</span>
          <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: '#0f172a' }}>
            {firstPoint.goalRate}% <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 'normal' }}>➔</span> <span style={{ color: lastPoint.goalRate > firstPoint.goalRate ? '#10b981' : lastPoint.goalRate < firstPoint.goalRate ? '#ef4444' : '#0f172a' }}>{lastPoint.goalRate}%</span>
          </div>
        </div>
        <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>転倒率</span>
          <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: '#0f172a' }}>
            {firstPoint.fallRate}% <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 'normal' }}>➔</span> <span style={{ color: lastPoint.fallRate < firstPoint.fallRate ? '#10b981' : lastPoint.fallRate > firstPoint.fallRate ? '#ef4444' : '#0f172a' }}>{lastPoint.fallRate}%</span>
          </div>
        </div>
        <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>コースアウト率</span>
          <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: '#0f172a' }}>
            {firstPoint.outOfLaneRate}% <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 'normal' }}>➔</span> <span style={{ color: lastPoint.outOfLaneRate < firstPoint.outOfLaneRate ? '#10b981' : lastPoint.outOfLaneRate > firstPoint.outOfLaneRate ? '#ef4444' : '#0f172a' }}>{lastPoint.outOfLaneRate}%</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>集団改善度</span>
          <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: verdictColor }}>
            {verdictLabel}
          </div>
        </div>
      </div>

      {/* ========== 主要グラフ（2カラム×2段） ========== */}
      <div className="analysis-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
        {renderGraph('平均前進距離', '全個体が平均して進めた距離。集団が「前に進む方法」を学習したかを示します。', 'avgDistance', '#3b82f6', dynamicMaxDist, 'm')}
        {renderGraph('ゴール率', 'ゴールに到達できた個体の割合。目的を達成できる優秀な遺伝子が増えたかを示します。', 'goalRate', '#10b981', 100, '%')}
        {renderGraph('転倒率', '歩行中にバランスを崩して倒れた個体の割合。学習が進むにつれて減少します。', 'fallRate', '#f59e0b', 100, '%')}
        {renderGraph('コースアウト率', '左右に逸れてレーン外へ出た個体の割合。直進性を学習できているかを示します。', 'outOfLaneRate', '#ef4444', 100, '%')}
      </div>

      {/* ========== 詳細グラフ（折りたたみ：安定歩行率） ========== */}
      <details className="analysis-details" open style={{ marginBottom: '32px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#334155', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', listStyle: 'revert' }}>
          詳細グラフ（安定歩行率）— クリックで開閉
        </summary>
        <div style={{ marginTop: '16px' }}>
          {renderGraph('安定歩行率', '転倒せず、左右のブレを抑えて歩けた個体の割合。姿勢制御を学習できたかを示します。', 'stableRate', '#0ea5e9', 100, '%')}
        </div>
      </details>

      {/* ========== ランキング & 進化比較（下部2カラム） ========== */}
      <div className="analysis-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

          <div className="milestones-panel card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: '#0f172a' }}>
              第 {lastResult?.generation || graphData.length} 世代 歩行ランキング
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '13px' }}>最新世代における、優秀なトップ3ロボットの評価</p>
            
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
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#0f172a', fontSize: '14px', marginBottom: '4px' }}>
                      <span>個体-{String(car.id).padStart(2, '0')}</span>
                      <span style={{ color: '#0ea5e9' }}>{car.finalScore} pts</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px' }}>
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

          <div className="comparison-panel card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: '#0f172a' }}>
              初期世代 vs 最終世代の進化比較
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '13px' }}>第1世代からどの程度学習成果が出たかを対比します。</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', rowGap: '20px', columnGap: '12px', fontSize: '14px', alignItems: 'center' }}>
              <div style={{ fontWeight: '700', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', color: '#64748b', fontSize: '12px' }}>評価項目</div>
              <div style={{ fontWeight: '700', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', color: '#64748b', fontSize: '12px' }}>第1世代</div>
              <div style={{ fontWeight: '700', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', color: '#64748b', fontSize: '12px' }}>最終世代</div>

              <div style={{ fontWeight: '700', color: '#334155' }}>最高スコア</div>
              <div style={{ color: '#64748b' }}>{initialBestScore}</div>
              <div style={{ color: '#0ea5e9', fontWeight: '800' }}>
                {finalBestScore}
                <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>
                  +{initialBestScore > 0 ? Math.floor(((finalBestScore - initialBestScore) / initialBestScore) * 100) : 0}%
                </div>
              </div>

              <div style={{ fontWeight: '700', color: '#334155' }}>安定歩行率</div>
              <div style={{ color: '#64748b' }}>{firstPoint.stableRate}%</div>
              <div style={{ color: '#10b981', fontWeight: '800' }}>
                {lastPoint.stableRate}%
                <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>
                  +{lastPoint.stableRate - firstPoint.stableRate}%
                </div>
              </div>

              <div style={{ fontWeight: '700', color: '#334155' }}>転倒率</div>
              <div style={{ color: '#64748b' }}>{firstPoint.fallRate}%</div>
              <div style={{ color: '#ef4444', fontWeight: '800' }}>
                {lastPoint.fallRate}%
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                  {firstPoint.fallRate - lastPoint.fallRate}%
                </div>
              </div>
            </div>
          </div>
        </div>

      <div className="navigation-actions" style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '48px' }}>
        <button onClick={() => navigate('/simulation')} className="btn btn-secondary btn-lg" style={{ width: '200px' }}>
          戻る
        </button>
        <button onClick={handleNextPage} className="btn btn-primary btn-lg pulse-glow" style={{ width: '300px' }}>
          AI総合診断レポートの作成
        </button>
      </div>
    </div>
  );
};
export default AnalysisPage;
