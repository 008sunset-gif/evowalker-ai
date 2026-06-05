import type { GenerationResult, MockFinalResult } from '../types/simulation';

/**
 * 世代履歴(GenerationResult[])に基づいて、全体の進化傾向から診断評価(MockFinalResult)を動的に判定・生成します。
 */
export const evaluateEvolutionHistory = (history: GenerationResult[]): MockFinalResult => {
  if (!history || history.length === 0) {
    return {
      rating: 'B',
      typeLabel: '⚖️ 評価データ不足',
      features: ['データがありません'],
      aiType: '十分な歩行データが得られませんでした。',
      improvedPoints: 'シミュレーションが未実行です。',
      remainingWeakness: '評価を行うには世代を最後まで完了させてください。',
      nextAdvice: 'シミュレーション画面で世代を進めてください。'
    };
  }

  const firstGen = history[0];
  const lastGen = history[history.length - 1];

  const firstBest = firstGen.bestScore || 1;
  const lastBest = lastGen.bestScore || 1;
  const scoreImprovementPercent = Math.max(0, Math.floor(((lastBest - firstBest) / firstBest) * 100));

  const totalCars = lastGen.crashCount + lastGen.aliveCount;
  const lastCrashRatePercent = Math.floor((lastGen.crashCount / totalCars) * 100);

  const firstCrashRatePercent = Math.floor((firstGen.crashCount / totalCars) * 100);
  const crashRateDiff = lastCrashRatePercent - firstCrashRatePercent;

  let rating = 'B';
  let typeLabel = '';
  let aiType = '';
  let improvedPoints = '';
  let remainingWeakness = '';
  let nextAdvice = '';

  // 1. 学習停滞型 (改善率が極めて低い場合)
  if (scoreImprovementPercent < 10) {
    rating = 'C';
    typeLabel = '🛑 学習停滞・集団限界モデル';
    aiType = '世代交代を繰り返したものの、集団全体の適合度や歩行パターンに顕著な向上が見られず、進化が停滞気味のモデルです。';
    improvedPoints = '初期世代と比較して集団の歩行ブレ（ふらつき）が微小ながら抑制され、最初の数ステップでの安定性は僅かに向上しました。';
    remainingWeakness = 'スピードと安定性のバランスが合わず、レーン外への逸脱や障害物への衝突・転倒を繰り返す個体が多く、ゴール到達にはまだ課題があります。';
    nextAdvice = '次回は安定重視または標準学習での再試行を推奨します。また、最大世代数を増やすか、初期の遺伝子多様性を高めてみてください。';
  }
  // 2. 安定学習型 (クラッシュが大幅に減少し、かつ最終クラッシュ率が低い場合)
  else if (crashRateDiff <= -15 && lastCrashRatePercent < 30) {
    rating = 'A';
    typeLabel = '🛡️ 安定学習・リスク回避型モデル';
    aiType = '世代を追うごとに転倒件数が大幅に減少し、レーン内の安全な領域を確実に歩く能力を学習した生存性重視のモデルです。初期世代より歩行安定性が向上しました。';
    improvedPoints = '初期世代ではふらつきや障害物により転倒する個体が多数を占めていましたが、最終世代では安定マージンが最適化され、ふらつきを検知して確実にバランス調整と転倒回避を行えるようになりました。';
    remainingWeakness = '安定に配慮するあまり、直線区間でも歩行スピードを抑えすぎてしまい、全体的な歩行時間はやや長めになっています。一部ゴール到達にはまだ課題があります。';
    nextAdvice = '安定歩行の基礎は完成しているため、タイム短縮や安定したゴール到達を目指す場合は、歩行方針を「バランス」または「スピード重視」に設定して試してください。次回は標準学習での再試行を推奨します。';
  }
  // 3. 攻撃的進化型 (スコアは伸びたが、クラッシュ率が高いままの場合)
  else if (scoreImprovementPercent >= 10 && lastCrashRatePercent >= 45) {
    rating = 'B';
    typeLabel = '⚡ 攻撃的進化・ハイリスクハイピッチモデル';
    aiType = '前進距離の記録は大幅に更新されたものの、依然として多くの個体が転倒・脱落している、スピードと攻撃性を優先した偏重学習モデルです。';
    improvedPoints = '優れた歩行リズムと推進力を持つ遺伝子が集団に広がり、平均到達距離のベースラインは初期世代よりも明確に上昇しました。';
    remainingWeakness = '速度を求めるあまりふらつき（Wobble）を抑えきれない個体が多く、転倒率・コースアウト率が十分に下がっていません。';
    nextAdvice = '長距離やカーブの多いコースでは脱落リスクが高くなります。歩行方針を「安全重視」に変更するか、姿勢補正力の遺伝子を引き継ぎやすくするとバランスが改善します。';
  }
  // 4. 理想的進化型 (大幅なスコアアップと安定性の獲得)
  else {
    rating = scoreImprovementPercent >= 50 && lastCrashRatePercent <= 15 ? 'S' : 'A+';
    typeLabel = rating === 'S' ? '👑 完全適応・エリート集団形成' : '🌟 理想的進化・優秀遺伝子獲得';
    aiType = '世代交代を重ねるごとに優秀な遺伝子が集団全体に波及し、歩行距離の伸長と転倒率の低下を両立させた理想的な進化モデルです。';
    improvedPoints = '初期世代の多様な失敗（転倒、コースアウト、立ち往生）から最適なパラメーターが抽出・継承され、集団全体が高い姿勢補正力と直進性を獲得しました。';
    remainingWeakness = '現状の環境ではほぼ完璧な適応を見せていますが、さらなるノイズや予期せぬ障害物が追加された場合、環境変化への対応力が問われます。';
    nextAdvice = '素晴らしい学習成果です！次はより複雑な地形や、歩行ノイズが多い高難易度シナリオにもこの遺伝子群で挑戦してみてください。';
  }

  const features = [
    `スコア改善率: +${scoreImprovementPercent}%`,
    `最終世代の転倒率: ${lastCrashRatePercent}% (初期比: ${crashRateDiff >= 0 ? '+' : ''}${crashRateDiff}%)`,
    `ゴール到達個体数: ${lastGen.completedCount}体 / 平均スコア: ${lastGen.averageScore} pts`
  ];

  return {
    rating,
    typeLabel,
    features,
    aiType,
    improvedPoints,
    remainingWeakness,
    nextAdvice
  };
};
