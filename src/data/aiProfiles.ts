import type { PersonalityType, SpeedType } from '../types/simulation';

export interface BrainSpec {
  maxSpeed: string;
  sensorRange: string;
  mutationRate: string;
  decisionLogic: string;
  prediction: string;
}

export interface AIProfile {
  id: PersonalityType;
  title: string;
  desc: string;
  detailDesc: string;
  specs: (speed: SpeedType) => BrainSpec;
}

export const AI_PROFILES: AIProfile[] = [
  {
    id: 'safety',
    title: '安定重視',
    desc: 'ふらつきを抑え、転倒を避ける歩き方を優先します。転倒しにくいが低速。',
    detailDesc: 'AIが歩行操作で「安定性」を最優先します。ふらつきを素早く検知し、安全にバランスを保ちながら進みます。',
    specs: (speed: SpeedType) => ({
      maxSpeed: '1.2 m/s (抑えめ)',
      sensorRange: '120px (ふらつき早期検知)',
      mutationRate: speed === 'fast' ? '12%' : speed === 'slow' ? '3%' : '6%',
      decisionLogic: '早期バランス調整 ＆ 転倒回避優先',
      prediction: 'ふらつきに対する過剰な調整により、序盤の学習効率は控えめになります。しかし、無駄な転倒が極めて少なく、安定した歩行バランスを短期間で獲得するでしょう。安全マージンの過剰さから、直線でスピードが伸びにくい点が課題です。',
    }),
  },
  {
    id: 'balance',
    title: 'バランス',
    desc: 'スピードと安定性のバランスを維持し、安定した完走を目指します。',
    detailDesc: 'AIがスピードと安定性のバランスを等しく重視します。標準的な歩行制御スタイルです。',
    specs: (speed: SpeedType) => ({
      maxSpeed: '2.0 m/s (標準)',
      sensorRange: '95px (標準検知)',
      mutationRate: speed === 'fast' ? '15%' : speed === 'slow' ? '4%' : '8%',
      decisionLogic: '目標スピード維持 ＆ 最適バランス調整',
      prediction: 'スピードと安定性の調和が取れているため、最も安定した進化プロセスを踏みます。第10世代付近でレーンの中間地点まで安定して到達可能になるでしょう。反面、微細な段差や幅の狭いレーンで、足元の「微小なふらつき」が残るのを克服するのには世代交代が必要です。',
    }),
  },
  {
    id: 'speed',
    title: 'スピード重視',
    desc: '前への推進力を追求し、ハイスピードな歩行を目指します。転倒率は高くなります。',
    detailDesc: 'AIが「スピードと距離」を追求し、限界領域まで前傾姿勢を維持します。アグレッシブな歩行になります。',
    specs: (speed: SpeedType) => ({
      maxSpeed: '3.0 m/s (最高速)',
      sensorRange: '70px (近距離検知)',
      mutationRate: speed === 'fast' ? '18%' : speed === 'slow' ? '5%' : '10%',
      decisionLogic: '限界前傾姿勢 ＆ 加速維持優先',
      prediction: '歩行時の前傾スピードが速すぎるため、第1世代〜第5世代の間は転倒が多発し、一見進化が停滞しているように見えます。しかし、そこを生き残った個体が劇的なピッチ（歩調）調整やアグレッシブな歩行を学習した際、圧倒的な歩行スピードを叩き出す可能性があります。',
    }),
  },
];
