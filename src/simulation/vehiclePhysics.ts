// Cache invalidate comment for physics
import type { VehicleState, Waypoint, PersonalityType, VehicleGenome } from '../types/simulation';

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
    speedFactor: Math.random() * 1.5,        // 0.0 〜 1.5
    steeringBias: (Math.random() - 0.5) * 2, // -1.0 〜 1.0
    recoveryAbility: Math.random() * 1.2     // 0.0 〜 1.2
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

// 物理ステートの1ステップ更新 (Waypoint誘導走行)
// 物理ステートの1ステップ更新 (Waypoint誘導走行にゲノムを反映)
export const updateVehiclePhysics = (
  vehicle: VehicleState,
  waypoints: Waypoint[],
  personality: PersonalityType,
  isClosedCourse: boolean = false
): VehicleState => {
  if (!vehicle.isActive || waypoints.length === 0) return vehicle;

  // 1. 現在目指しているwaypointを取得
  const targetWp = waypoints[vehicle.currentWaypointIndex];
  
  // 2. 目標方向への角度を計算
  const dx = targetWp.x - vehicle.x;
  const dy = targetWp.y - vehicle.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  let targetAngle = Math.atan2(dy, dx);
  
  // 3. 角度の差分を求める (-PI から +PI の範囲に正規化)
  let angleDiff = targetAngle - vehicle.angle;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

  // 4. ゲノム特性を反映した旋回力（steering）の決定
  let baseTurnSensitivity = 0.11;
  if (personality === 'safety') {
    baseTurnSensitivity = 0.14; // 鋭く正確に反応
  } else if (personality === 'speed') {
    baseTurnSensitivity = 0.08; // 膨らみやすい挙動
  }
  
  // steeringResponsiveness (旋回感度) の代わりに balanceCorrection を流用
  const turnSensitivity = baseTurnSensitivity * vehicle.genome.balanceCorrection;

  // noiseFactor (走行のブレ) の代わりに wobbleStrength を流用
  const steerNoise = (Math.random() - 0.5) * 0.08 * vehicle.genome.wobbleStrength;
  const targetSteering = angleDiff * turnSensitivity + steerNoise;
  
  // ステアリング舵角の限界制限 (0.15 から 0.22 に拡張して、優れた個体が急カーブを曲がりきれる余地を作る)
  const maxSteer = 0.22;
  vehicle.steering = Math.max(-maxSteer, Math.min(maxSteer, targetSteering));

  // 5. 進行角度の更新
  vehicle.angle += vehicle.steering;

  // 6. 速度の調整（ゲノムを反映：maxSpeedFactor -> speedFactor, brakeSensitivity -> recoveryAbility, safetyMargin -> balanceCorrection）
  const scaledMaxSpeed = vehicle.maxSpeedLimit * vehicle.genome.speedFactor; // 最高速度
  const speedUpRate = 0.1;
  // 減速レート
  const slowDownRate = 0.25 * vehicle.genome.recoveryAbility; 
  
  // 減速判定閾値に safetyMargin -> balanceCorrection を反映
  const curveThreshold = 0.35 / vehicle.genome.balanceCorrection;

  if (Math.abs(angleDiff) > curveThreshold) {
    const baseSlowRatio = personality === 'safety' ? 0.4 : personality === 'speed' ? 0.7 : 0.55;
    const targetSlowSpeed = (scaledMaxSpeed * baseSlowRatio) / Math.max(0.6, vehicle.genome.recoveryAbility * 0.5 + 0.5);
    vehicle.speed -= slowDownRate;
    if (vehicle.speed < targetSlowSpeed) vehicle.speed = targetSlowSpeed;
  } else {
    // 直線時
    vehicle.speed += speedUpRate;
    if (vehicle.speed > scaledMaxSpeed) vehicle.speed = scaledMaxSpeed;
  }

  // 7. 位置の更新 (前進)
  vehicle.x += Math.cos(vehicle.angle) * vehicle.speed;
  vehicle.y += Math.sin(vehicle.angle) * vehicle.speed;
  
  // 総走行距離の加算
  vehicle.distanceTravelled += vehicle.speed;

  // 8. waypointへの接近判定 (目標点に近づいたら次のwaypointへ)
  const waypointTolerance = 30; // 目標通過許容半径
  if (distance < waypointTolerance) {
    if (!isClosedCourse && vehicle.currentWaypointIndex === waypoints.length - 1) {
      // 非周回（市街地）コースの最終Waypoint到達
      vehicle.waypointsPassed += 1;
      vehicle.reachedGoal = true;
      vehicle.isActive = false;
      vehicle.speed = 0;
      vehicle.steering = 0;
    } else {
      // 周回コースまたは非周回コースの途中
      vehicle.currentWaypointIndex = (vehicle.currentWaypointIndex + 1) % waypoints.length;
      vehicle.waypointsPassed += 1;

      // 周回コースの場合、1周（すべてのWaypointを通過）したらゴール
      if (isClosedCourse && vehicle.waypointsPassed >= waypoints.length) {
        vehicle.reachedGoal = true;
        vehicle.isActive = false;
        vehicle.speed = 0;
        vehicle.steering = 0;
      }
    }
  }

  return { ...vehicle };
};
