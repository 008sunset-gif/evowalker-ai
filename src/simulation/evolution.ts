import type { VehicleGenome, VehicleState, SpeedType } from '../types/simulation';

/**
 * 前世代の走行スコアから優秀な遺伝子を選別し、突然変異を加えて次世代のゲノム群を生成します。
 */
export const generateNextGenerationGenomes = (
  prevVehicles: VehicleState[],
  learningSpeed: SpeedType
): { genomes: VehicleGenome[]; bestId: number; bestScore: number } => {
  const count = prevVehicles.length;
  
  // 1. スコアの高い順にソート
  const sorted = [...prevVehicles].sort((a, b) => b.finalScore - a.finalScore);
  const bestVehicle = sorted[0];
  
  // 2. 上位20%をエリートとして選抜
  const eliteCount = Math.max(1, Math.floor(count * 0.2));
  const elites = sorted.slice(0, eliteCount);
  
  // 3. 変異の強さ（分散レンジ）を決定
  let mutationRate = 0.15; // normal
  if (learningSpeed === 'slow') {
    mutationRate = 0.05;
  } else if (learningSpeed === 'fast') {
    mutationRate = 0.30;
  }

  // 突然変異を加えるヘルパー関数 (クランプして異常パラメータを防ぐ)
  const mutateValue = (val: number, rate: number, min: number = 0.1, max: number = 3.0): number => {
    // 簡易正規分布風ノイズ (-1.5 〜 1.5 の加算)
    const noise = (Math.random() + Math.random() + Math.random() - 1.5);
    const mutated = val + noise * rate;
    return Math.max(min, Math.min(max, mutated));
  };

  const nextGenGenomes: VehicleGenome[] = [];

  // 第1個体 (インデックス0) は前世代ベスト個体の完全クローンを引き継ぐ（エリート保護）
  nextGenGenomes.push({ ...bestVehicle.genome });

  // 残りの個体数はエリート群のコピーに変異を加えて生成
  for (let i = 1; i < count; i++) {
    // エリートからランダムにコピー元を決定
    const parent = elites[Math.floor(Math.random() * elites.length)];
    
    // 各パラメータに変異を適用して格納
    nextGenGenomes.push({
      strideLength: mutateValue(parent.genome.strideLength, mutationRate, 0.2, 2.0),
      stepRhythm: mutateValue(parent.genome.stepRhythm, mutationRate, 0.2, 2.2),
      balanceCorrection: mutateValue(parent.genome.balanceCorrection, mutationRate, 0.0, 1.5),
      lateralDrift: mutateValue(parent.genome.lateralDrift, mutationRate, -2.0, 2.0),
      wobbleStrength: mutateValue(parent.genome.wobbleStrength, mutationRate, 0.0, 2.5),
      speedFactor: mutateValue(parent.genome.speedFactor, mutationRate, 0.1, 1.5),
      steeringBias: mutateValue(parent.genome.steeringBias, mutationRate, -1.0, 1.0),
      recoveryAbility: mutateValue(parent.genome.recoveryAbility, mutationRate, 0.0, 1.2),
    });
  }

  return {
    genomes: nextGenGenomes,
    bestId: bestVehicle.id,
    bestScore: bestVehicle.finalScore,
  };
};
export default generateNextGenerationGenomes;
