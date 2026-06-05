import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { SCENARIOS } from '../data/scenarios';
import { COURSE_LAYOUTS } from '../data/courseData';
import { initVehicles } from '../simulation/vehiclePhysics';
import { evaluateEvolutionHistory } from '../simulation/resultEvaluation';
import { generateNextGenerationGenomes } from '../simulation/evolution';
import { Canvas } from '@react-three/fiber';
import { SceneSetup } from '../components/three/SceneSetup';
import { LaneEnvironment3D } from '../components/three/LaneEnvironment3D';
import { WalkerRobot3D } from '../components/three/WalkerRobot3D';
import { ParticleSystem3D } from '../components/three/ParticleSystem3D';
import { useSimulationLoop } from '../hooks/useSimulationLoop';
import { DynamicCamera } from '../components/three/DynamicCamera';
import type { VehicleState, GenerationResult, ScenarioType } from '../types/simulation';

// ============================================================
// SimulationScene: Canvas内コンポーネント
// ※ isRunningRef / runSpeedRef / currentGenerationRef を Ref で受け取ることで
//    stale closure を防ぐ（Ref の変化は再レンダリングを起こさないため、
//    useFrame 内で直接 .current を読む方式が最も確実）
// ============================================================
const SimulationScene = ({
  vehiclesRef,
  isRunningRef,
  runSpeedRef,
  currentGenerationRef,
  startPoint,
  onGenerationEnd,
  setAliveCars,
  setStableWalkRate,
  setMaxDistance,
  scenarioId,
  goalX,
}: {
  vehiclesRef: React.MutableRefObject<VehicleState[]>;
  isRunningRef: React.MutableRefObject<boolean>;
  runSpeedRef: React.MutableRefObject<number>;
  currentGenerationRef: React.MutableRefObject<number>;
  startPoint: { x: number; y: number };
  onGenerationEnd: (timeLimitExceeded: boolean) => void;
  setAliveCars: (count: number) => void;
  setStableWalkRate: (rate: number) => void;
  setMaxDistance: (dist: number) => void;
  scenarioId: ScenarioType;
  goalX: number;
}) => {
  const { particles } = useSimulationLoop({
    vehiclesRef,
    isRunningRef,
    runSpeedRef,
    currentGenerationRef,
    startPoint,
    onGenerationEnd,
    setAliveCars,
    setStableWalkRate,
    setMaxDistance,
  });

  return (
    <>
      <SceneSetup />
      <DynamicCamera vehiclesRef={vehiclesRef} />
      <LaneEnvironment3D scenarioId={scenarioId} goalX={goalX} />
      <ParticleSystem3D particles={particles} />
      {(() => {
        const maxScore = vehiclesRef.current.reduce((max, v) => Math.max(max, v.finalScore || 0), 0);
        const bestWalker = vehiclesRef.current.find(v => (v.finalScore || 0) === maxScore);
        const bestId = bestWalker ? bestWalker.id : -1;

        return vehiclesRef.current.map((walker: VehicleState, idx: number) => (
          <WalkerRobot3D
            key={`w-${walker.id}-${idx}`}
            walker={walker}
            isElite={walker.id === bestId}
          />
        ));
      })()}
    </>
  );
};

// ============================================================
// SimulationPage: メインコンポーネント
// ============================================================
export const SimulationPage = () => {
  const navigate = useNavigate();
  const {
    selectedScenarioId,
    aiPersonality,
    carCount,
    maxGenerations,
    currentGeneration,
    setCurrentGeneration,
    simulationStatus,
    mockEvolutionHistory,
    setMockEvolutionHistory,
    startSimulation,
    pauseSimulation,
    completeSimulation,
    isSimulationCompleted,
    learningSpeed,
  } = useSimulation();

  const [aliveCars, setAliveCars] = useState<number>(30);
  const [stableWalkRate, setStableWalkRate] = useState<number>(0);
  const [maxDistance, setMaxDistance] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [runSpeed, setRunSpeed] = useState<number>(1);

  const vehiclesRef = useRef<VehicleState[]>([]);
  const isTransitioningRef = useRef<boolean>(false);
  const initialBestScoreRef = useRef<number>(0);

  // ============================================================
  // Refs で最新値を保持 → Canvas/useFrame 側で stale closure を防ぐ
  // ============================================================
  const isRunningRef = useRef<boolean>(false);
  const runSpeedRef = useRef<number>(1);
  const currentGenerationRef = useRef<number>(currentGeneration);

  // runSpeed が変わるたびに Ref を同期
  useEffect(() => {
    runSpeedRef.current = runSpeed;
  }, [runSpeed]);

  // currentGeneration が変わるたびに Ref を同期
  useEffect(() => {
    currentGenerationRef.current = currentGeneration;
  }, [currentGeneration]);

  // simulationStatus が変わるたびに isRunningRef を同期
  useEffect(() => {
    isRunningRef.current = simulationStatus === 'running';
  }, [simulationStatus]);

  const selectedScenario = SCENARIOS.find((sc) => sc.id === selectedScenarioId);
  const scenarioTitle = selectedScenario ? selectedScenario.title : '未選択';
  const layout = selectedScenarioId ? COURSE_LAYOUTS[selectedScenarioId] : null;

  // ============================================================
  // 初期化 & 自動開始
  // ============================================================
  useEffect(() => {
    if (!selectedScenarioId || !aiPersonality) {
      navigate('/config');
      return;
    }

    const defaultCarsCount = carCount === 'high' ? 50 : carCount === 'low' ? 15 : 30;
    const sim3DStartPoint = { x: 0, y: 0, angle: 0 };

    if (vehiclesRef.current.length === 0) {
      vehiclesRef.current = initVehicles(defaultCarsCount, sim3DStartPoint, aiPersonality);
      setAliveCars(defaultCarsCount);
      setLogs([
        `[システム] 第1世代の歩行実験を開始します。環境: ${scenarioTitle}`,
        `[システム] ${defaultCarsCount}体のAI個体を生成しました。`,
      ]);
    }

    // 自動でシミュレーション開始（Ref を直接 true にしてから context も更新）
    isRunningRef.current = true;
    startSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // 世代終了ハンドラ
  // ============================================================
  const handleGenerationEnd = useCallback(
    (timeLimitExceeded: boolean) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      // 世代終了中は物理停止
      isRunningRef.current = false;

      const endReason = timeLimitExceeded ? 'タイムアップ' : '';

      vehiclesRef.current = vehiclesRef.current.map((v) => {
        if (v.isActive) {
          v.isActive = false;
          v.speed = 0;
          v.steering = 0;
          v.crashReason = endReason;
          v.finalScore = Math.max(
            0,
            Math.floor(v.distanceTravelled * 1.8 + v.aliveTime * 0.2 - 50)
          );
        }
        return v;
      });

      const sortedVehicles = [...vehiclesRef.current].sort(
        (a, b) => b.finalScore - a.finalScore
      );
      const bestVehicle = sortedVehicles[0];
      const bestScore = bestVehicle.finalScore;
      const averageScore = Math.floor(
        vehiclesRef.current.reduce((sum, v) => sum + v.finalScore, 0) /
          vehiclesRef.current.length
      );

      const fallenCount = vehiclesRef.current.filter((v) => v.status === 'fallen').length;
      const outOfLaneCount = vehiclesRef.current.filter((v) => v.status === 'outOfLane').length;
      const stalledCount = vehiclesRef.current.filter((v) => v.status === 'stalled').length;
      const completedCount = vehiclesRef.current.filter((v) => v.status === 'goal').length;
      const crashCount = fallenCount + outOfLaneCount + stalledCount;
      const aliveCountFinal = vehiclesRef.current.length - crashCount;

      const crashRate = crashCount / vehiclesRef.current.length;
      let resultType: 'safety' | 'speed' | 'balance' = 'balance';
      if (crashRate < 0.25) resultType = 'safety';
      else if (bestScore > 6500 && crashRate > 0.4) resultType = 'speed';

      const genResult: GenerationResult = {
        generation: currentGenerationRef.current,
        bestScore,
        averageScore,
        crashCount,
        fallenCount,
        outOfLaneCount,
        stalledCount,
        aliveCount: aliveCountFinal,
        bestVehicleId: bestVehicle.id,
        topVehicles: sortedVehicles.slice(0, 3).map((v) => ({
          id: v.id,
          finalScore: v.finalScore,
          waypointsPassed: v.waypointsPassed,
          distanceTravelled: Math.floor(v.distanceTravelled),
          aliveTime: v.aliveTime,
          crashReason: v.crashReason || (v.reachedGoal ? 'ゴール到達' : '完走'),
          reachedGoal: v.reachedGoal,
        })),
        completedCount,
        resultType,
      };

      const newHistory = [...mockEvolutionHistory, genResult];
      setMockEvolutionHistory(newHistory);

      const stableRate =
        vehiclesRef.current.length > 0
          ? Math.floor((aliveCountFinal / vehiclesRef.current.length) * 100)
          : 0;
      const isStableEnough =
        stableRate >= 80 && currentGenerationRef.current >= 8;
      const isStagnated =
        newHistory.length >= 6 &&
        currentGenerationRef.current >= 15 &&
        (() => {
          const last3 = newHistory.slice(-3);
          return (
            Math.max(...last3.map((h) => h.bestScore)) -
              Math.min(...last3.map((h) => h.bestScore)) <
            20
          );
        })();

      // Do not early convert just because 1 completed. 
      // Only early convert if highly stable AND reached goal for multiple generations, or max is reached.
      const shouldEarlyConvert = isStableEnough && completedCount > (vehiclesRef.current.length * 0.3) || isStagnated;
      const isLastGeneration =
        currentGenerationRef.current >= maxGenerations || shouldEarlyConvert;

      if (isLastGeneration) {
        const mockResult = evaluateEvolutionHistory(newHistory);
        completeSimulation(mockResult);

        let endLogMsg = `[システム] 全世代（${maxGenerations}世代）の歩行実験が完了しました。`;
        if (completedCount > 0)
          endLogMsg = `[システム] 個体がゴールに到達！歩行学習を早期完了しました！🎉`;
        else if (isStableEnough)
          endLogMsg = `[システム] 安定歩行率が高まったため（${stableRate}%）、学習を早期完了！`;

        setLogs((l) => [
          ...l,
          endLogMsg,
          `[システム] 最終ベストスコア: ${bestScore} pts`,
          `[システム] 分析へ進んでください。`,
        ]);
        isTransitioningRef.current = false;
      } else {
        const nextGen = currentGenerationRef.current + 1;
        const nextGenData = generateNextGenerationGenomes(
          vehiclesRef.current,
          learningSpeed
        );

        if (currentGenerationRef.current === 1)
          initialBestScoreRef.current = bestScore;
        const scoreImpPercent =
          initialBestScoreRef.current > 0
            ? Math.max(
                0,
                Math.floor(
                  ((bestScore - initialBestScoreRef.current) /
                    initialBestScoreRef.current) *
                    100
                )
              )
            : 0;

        const defaultCarsCount =
          carCount === 'high' ? 50 : carCount === 'low' ? 15 : 30;
        const sim3DStartPoint = { x: 0, y: 0, angle: 0 };
        vehiclesRef.current = initVehicles(
          defaultCarsCount,
          sim3DStartPoint,
          aiPersonality,
          nextGenData.genomes
        );

        setAliveCars(defaultCarsCount);
        setStableWalkRate(0);
        setMaxDistance(0);

        setLogs((l) => [
          ...l,
          `[システム] 第${nextGen}世代を生成しました。`,
          scoreImpPercent > 0
            ? `[システム] 最高歩行スコアが${scoreImpPercent}%改善！`
            : `[システム] 最高歩行スコア: ${bestScore} pts`,
        ]);

        // 次世代を開始（少し遅延させて確実に vehiclesRef が更新されてから）
        setTimeout(() => {
          isTransitioningRef.current = false;
          isRunningRef.current = true;
          setCurrentGeneration(nextGen);
          startSimulation();
        }, 200);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mockEvolutionHistory, maxGenerations, learningSpeed, carCount, aiPersonality]
  );

  const handleToggleSimulate = () => {
    if (isSimulationCompleted) return;
    if (simulationStatus === 'running') {
      isRunningRef.current = false;
      pauseSimulation();
    } else {
      isRunningRef.current = true;
      startSimulation();
    }
  };

  const handleNextPage = () => {
    isRunningRef.current = false;
    pauseSimulation();
    navigate('/analysis');
  };

  if (!layout) return null;

  return (
    <div
      className="page-container simulation-page fade-in"
      style={{ padding: '0', maxWidth: '100vw', height: '100vh', overflow: 'hidden' }}
    >
      {/* 3D Canvas フルスクリーン */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <Canvas shadows camera={{ fov: 50, near: 0.1, far: 2000 }}>
          <SimulationScene
            vehiclesRef={vehiclesRef}
            isRunningRef={isRunningRef}
            runSpeedRef={runSpeedRef}
            currentGenerationRef={currentGenerationRef}
            startPoint={{ x: 0, y: 0 }}
            onGenerationEnd={handleGenerationEnd}
            setAliveCars={setAliveCars}
            setStableWalkRate={setStableWalkRate}
            setMaxDistance={setMaxDistance}
            scenarioId={selectedScenarioId}
            goalX={300}
          />
        </Canvas>
      </div>

      {/* HUD オーバーレイ */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', bottom: '20px', zIndex: 10, pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

        {/* トップバー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="card hud-panel" style={{ pointerEvents: 'auto', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(14, 165, 233, 0.4)', borderRadius: '12px', width: '320px', padding: '20px', color: '#f8fafc', boxShadow: '0 0 20px rgba(14, 165, 233, 0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontFamily: 'var(--font-cyber)', color: 'var(--color-primary)', letterSpacing: '2px', textTransform: 'uppercase', borderBottom: '1px solid rgba(14, 165, 233, 0.2)', paddingBottom: '8px' }}>
              NEURAL TELEMETRY
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-hud)', letterSpacing: '1px' }}>GENERATION</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'var(--font-hud)', color: '#38bdf8' }}>
                  {currentGeneration} <span style={{ fontSize: '12px', color: '#64748b' }}>/ {maxGenerations}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-hud)', letterSpacing: '1px' }}>ACTIVE UNITS</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'var(--font-hud)', color: '#34d399' }}>{aliveCars}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-hud)', letterSpacing: '1px' }}>STABILITY</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'var(--font-hud)', color: '#0ea5e9' }}>{stableWalkRate}%</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-hud)', letterSpacing: '1px' }}>MAX DISTANCE</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'var(--font-hud)', color: '#38bdf8' }}>{Math.floor(maxDistance / 5)}m</div>
              </div>
            </div>
          </div>

          <div className="card hud-panel" style={{ pointerEvents: 'auto', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(14, 165, 233, 0.4)', borderRadius: '12px', width: '320px', padding: '20px', color: '#f8fafc', boxShadow: '0 0 20px rgba(14, 165, 233, 0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontFamily: 'var(--font-cyber)', color: 'var(--color-primary)', letterSpacing: '2px', textTransform: 'uppercase', borderBottom: '1px solid rgba(14, 165, 233, 0.2)', paddingBottom: '8px' }}>
              SYSTEM LOGS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto', fontSize: '12px', fontFamily: 'var(--font-body)', color: '#cbd5e1' }}>
              {logs.slice(-5).map((log, idx) => (
                <div key={idx} style={{ paddingLeft: '8px', borderLeft: '2px solid rgba(14, 165, 233, 0.5)' }}>{log}</div>
              ))}
            </div>
          </div>
        </div>

        {/* ボトムバー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div className="card hud-panel" style={{ pointerEvents: 'auto', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(14, 165, 233, 0.4)', borderRadius: '12px', display: 'flex', gap: '20px', alignItems: 'center', padding: '16px 24px', boxShadow: '0 0 20px rgba(14, 165, 233, 0.1)' }}>
            <button
              onClick={handleToggleSimulate}
              className="btn"
              style={{
                background: simulationStatus === 'running' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: simulationStatus === 'running' ? '#fca5a5' : '#6ee7b7',
                border: `1px solid ${simulationStatus === 'running' ? '#ef4444' : '#10b981'}`,
                padding: '8px 24px',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: '700',
              }}
            >
              {simulationStatus === 'running' ? '⏸ 一時停止' : '▶ 再開'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'var(--font-hud)', letterSpacing: '1px' }}>速度:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRunSpeed(s)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      border: `1px solid ${runSpeed === s ? '#38bdf8' : 'rgba(255,255,255,0.2)'}`,
                      background: runSpeed === s ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                      color: runSpeed === s ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 'bold',
                    }}
                  >
                    {s}倍速
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ pointerEvents: 'auto', display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/config')} className="btn btn-secondary" style={{ fontFamily: 'var(--font-sans)' }}>
              設定に戻る
            </button>
            <button
              onClick={handleNextPage}
              disabled={mockEvolutionHistory.length === 0}
              className="btn btn-primary pulse-glow"
              style={{ fontFamily: 'var(--font-sans)', padding: '12px 32px' }}
            >
              分析へ進む
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SimulationPage;
