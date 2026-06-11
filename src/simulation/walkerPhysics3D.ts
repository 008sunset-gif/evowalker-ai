import type { VehicleState } from '../types/simulation';

/**
 * 座標系定義（3D空間と統一）
 * - walker.x: 前進方向 (X軸, 0 → GOAL_X)
 * - walker.y: 横ずれ方向 (3D Z軸に変換時は worldZ = -walker.y)
 *   中央がy=0、右がy>0、左がy<0
 */
export const GOAL_X = 300;

// ゴール(GOAL_X)到達時に相当する距離(メートル換算)。距離表示の基準値。
export const GOAL_DISTANCE_M = 60;

/**
 * 内部座標 walker.x / distanceTravelled (0〜GOAL_X) を距離(メートル)へ変換する唯一の関数。
 * Simulation HUD・Analysis・Result の距離表示は必ずこの関数を経由し、
 * 画面ごとに異なる換算（/5・/2.5・×2 など）を行わないことで表示を統一する。
 */
export function toMeters(x: number): number {
  const clamped = Math.max(0, Math.min(GOAL_X, x));
  return Math.round((clamped / GOAL_X) * GOAL_DISTANCE_M);
}

export function getLaneHalfWidth(scenarioId?: string): number {
  if (scenarioId === 'highway') return 45;
  return 100;
}

/** 障害物タイプ（描画の見た目バリエーション。物理判定は共通の矩形(AABB)） */
export type ObstacleType = 'block' | 'lowBarrier' | 'wall' | 'pillar' | 'gate';

export interface Obstacle3D {
  x: number;       // 前進方向(X)中心
  z: number;       // 横方向(Z)中心。walkerZ = -walker.y に対応
  width: number;   // X方向の厚み（前後）。当たり判定に使用
  depth: number;   // Z方向の幅（レーン横断方向）。当たり判定に使用
  height: number;  // 高さ（描画専用。地面歩行のため物理判定では未使用）
  type: ObstacleType;
  color: string;
}

/**
 * 障害物レーン(circuit)専用の障害物配置。
 * 描画(LaneEnvironment3D)と物理判定(updateWalkerPhysics3D)は必ずこの同一配列を参照する。
 * いずれも矩形(x±width/2, z±depth/2)で判定するため、見た目と当たり判定が一致する。
 * すべて GOAL_X(=300) より手前・レーン幅(±100)内に配置し、各障害物は通り抜けられる隙間を残す。
 * gate は左右2枚の柱を別エントリにし、中央(z: -18〜18)を通過できる隙間として表現する。
 */
export const OBSTACLES_3D: Obstacle3D[] = [
  // x≈80: 左寄りの低い横長バリア（導入。中央スポーン個体はほぼそのまま回避できる易しさ）
  { x: 80, z: -30, width: 8, depth: 40, height: 3, type: 'lowBarrier', color: '#f59e0b' },
  // x≈130: 右寄りのブロック（中央〜左へ寄れば回避できる）
  { x: 130, z: 28, width: 16, depth: 30, height: 11, type: 'block', color: '#475569' },
  // x≈185: 中央ブロック（必ず左右どちらかへ蛇行・流れて回避が必要な難所。直進では抜けられない）
  { x: 185, z: 0, width: 16, depth: 26, height: 14, type: 'block', color: '#dc2626' },
  // x≈240: 中央に隙間のあるゲート（避けた後に中央へ戻る必要がある。終盤の最難所）
  // 左右の壁の間（worldZ: -29〜+29 ≒ 幅58）が通路。完全には塞がない。
  { x: 240, z: -62, width: 10, depth: 66, height: 20, type: 'gate', color: '#334155' }, // 左壁(worldZ -95〜-29)
  { x: 240, z: 62, width: 10, depth: 66, height: 20, type: 'gate', color: '#334155' },  // 右壁(worldZ +29〜+95)
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
  // 歩行パターン特性（蛇行・流れ・中央復帰）に加え、障害物を「見て避ける」遺伝子を持つ
  const lateralAmplitude = genome.lateralAmplitude || 0.0;
  const lateralFrequency = genome.lateralFrequency || 0.0;
  const lateralPhase = genome.lateralPhase || 0.0;
  const centerPull = genome.centerPull || 0.0;
  // 障害物回避の強さ（前方センサーで検知した障害物を避ける度合い。GAの選抜で進化する）
  const obstacleAvoidance = genome.obstacleAvoidance || 0.0;

  // ロボットの当たり判定半径（障害物の衝突判定に使用）
  const robotRadius = 3.0;

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
  // 基本は個体ごとの「歩き方」（蛇行・流れ・中央復帰）で軌道が決まる。
  // これに加えて circuit では、前方センサーで障害物を検知し空き帯へ寄せる回避（avoidVel）を重ねる。
  const meanderOmega = 0.015 + lateralFrequency * 0.04;                 // 蛇行の角速度（周期）＝個体差
  const meanderPosAmp = lateralAmplitude * 18;                          // 蛇行の位置振幅（個体差）
  const meanderPhaseVal = walker.aliveTime * meanderOmega + lateralPhase * Math.PI;
  // 位置振幅を一定に保つための速度成分（cos微分）。周期差で振幅が暴れないようにする
  const meanderVel = meanderPosAmp * meanderOmega * Math.cos(meanderPhaseVal);

  const steadyDrift = lateralDrift * 0.5 + steeringBias * 0.25;         // 右/左へゆるく流れる癖
  const centerReturn = -walker.y * 0.012 * centerPull;                  // 中央へ戻ろうとする力（弱め）
  const driftFromWobble = walker.wobbleAngle * 2.0;                     // ふらつき（転倒寄り）由来
  const driftFromHeading = Math.sin(walker.angle) * walker.speed * 5.0; // 進行方向由来

  // ========== 障害物センサーによる回避（circuit のみ・進化で上達する行動） ==========
  // 前方 LOOKAHEAD 以内の障害物群を「見て」、レーン内で現在地に最も近い空き帯へ横移動する。
  // 回避の強さは遺伝子 obstacleAvoidance に比例。ぶつかると即失敗のため、GAの選抜で
  // 「避けて前進する」個体（= より遠くまで到達する個体）が世代ごとに増える。
  let avoidVel = 0;
  if (scenarioId === 'circuit' && obstacleAvoidance > 0.001) {
    const LOOKAHEAD = 60;             // この距離だけ前方の障害物に反応
    const sensorMargin = robotRadius + 5; // 余裕を持って避ける
    const walkerZ = -walker.y;
    const laneFree = getLaneHalfWidth(scenarioId) - robotRadius;
    // 前方かつ近い（まだ通過していない）障害物の占有帯を集める
    const blocked: Array<[number, number]> = [];
    for (const o of OBSTACLES_3D) {
      if (o.x + o.width / 2 > walker.x - 2 && o.x - o.width / 2 < walker.x + LOOKAHEAD) {
        blocked.push([o.z - o.depth / 2 - sensorMargin, o.z + o.depth / 2 + sensorMargin]);
      }
    }
    if (blocked.length > 0) {
      const isBlockedAt = (z: number) => blocked.some(([a, b]) => z > a && z < b);
      // 現在の進路が塞がれている時だけ回避を発動（無駄な蛇行を避ける）
      if (isBlockedAt(walkerZ)) {
        const candidates: number[] = [0];
        for (const [a, b] of blocked) {
          candidates.push(a - 1, b + 1);
        }
        const free = candidates
          .filter((z) => z >= -laneFree && z <= laneFree && !isBlockedAt(z))
          .sort((p, q) => Math.abs(p - walkerZ) - Math.abs(q - walkerZ));
        if (free.length > 0) {
          const targetY = -free[0]; // worldZ → walker.y
          avoidVel = (targetY - walker.y) * 0.08 * Math.min(2.0, obstacleAvoidance);
        }
      }
    }
  }

  walker.y += meanderVel + steadyDrift + centerReturn + driftFromWobble + driftFromHeading + avoidVel;

  // ========== ゴール判定 ==========
  if (walker.x >= GOAL_X) {
    walker.reachedGoal = true;
    walker.isActive = false;
    walker.speed = 0;
    walker.status = 'goal';
  }

  // ========== 障害物衝突判定 ==========
  let isObstacleHit = false;

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
      walker.status = 'obstacleHit'; // 転倒とは別扱い（回避判断の失敗）
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
  // 到達した最大前進距離を実データとして保持（HUD/分析/結果の距離表示の基準）
  walker.distanceTravelled = Math.max(walker.distanceTravelled, distanceTravelled);
  const centerBonus = Math.max(0, 50 - Math.abs(walker.y));
  const stabilityBonus = Math.max(0, 100 - Math.abs(walker.wobbleAngle) * 100);

  
  let penalty = 0;
  if (walker.status === 'fallen') penalty = 150;       // 転倒（姿勢制御の失敗）
  if (walker.status === 'obstacleHit') penalty = 250;  // 障害物衝突（回避判断の失敗）は重め
  if (walker.status === 'outOfLane') penalty = 200;    // コースアウト
  if (walker.status === 'stalled') penalty = 100;      // 立ち往生
  if (walker.status === 'goal') penalty = -350;        // Goal bonus（過大にせず、避けて進めた個体も評価）

  // 障害物レーンでは「通過した障害物の数」をボーナスにし、避けて先へ進めた個体を高評価にする。
  // centerBonus(中央維持)と併用することで「避けた後に中央へ戻れた個体」がさらに有利になる。
  let obstacleBonus = 0;
  if (scenarioId === 'circuit') {
    const passed = OBSTACLES_3D.filter((o) => walker.x > o.x + o.width / 2).length;
    obstacleBonus = passed * 60;
  }

  walker.finalScore = Math.max(0, Math.floor(
    distanceTravelled * 2.5 +
    walker.aliveTime * 0.1 +
    centerBonus * 0.5 +
    stabilityBonus +
    obstacleBonus -
    penalty
  ));

  return walker;
}
