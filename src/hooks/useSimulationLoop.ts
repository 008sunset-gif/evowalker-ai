import { useRef, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { updateWalkerPhysics3D, getLaneHalfWidth } from '../simulation/walkerPhysics3D';
import type { VehicleState } from '../types/simulation';
import type { ParticleData, ParticleType } from '../components/three/ParticleSystem3D';

interface UseSimulationLoopProps {
  vehiclesRef: React.MutableRefObject<VehicleState[]>;
  // isRunning を boolean ではなく Ref で受け取ることで stale closure を防ぐ
  isRunningRef: React.MutableRefObject<boolean>;
  runSpeedRef: React.MutableRefObject<number>;
  currentGenerationRef: React.MutableRefObject<number>;
  startPoint: { x: number; y: number };
  onGenerationEnd: (timeLimitExceeded: boolean) => void;
  setAliveCars: (count: number) => void;
  setStableWalkRate: (rate: number) => void;
  setMaxDistance: (dist: number) => void;
  scenarioId?: string;
}

// 最低フレーム数（これ以下では世代終了判定しない）
const MIN_FRAMES_BEFORE_END = 60; // 約1秒
// 世代最大フレーム数
const GENERATION_TIME_LIMIT_FRAMES = 3000;

export const useSimulationLoop = ({
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
}: UseSimulationLoopProps) => {
  const particlesRef = useRef<ParticleData[]>([]);
  const particleIdCounter = useRef(0);
  const frameCountRef = useRef(0);
  const simFrameCountRef = useRef(0); // シミュレーション経過フレーム数（リセット時にも0に戻す）
  const onGenEndRef = useRef<(t: boolean) => void>(onGenerationEnd);

  useEffect(() => {
    onGenEndRef.current = onGenerationEnd;
  }, [onGenerationEnd]);

  const spawnParticle = useCallback(
    (type: ParticleType, x: number, y: number, color?: string, vy: number = 0) => {
      particlesRef.current.push({
        id: ++particleIdCounter.current,
        type,
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: vy || Math.random() * 2,
        alpha: 1.0,
        size: type === 'ripple' ? 0.1 : Math.random() * 1.5 + 0.5,
        color: color || '#ffffff',
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
      });
    },
    []
  );

  useFrame(() => {
    // ============================================================
    // 毎フレーム isRunningRef.current を直接参照 (stale closure 回避)
    // ============================================================
    if (!isRunningRef.current) return;

    const runSpeed = runSpeedRef.current;
    const currentGeneration = currentGenerationRef.current;

    let localMaxDistance = 0;
    let localAliveCount = 0;
    let localStableCount = 0;
    let generationEnded = false;

    for (let step = 0; step < runSpeed; step++) {
      let activeCountInStep = 0;
      let stableCountInStep = 0;

      vehiclesRef.current.forEach(walker => {
        const wasActive = walker.isActive;

        // 物理更新
        updateWalkerPhysics3D(
          walker,
          startPoint,
          currentGeneration,
          (x, y, isLeft) => {
            // 物理判定は毎サブステップ実行するが、足音パーティクルは装飾のため
            // 高速時(10倍速超)は抑制して描画負荷を下げる（50倍速でも固まらないように）
            if (runSpeed > 10) return;
            const lateralOffset = isLeft ? 4 : -4;
            spawnParticle('ripple', x, y + lateralOffset, '#60a5fa');
            spawnParticle('smoke', x, y + lateralOffset, '#94a3b8');
          },
          scenarioId
        );

        // クラッシュ時の火花
        if (wasActive && !walker.isActive && !walker.reachedGoal) {
          for (let i = 0; i < 8; i++) {
            spawnParticle('spark', walker.x, walker.y, '#f59e0b');
          }
        }

        // ゴール時の紙吹雪
        if (wasActive && walker.reachedGoal) {
          for (let i = 0; i < 20; i++) {
            const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];
            spawnParticle(
              'confetti',
              walker.x + Math.random() * 20 - 10,
              walker.y + Math.random() * 20 - 10,
              colors[Math.floor(Math.random() * colors.length)],
              Math.random() * 2 + 2
            );
          }
        }

        if (walker.isActive || walker.reachedGoal) {
          activeCountInStep++;
          if (walker.x > localMaxDistance) localMaxDistance = walker.x;
          
          const currentHalfWidth = getLaneHalfWidth(scenarioId);
          const isCentralEnough = Math.abs(walker.y) < currentHalfWidth * 0.5;
          if (Math.abs(walker.angle) < 0.15 && isCentralEnough) stableCountInStep++;
        }
      });

      localAliveCount = activeCountInStep;
      localStableCount = stableCountInStep;
      simFrameCountRef.current++;

      // ============================================================
      // 世代終了判定 — 最低フレーム数を超えてから判定する
      // ============================================================
      if (simFrameCountRef.current < MIN_FRAMES_BEFORE_END) {
        // 生成直後は判定しない（初期化のブレを吸収）
        continue;
      }

      const timeLimitExceeded =
        vehiclesRef.current.some(v => v.aliveTime >= GENERATION_TIME_LIMIT_FRAMES);
      const allStopped = vehiclesRef.current.every(v => !v.isActive);

      if (allStopped || timeLimitExceeded) {
        generationEnded = true;
        onGenEndRef.current(timeLimitExceeded); // Removed goalReached from triggering end
        break;
      }
    }

    // 世代終了した場合はフレームカウントをリセット（次世代に備える）
    if (generationEnded) {
      simFrameCountRef.current = 0;
    }

    // パーティクルの更新
    const runSpeed2 = runSpeedRef.current;
    particlesRef.current = particlesRef.current.filter(p => {
      p.alpha -= 0.02 * runSpeed2;
      if (p.type === 'ripple') p.size += 0.8 * runSpeed2;
      if (p.type === 'confetti') p.vy -= 0.05 * runSpeed2;
      return p.alpha > 0;
    });

    // 10フレームに1回だけHUD State を更新
    frameCountRef.current++;
    if (frameCountRef.current % 10 === 0) {
      setAliveCars(localAliveCount);
      const rate =
        vehiclesRef.current.length > 0
          ? Math.floor((localStableCount / vehiclesRef.current.length) * 100)
          : 0;
      setStableWalkRate(Math.min(100, Math.max(0, rate)));
      setMaxDistance(localMaxDistance);
    }
  });

  return { particles: particlesRef.current };
};
