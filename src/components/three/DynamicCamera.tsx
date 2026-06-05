import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { VehicleState } from '../../types/simulation';

interface DynamicCameraProps {
  vehiclesRef: React.MutableRefObject<VehicleState[]>;
}

/**
 * カメラ追尾コンポーネント
 * 座標系（walkerPhysics3D と統一）:
 *   X軸: 前進方向 (0 → 600)
 *   Z軸: 横方向
 *   Y軸: 高さ
 *
 * カメラ配置:
 *   - リーダー個体の斜め後方・斜め上から追尾
 *   - ロボット本体・レーン・障害物が同時に見える構図
 *   - 初期位置: X=-50, Y=60, Z=80（スタート地点を斜め後方から見る）
 */
export const DynamicCamera = ({ vehiclesRef }: DynamicCameraProps) => {
  const { camera } = useThree();

  // スムーズ追尾用 refs（初期値はスタート地点を見る位置）
  const camX = useRef(-50);
  const camY = useRef(60);
  const camZ = useRef(90);
  const lookX = useRef(50);
  const lookZ = useRef(0);

  useFrame(() => {
    // アクティブ個体の中で最も進んでいる X 座標を探す
    let leaderX = 0;
    let leaderZ = 0;
    let anyActive = false;

    vehiclesRef.current.forEach(v => {
      if (v.isActive) {
        anyActive = true;
        if (v.x > leaderX) {
          leaderX = v.x;
          leaderZ = -v.y; // walker.y → 3D Z変換
        }
      }
    });

    // 全員停止した場合はゴール付近・またはリセット地点を見る
    if (!anyActive) {
      vehiclesRef.current.forEach(v => {
        if (v.x > leaderX) {
          leaderX = v.x;
          leaderZ = -v.y;
        }
      });
    }

    // ========== カメラ目標位置の計算 ==========
    // 注視点: リーダーの少し前方・地面寄り
    const targetLookX = leaderX + 30;
    const targetLookZ = leaderZ * 0.3; // 横ずれを少し緩めに追従

    // カメラ位置: リーダーの斜め後方・斜め上
    //   - 後方オフセット: -80 (進行方向 X軸 の後ろ)
    //   - 高さオフセット: +55 (Y軸)
    //   - 横オフセット: +70 (Z軸の斜め横)
    const targetCamX = leaderX - 80;
    const targetCamY = 55;
    const targetCamZ = leaderZ * 0.2 + 70;

    // スムーズ補間 (lerp)
    const lerpSpeed = 0.06;
    camX.current += (targetCamX - camX.current) * lerpSpeed;
    camY.current += (targetCamY - camY.current) * lerpSpeed;
    camZ.current += (targetCamZ - camZ.current) * lerpSpeed;
    lookX.current += (targetLookX - lookX.current) * lerpSpeed;
    lookZ.current += (targetLookZ - lookZ.current) * lerpSpeed;

    camera.position.set(camX.current, camY.current, camZ.current);
    camera.lookAt(lookX.current, 7.5, lookZ.current); // ロボット重心高さ 7.5 を見る
  });

  return null;
};
