// Cache invalidate comment
// シナリオ（テストコース）のID型
export type ScenarioType = 'city' | 'circuit' | 'highway' | '';

// AIの性格優先方針型
export type PersonalityType = 'safety' | 'balance' | 'speed' | '';

// 学習スピードの型
export type SpeedType = 'slow' | 'normal' | 'fast';

// 同時歩行個体数の型
export type PopulationType = 'low' | 'normal' | 'high';

// 最大学習世代数の型
export type GenerationOptionType = 10 | 30 | 50;

// シミュレーション実行ステータス型
export type SimulationStatusType = 'idle' | 'running' | 'paused' | 'completed';

// AI設定情報の一括更新用インターフェース
export interface AIConfig {
  aiPersonality: PersonalityType;
  learningSpeed: SpeedType;
  carCount: PopulationType;
  maxGenerations: GenerationOptionType;
}

// 最終評価レポートのデータ構造
export interface MockFinalResult {
  rating: string;
  typeLabel: string;
  features: string[];
  aiType: string;
  improvedPoints: string;
  remainingWeakness: string;
  nextAdvice: string;
}

export interface VehicleGenome {
  strideLength: number;       // 歩幅 (大きいと速いが転びやすい)
  stepRhythm: number;         // 歩行リズム (足の回転速度)
  balanceCorrection: number;  // 姿勢補正力 (ふらつきを戻す力)
  lateralDrift: number;       // 左右へ流れやすい癖 (カーブ)
  wobbleStrength: number;     // ふらつき量 (生まれつきのノイズ)
  speedFactor: number;        // 前進速度のベース
  steeringBias: number;       // 左寄り・右寄りの癖 (直進性のズレ)
  recoveryAbility: number;    // バランスを崩した時に立て直す力
  // --- 歩行パターン特性（障害物を「見て避ける」のではなく、歩き方の違いで軌道が決まる） ---
  lateralAmplitude: number;   // 左右に蛇行する大きさ
  lateralFrequency: number;   // 蛇行の周期（速さ）
  lateralPhase: number;       // 左右移動の初期位相（揺れの開始タイミングの個体差）
  centerPull: number;         // 中央へ戻ろうとする力
  obstacleAvoidance: number;  // 前方障害物を避ける強さ（circuitで進化・前方センサー連動）
}

// 歩行個体の基本物理状態 (Step 4追加, Step 6・Step 7拡張)
export interface VehicleState {
  id: number;
  x: number;
  y: number;
  angle: number;           // 進行角度 (ラジアン)
  wobbleAngle: number;     // 身体の左右の傾き (Tilt)
  speed: number;           // 現在速度
  steering: number;        // ステアリング舵角
  color: string;           // 描画色
  isActive: boolean;       // 生存中フラグ
  currentWaypointIndex: number; // 目指しているwaypointのインデックス
  maxSpeedLimit: number;   // この個体の最大速度上限
  noiseFactor: number;     // 個体差のブレ要因
  waypointsPassed: number; // 通過したウェイポイントの累計数
  distanceTravelled: number; // 総歩行距離 (ピクセル換算)
  aliveTime: number;         // 生存フレーム時間
  crashReason: string;       // 転倒原因 (空文字なら転倒なし)
  finalScore: number;        // 最終算出スコア
  genome: VehicleGenome;     // 個体の歩行遺伝子特性
  reachedGoal: boolean;      // ゴール到達フラグ
  // 状態（転倒・障害物衝突・コースアウト・立ち往生・ゴールは失敗原因として別扱い）
  status: 'walking' | 'fallen' | 'obstacleHit' | 'outOfLane' | 'stalled' | 'goal';
}

// コース上の目標経由点
export interface Waypoint {
  x: number;
  y: number;
}

// 世代ごとのシミュレーション結果 (Step 6追加)
export interface GenerationResult {
  generation: number;
  bestScore: number;
  averageScore: number;
  averageDistance: number; // 全個体の平均前進距離(メートル換算, toMeters基準)
  crashCount: number;
  fallenCount: number;        // 純粋な転倒（姿勢制御の失敗）のみ
  obstacleHitCount: number;   // 障害物衝突（回避判断の失敗）のみ
  outOfLaneCount: number;     // コースアウト（直進性・復帰力の失敗）のみ
  stalledCount: number;
  aliveCount: number;
  bestVehicleId: number;
  topVehicles: Array<{
    id: number;
    finalScore: number;
    waypointsPassed: number;
    distanceTravelled: number;
    aliveTime: number;
    crashReason: string;
    reachedGoal: boolean;
  }>;
  completedCount: number; // ゴール到達個体数
  resultType: 'safety' | 'speed' | 'balance'; // 世代の全体的な結果タイプ
}
