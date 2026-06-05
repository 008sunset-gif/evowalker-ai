import type { ScenarioType, Waypoint } from '../types/simulation';

// 障害物・ブロックの定義
export interface CourseObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

// 境界線（ライン）の定義
export interface BoundaryLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface CourseLayout {
  waypoints: Waypoint[];
  innerBoundaries: BoundaryLine[];
  outerBoundaries: BoundaryLine[];
  obstacles: CourseObstacle[];
  roadWidth: number;
  startPoint: { x: number; y: number; angle: number };
}

// 仮想Canvasサイズ: 800 x 450
export const COURSE_LAYOUTS: Record<Exclude<ScenarioType, ''>, CourseLayout> = {
  city: {
    roadWidth: 60,
    startPoint: { x: 80, y: 380, angle: 0 },
    // waypointを結ぶレーンルート (直線・クランク)
    waypoints: [
      { x: 80, y: 380 },   // スタート
      { x: 420, y: 380 },  // 交差点1 (右折)
      { x: 420, y: 220 },  // 交差点2 (左折)
      { x: 140, y: 220 },  // 交差点3 (右折)
      { x: 140, y: 80 },   // 交差点4 (右折)
      { x: 720, y: 80 },   // 交差点5 (右折)
      { x: 720, y: 380 },  // 交差点6 (左折)
      { x: 550, y: 380 },  // ゴール付近
    ],
    // 矩形障害物
    obstacles: [
      { x: 140, y: 280, width: 220, height: 70, color: '#1a202c' }, // ブロックA
      { x: 0, y: 0, width: 80, height: 160, color: '#1a202c' },     // ブロックB
      { x: 200, y: 0, width: 460, height: 160, color: '#1a202c' },   // ブロックC
      { x: 480, y: 220, width: 180, height: 230, color: '#1a202c' }, // ブロックD
    ],
    innerBoundaries: [], // 当たり判定に使用予定
    outerBoundaries: [],
  },
  highway: {
    roadWidth: 70,
    startPoint: { x: 50, y: 225, angle: 0 },
    // 直線と細道レーンのwaypoint
    waypoints: [
      { x: 50, y: 225 },
      { x: 250, y: 200 },
      { x: 500, y: 250 },
      { x: 750, y: 225 }, // 折り返し
      { x: 700, y: 90 },
      { x: 400, y: 110 },
      { x: 100, y: 90 },
      { x: 50, y: 180 },
    ],
    // 静的障害物ブロック
    obstacles: [
      { x: 300, y: 215, width: 25, height: 15, color: '#e53e3e' }, // 障害物A
      { x: 550, y: 235, width: 25, height: 15, color: '#3182ce' }, // 障害物B
      // 中央境界線
      { x: 0, y: 145, width: 800, height: 10, color: '#4a5568' },
    ],
    innerBoundaries: [],
    outerBoundaries: [],
  },
  circuit: {
    roadWidth: 55,
    startPoint: { x: 100, y: 350, angle: -0.2 },
    // 障害物レーンのwaypoint
    waypoints: [
      { x: 100, y: 350 },
      { x: 220, y: 400 }, // 第1ポイント
      { x: 340, y: 300 }, // ポイント2
      { x: 460, y: 180 }, // ポイント3
      { x: 620, y: 100 }, // ポイント4
      { x: 730, y: 180 }, // ポイント5
      { x: 680, y: 320 }, // ポイント6
      { x: 500, y: 400 }, // ポイント7
      { x: 320, y: 330 }, // 最終ポイント
    ],
    // 境界やトラップを模した配置
    obstacles: [
      { x: 260, y: 180, width: 140, height: 80, color: '#2d3748' },
      { x: 560, y: 160, width: 80, height: 120, color: '#2d3748' },
    ],
    innerBoundaries: [],
    outerBoundaries: [],
  },
};
