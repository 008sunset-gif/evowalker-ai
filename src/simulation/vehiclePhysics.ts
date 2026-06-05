// Cache invalidate comment for physics
import type { VehicleState, PersonalityType, VehicleGenome } from '../types/simulation';

/**
 * 第1世代の初期ゲノムをランダムに生成する
 * 意図的に失敗（転倒、コース外、立ち往生）が自然発生するよう、パラメータを広く分散させる。
 */
export const createInitialGenome = (_personality: PersonalityType): VehicleGenome => {
  return {
    strideLength: Math.random() * 2.0,       // 0.0 〜 2.0
    stepRhythm: Math.random() * 2.0 + 0.2,   // 0.2 〜 2.2
    balanceCorrection: Math.random() * 1.5,  // 0.0 〜 1.5
    lateralDrift: (Math.random() - 0.5) * 4, // -2.0 〜 2.0
    wobbleStrength: Math.random() * 2.5,     // 0.0 〜 2.5
    speedFactor: 0.4 + Math.random() * 1.1,  // 0.4 〜 1.5（最低限の前進力を確保し全員即死を防ぐ）
    steeringBias: (Math.random() - 0.5) * 2, // -1.0 〜 1.0
    recoveryAbility: Math.random() * 1.2,    // 0.0 〜 1.2
    // 歩行パターン特性（広く分散させ、まっすぐ/蛇行/流れ/コースアウトの個体差を自然発生させる）
    lateralAmplitude: Math.random() * 2.0,        // 0.0 〜 2.0（蛇行の大きさを広くばらつかせる）
    lateralFrequency: Math.random() * 1.5,        // 0.0 〜 1.5（蛇行の周期）
    lateralPhase: (Math.random() - 0.5) * 2,      // -1.0 〜 1.0（揺れの開始位相、後段で×π）
    centerPull: Math.random() * 0.8               // 0.0 〜 0.8（弱め：多くが中央に戻りきれない）
  };
};

// 車両の初期化 (プリセットゲノムがある場合は引き継ぎ、なければ新規生成)
export const initVehicles = (
  count: number,
  startPoint: { x: number; y: number; angle: number },
  personality: PersonalityType,
  presetGenomes?: VehicleGenome[]
): VehicleState[] => {
  // 性格に応じた最大速度上限とブレ幅
  let baseMaxSpeed = 2.2;
  let speedSpread = 0.4;
  let noiseSpread = 0.02;

  if (personality === 'safety') {
    baseMaxSpeed = 1.6;
    speedSpread = 0.2;
    noiseSpread = 0.005; // 安全型は個体差が小さく規則的
  } else if (personality === 'speed') {
    baseMaxSpeed = 3.2;
    speedSpread = 0.6;
    noiseSpread = 0.05;  // 速度重視は荒々しくブレが大きい
  }

  // 車体色のバリエーション
  const getCarColor = (index: number) => {
    if (index === 0) return '#4fd1c5'; // 主要AI車両はネオンシアン
    const colors = ['#c084fc', '#f56565', '#48bb78', '#ecc94b', '#ed64a6', '#38b2ac'];
    return colors[index % colors.length];
  };

  return Array.from({ length: count }, (_, idx) => {
    const individualSpeedNoise = (Math.random() - 0.5) * speedSpread;
    const individualNoise = (Math.random() - 0.5) * noiseSpread;

    // 3D座標系に合わせた初期散らばり
    // walker.x: 前進方向 (startPoint.x = 0付近)
    // walker.y: 横ずれ方向 (LANE_HALF_WIDTH=100 の範囲内)
    // 初期散らばりは小さくして全員がレーン内に収まるようにする
    const xOffset = (Math.random() - 0.5) * 5;   // 前後のオフセットは小さく
    const yOffset = (Math.random() - 0.5) * 40;  // 横ずれは±20以内（100境界より十分内側）

    const genome = presetGenomes && presetGenomes[idx]
      ? presetGenomes[idx]
      : createInitialGenome(personality);

    return {
      id: idx + 1,
      x: startPoint.x + xOffset,
      y: startPoint.y + yOffset,
      angle: startPoint.angle + (Math.random() - 0.5) * 0.1,
      wobbleAngle: 0,
      speed: 0.3 + Math.random() * 0.3,
      steering: 0,
      color: getCarColor(idx),
      isActive: true,
      currentWaypointIndex: 1,
      maxSpeedLimit: baseMaxSpeed + individualSpeedNoise,
      noiseFactor: individualNoise,
      waypointsPassed: 0,
      distanceTravelled: 0,
      aliveTime: 0,
      crashReason: '',
      finalScore: 0,
      reachedGoal: false,
      status: 'walking',
      genome,
    };
  });
};
