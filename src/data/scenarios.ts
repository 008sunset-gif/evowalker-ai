import type { ScenarioType } from '../types/simulation';

export interface ScenarioInfo {
  id: ScenarioType;
  title: string;
  desc: string;
  difficulty: string;
  icon: string;
  curveCount: string;      // レーン幅として流用
  obstacleDensity: string; // 障害物の有無として流用
  recommendedAI: string;   // 推奨方針
}

export const SCENARIOS: ScenarioInfo[] = [
  {
    id: 'city',
    title: '直線レーン',
    desc: 'まずはまっすぐ歩く力を試す基本ステージ。',
    difficulty: '難易度：★☆☆ (初級)',
    icon: '🚶',
    curveCount: '広い',
    obstacleDensity: 'なし',
    recommendedAI: 'バランス',
  },
  {
    id: 'highway',
    title: '細道レーン',
    desc: '横にふらつかず、中央線を保って歩けるかを試すステージ。',
    difficulty: '難易度：★★☆ (中級)',
    icon: '🎯',
    curveCount: '狭い',
    obstacleDensity: 'なし',
    recommendedAI: '安定重視',
  },
  {
    id: 'circuit',
    title: '障害物レーン',
    desc: 'ふらつきや転倒を抑えながら、障害物のある道を進む応用ステージ。',
    difficulty: '難易度：★★★ (上級)',
    icon: '🤖',
    curveCount: '普通',
    obstacleDensity: 'あり',
    recommendedAI: '安定重視',
  },
];
