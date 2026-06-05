import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Plane, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import type { ScenarioType } from '../../types/simulation';
import { GOAL_X, getLaneHalfWidth, OBSTACLES_3D } from '../../simulation/walkerPhysics3D';

interface LaneEnvironment3DProps {
  scenarioId: ScenarioType;
  goalX?: number;
}

/**
 * 座標系（walkerPhysics3D / WalkerRobot3D と統一）:
 *   X軸: 前進方向 (0 → GOAL_X)
 *   Z軸: 横方向 (-LANE_HALF_WIDTH 〜 +LANE_HALF_WIDTH)
 *   Y軸: 高さ (地面 = 0)
 *
 * レーン幅: Z方向に ±LANE_HALF_WIDTH (= ±100)
 * レーン長: X方向に 0 → GOAL_X (= 0 → 600)
 */
export const LaneEnvironment3D = ({ scenarioId, goalX = GOAL_X }: LaneEnvironment3DProps) => {
  const fenceMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  // フェンスのパルス発光
  useFrame(({ clock }) => {
    if (fenceMaterialRef.current) {
      const t = clock.getElapsedTime();
      fenceMaterialRef.current.emissiveIntensity = (Math.sin(t * 3) + 1) * 0.5 * 0.35;
    }
  });

  const isNarrow = scenarioId === 'highway';
  const bgColor = isNarrow ? "#0f172a" : "#e2e8f0";
  const gridColor1 = isNarrow ? "#1e293b" : "#cbd5e1";
  const gridColor2 = isNarrow ? "#0f172a" : "#e2e8f0";

  const laneHalfWidth = getLaneHalfWidth(scenarioId);
  const laneLength = goalX;          // X: 0 → goalX
  const laneWidth = laneHalfWidth * 2;  // Z: -100 → +100 = 200
  const laneCenterX = laneLength / 2;     // X中心

  return (
    <group>
      {/* ========== 広大な背景床 ========== */}
      <Plane
        args={[3000, 1000]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[laneCenterX, -0.02, 0]}
        receiveShadow
      >
        <meshStandardMaterial color={bgColor} />
      </Plane>
      <gridHelper
        args={[3000, 150, gridColor1, gridColor2]}
        position={[laneCenterX, -0.01, 0]}
      />

      {/* ========== メインレーン（アスファルト） ========== */}
      <Plane
        args={[laneLength, laneWidth]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[laneCenterX, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#64748b" roughness={0.8} metalness={0.05} />
      </Plane>

      {/* ========== センターライン（破線） ========== */}
      <Instances range={60} receiveShadow>
        <boxGeometry args={[8, 0.05, 1.2]} />
        <meshStandardMaterial color="#ffffff" opacity={0.9} transparent />
        {Array.from({ length: 60 }).map((_, i) => (
          <Instance key={`cline-${i}`} position={[i * 10 + 5, 0.03, 0]} />
        ))}
      </Instances>

      {/* ========== スタートライン ========== */}
      <Box args={[1.5, 0.06, laneWidth]} position={[0, 0.03, 0]}>
        <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.5} />
      </Box>
      {/* スタートマーカー "START" */}
      <Box args={[0.3, 0.05, 0.3]} position={[0, 0.03, -80]}>
        <meshStandardMaterial color="#3b82f6" />
      </Box>

      {/* ========== 左右の警告フェンス ========== */}
      <Instances range={80} castShadow receiveShadow>
        <boxGeometry args={[8, 5, 2.5]} />
        <meshStandardMaterial
          ref={fenceMaterialRef}
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0}
        />
        {Array.from({ length: 80 }).map((_, i) => (
          <group key={`fence-${i}`}>
            {/* +Z側フェンス */}
            <Instance position={[i * 8, 2.5, laneHalfWidth + 1.25]} />
            {/* -Z側フェンス */}
            <Instance position={[i * 8, 2.5, -(laneHalfWidth + 1.25)]} />
          </group>
        ))}
      </Instances>

      {/* ========== ゴールゲート ========== */}
      <group position={[goalX, 0, 0]}>
        {/* ゴールライン */}
        <Box args={[2, 0.08, laneWidth]} position={[0, 0.04, 0]}>
          <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.6} />
        </Box>
        {/* 左柱 */}
        <Cylinder args={[2.5, 2.5, 30]} position={[0, 15, laneHalfWidth + 2.5]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </Cylinder>
        {/* 右柱 */}
        <Cylinder args={[2.5, 2.5, 30]} position={[0, 15, -(laneHalfWidth + 2.5)]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </Cylinder>
        {/* 上梁 */}
        <Box args={[4, 3.5, laneWidth + 10]} position={[0, 30.5, 0]} castShadow>
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
        </Box>
        {/* ゴール照明 */}
        <pointLight position={[0, 25, 0]} intensity={3} color="#4ade80" distance={120} decay={2} />
        <pointLight position={[0, 5, 0]} intensity={1.5} color="#4ade80" distance={60} decay={2} />
      </group>

      {/* ========== シナリオ別障害物（障害物レーン circuit のみ） ========== */}
      {/* 物理判定(updateWalkerPhysics3D)と同一の OBSTACLES_3D を参照し、見た目と当たり判定を一致させる */}
      {scenarioId === 'circuit' && (
        <group>
          {OBSTACLES_3D.map((obs, i) => (
            <LaneObstacle
              key={i}
              // 底面を地面(Y=0)に接地させる（中心 Y = height/2）
              position={[obs.x, obs.height / 2, obs.z]}
              // 判定矩形と同じフットプリント [X=width, Y=height, Z=depth]
              size={[obs.width, obs.height, obs.depth]}
              color={obs.color}
            />
          ))}
        </group>
      )}
    </group>
  );
};

// レーン障害物コンポーネント
const LaneObstacle = ({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) => (
  <Box args={size} position={position} castShadow receiveShadow>
    <meshStandardMaterial color={color} metalness={0.2} roughness={0.7} />
  </Box>
);
