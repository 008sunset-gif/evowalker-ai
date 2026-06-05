import type { Waypoint } from '../types/simulation';
import type { CourseObstacle } from '../data/courseData';

// 点 P と線分 AB との最短距離を求める
export const getDistanceToSegment = (
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): { distance: number; x: number; y: number } => {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;

  const abLenSq = abx * abx + aby * aby;
  if (abLenSq === 0) {
    return {
      distance: Math.sqrt(apx * apx + apy * apy),
      x: ax,
      y: ay,
    };
  }

  // 射影比率 t の計算 (0.0 〜 1.0 にクランプ)
  let t = (apx * abx + apy * aby) / abLenSq;
  t = Math.max(0, Math.min(1, t));

  // 最短の点 D
  const dx = ax + t * abx;
  const dy = ay + t * aby;

  const diffX = px - dx;
  const diffY = py - dy;

  return {
    distance: Math.sqrt(diffX * diffX + diffY * diffY),
    x: dx,
    y: dy,
  };
};

// 点 P がコース道路内にあるか判定 (もっとも近いウェイポイント間線分との距離が道路幅の半分以下か)
export const isPointOnRoad = (
  px: number,
  py: number,
  waypoints: Waypoint[],
  roadWidth: number,
  isClosed: boolean
): boolean => {
  if (waypoints.length < 2) return false;

  let minDistance = Infinity;

  // すべてのウェイポイント区間（線分）に対して点との最短距離をチェック
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const { distance } = getDistanceToSegment(px, py, p1.x, p1.y, p2.x, p2.y);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  // 周回コースの場合、最後の点と最初の点の間の接続もチェック
  if (isClosed) {
    const p1 = waypoints[waypoints.length - 1];
    const p2 = waypoints[0];
    const { distance } = getDistanceToSegment(px, py, p1.x, p1.y, p2.x, p2.y);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  // 最短距離が道路幅の半分以下であれば道路内と判定
  return minDistance <= (roadWidth / 2) + 2; // わずかなマージンを含める
};

// 点 P が障害物（矩形リスト）のいずれかに入っているか判定
export const isPointInObstacles = (
  px: number,
  py: number,
  obstacles: CourseObstacle[]
): boolean => {
  return obstacles.some(
    (obs) => px >= obs.x && px <= obs.x + obs.width && py >= obs.y && py <= obs.y + obs.height
  );
};

// センサーの1方向レイキャストスキャン (簡易レイマーチング方式)
// 道路境界（外側）または障害物に当たる位置を探し、そこまでの距離を返す
export const scanSensorRay = (
  carX: number,
  carY: number,
  angle: number,
  waypoints: Waypoint[],
  roadWidth: number,
  obstacles: CourseObstacle[],
  isClosed: boolean,
  maxRange: number = 100
): { distance: number; hitX: number; hitY: number; hitType: 'wall' | 'obstacle' | 'none' } => {
  const step = 4; // 4ピクセル刻みで走査
  
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  for (let dist = step; dist <= maxRange; dist += step) {
    const scanX = carX + cos * dist;
    const scanY = carY + sin * dist;

    // A. Canvasの画面外判定
    if (scanX < 0 || scanX > 800 || scanY < 0 || scanY > 450) {
      return { distance: dist, hitX: scanX, hitY: scanY, hitType: 'wall' };
    }

    // B. 障害物に当たった判定
    if (isPointInObstacles(scanX, scanY, obstacles)) {
      return { distance: dist, hitX: scanX, hitY: scanY, hitType: 'obstacle' };
    }

    // C. コース外壁（道路外）に出た判定
    if (!isPointOnRoad(scanX, scanY, waypoints, roadWidth, isClosed)) {
      return { distance: dist, hitX: scanX, hitY: scanY, hitType: 'wall' };
    }
  }

  // 何も当たらなかった場合 (最大射程を返す)
  return {
    distance: maxRange,
    hitX: carX + cos * maxRange,
    hitY: carY + sin * maxRange,
    hitType: 'none',
  };
};
export default scanSensorRay;
