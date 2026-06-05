import type { VehicleState } from '../types/simulation';

/**
 * 座標系定義（3D空間と統一）
 * - walker.x: 前進方向 (X軸, 0 → GOAL_X)
 * - walker.y: 横ずれ方向 (3D Z軸に変換時は worldZ = -walker.y)
 *   中央がy=0、右がy>0、左がy<0
 */
export const GOAL_X = 300;
export function getLaneHalfWidth(scenarioId?: string): number {
  if (scenarioId === 'highway') return 45;
  return 100;
}

export interface Obstacle3D {
  x: number;
  z: number;
  width: number;
  depth: number;
}

export const OBSTACLES_3D: Obstacle3D[] = [
  { x: 80, z: 0, width: 40, depth: 10 },    // Center
  { x: 160, z: -35, width: 35, depth: 10 }, // Left
  { x: 240, z: 35, width: 35, depth: 10 },  // Right
];

export function updateWalkerPhysics3D(
  walker: VehicleState,
  startPoint: { x: number; y: number },
  _currentGeneration: number,
  onFootstrike?: (x: number, y: number, isLeft: boolean) => void,
  scenarioId?: string
): VehicleState {
  if (!walker.isActive || walker.reachedGoal) return walker;

  walker.aliveTime += 1;

  // Genome mapping
  const genome = walker.genome;
  const strideLength = genome.strideLength || 1.0;
  const stepRhythm = genome.stepRhythm || 1.0;
  const balanceCorrection = genome.balanceCorrection || 1.0;
  const lateralDrift = genome.lateralDrift || 0.0;
  const wobbleStrength = genome.wobbleStrength || 1.0;
  const speedFactor = genome.speedFactor || 1.0;
  const steeringBias = genome.steeringBias || 0.0;
  const recoveryAbility = genome.recoveryAbility || 1.0;

  const phase = walker.aliveTime * stepRhythm * 0.12;
  const prevPhase = (walker.aliveTime - 1) * stepRhythm * 0.12;

  const prevStrikeIndex = Math.floor((prevPhase + Math.PI / 2) / Math.PI);
  const strikeIndex = Math.floor((phase + Math.PI / 2) / Math.PI);
  const isStrike = strikeIndex !== prevStrikeIndex;
  const isLeftStrike = strikeIndex % 2 === 0;
  if (isStrike && onFootstrike) {
    onFootstrike(walker.x, walker.y, isLeftStrike);
  }

  // ========== 前進速度 ==========
  const baseSpeed = 0.1 * speedFactor; 
  const kickBoost = Math.abs(Math.sin(phase)) > 0.7
    ? Math.abs(Math.sin(phase)) * strideLength * 0.15
    : 0;

  const targetSpeed = baseSpeed + kickBoost;
  walker.speed = walker.speed * 0.9 + targetSpeed * 0.1;
  walker.x += walker.speed;

  // ========== 重心角度 (ふらつき: wobbleAngle) の更新 ==========
  const swayAmplitude = wobbleStrength * 0.04;
  const sway = Math.sin(phase) * swayAmplitude * (strideLength * 0.6 + 0.4);

  const noise = (Math.random() - 0.5) * wobbleStrength * 0.02;
  const gravityTilt = walker.wobbleAngle * 0.09;

  // バランス補正とリカバリー力
  const effectiveBalance = balanceCorrection * 0.2 + recoveryAbility * 0.1;
  const restoringForce = -walker.wobbleAngle * effectiveBalance;

  const dWobble = sway + noise + gravityTilt + restoringForce;
  walker.wobbleAngle += dWobble;

  // ========== 進行方向 (Heading: angle) の更新 ==========
  // 中央に戻ろうとする力 (バランス補正が効く)
  const centerCorrectionSteering = -(walker.y - startPoint.y) * 0.0008 * balanceCorrection;
  // 常に左右どちらかへ進みやすい癖(steeringBias)と、歩行による横流れ(lateralDrift)
  walker.angle = centerCorrectionSteering + steeringBias * 0.04 + Math.sin(phase * 0.5) * lateralDrift * 0.02;

  // ========== 横ずれ (y) の計算 ==========
  // ゲノムによる自然な横流れ + ふらつき + 進行方向
  const driftFromGenome = lateralDrift * 0.5;
  const driftFromWobble = walker.wobbleAngle * 2.0; 
  const driftFromHeading = Math.sin(walker.angle) * walker.speed * 5.0;
  walker.y += driftFromGenome + driftFromWobble + driftFromHeading;

  // ========== ゴール判定 ==========
  if (walker.x >= GOAL_X) {
    walker.reachedGoal = true;
    walker.isActive = false;
    walker.speed = 0;
    walker.status = 'goal';
  }

  // ========== 障害物衝突判定 ==========
  let isObstacleHit = false;
  const robotRadius = 3.0; // ロボットの当たり判定半径

  if (scenarioId === 'circuit') {
    for (const obs of OBSTACLES_3D) {
      const minX = obs.x - obs.width / 2 - robotRadius;
      const maxX = obs.x + obs.width / 2 + robotRadius;
      const minZ = obs.z - obs.depth / 2 - robotRadius;
      const maxZ = obs.z + obs.depth / 2 + robotRadius;

      // walker.y が Z軸に対応することに注意 (worldZ = -walker.y)
      const walkerZ = -walker.y;

      if (walker.x > minX && walker.x < maxX && walkerZ > minZ && walkerZ < maxZ) {
        isObstacleHit = true;
        break;
      }
    }
  }

  // ========== 失敗判定 ==========
  const limitAngle = 0.45; // 約25度固定。進化補正なし。
  
  const currentHalfWidth = getLaneHalfWidth(scenarioId);
  const outOfLane = Math.abs(walker.y) > currentHalfWidth;
  const isCrashed = Math.abs(walker.wobbleAngle) > limitAngle;
  // 進まない個体は立ち往生判定
  const isStalled = walker.speed < 0.02 && walker.aliveTime > 120;

  if (walker.aliveTime > 30 && walker.isActive) {
    if (outOfLane) {
      walker.isActive = false;
      walker.speed = 0;
      walker.status = 'outOfLane';
      walker.crashReason = 'レーン外落下';
    } else if (isObstacleHit) {
      walker.isActive = false;
      walker.speed = 0;
      walker.status = 'fallen';
      walker.crashReason = '障害物に衝突';
    } else if (isCrashed) {
      walker.isActive = false;
      walker.speed = 0;
      walker.status = 'fallen';
      walker.crashReason = 'バランスを崩して転倒';
    } else if (isStalled) {
      walker.isActive = false;
      walker.speed = 0;
      walker.status = 'stalled';
      walker.crashReason = '立ち往生';
    }
  }

  // ========== スコア計算 ==========
  const distanceTravelled = Math.max(0, walker.x - startPoint.x);
  const centerBonus = Math.max(0, 50 - Math.abs(walker.y));
  const stabilityBonus = Math.max(0, 100 - Math.abs(walker.wobbleAngle) * 100);

  
  let penalty = 0;
  if (walker.status === 'fallen') penalty = 150;
  if (walker.status === 'outOfLane') penalty = 200;
  if (walker.status === 'stalled') penalty = 100;
  if (walker.status === 'goal') penalty = -500; // Goal bonus

  walker.finalScore = Math.max(0, Math.floor(
    distanceTravelled * 2.5 +
    walker.aliveTime * 0.1 +
    centerBonus * 0.5 +
    stabilityBonus -
    penalty
  ));

  return walker;
}
