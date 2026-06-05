import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Sphere, RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { VehicleState } from '../../types/simulation';

interface WalkerRobot3DProps {
  walker: VehicleState;
  isElite: boolean;
}

/**
 * 座標変換ルール（walkerPhysics3D と統一）:
 *   walker.x  → Three.js X軸  (前進方向: 0 → 600)
 *   walker.y  → Three.js -Z軸 (横ずれ: 中央=0, +walker.y=右=+Z、逆向きに注意)
 *                              worldZ = -walker.y  (左がプラス)
 *   高さ      → Three.js Y軸  (地面=0, ロボット重心はスケール込みでY=0を底にする)
 */
export const WalkerRobot3D = ({ walker, isElite }: WalkerRobot3DProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftKneeRef = useRef<THREE.Group>(null);
  const rightKneeRef = useRef<THREE.Group>(null);
  const leftAnkleRef = useRef<THREE.Group>(null);
  const rightAnkleRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  // マテリアル設定（エリートは金色発光）
  const bodyColor = isElite ? '#fcd34d' : walker.color || '#3b82f6';
  const emissiveColor = isElite ? '#fbbf24' : '#1d4ed8';
  const emissiveIntensity = isElite ? 0.8 : 0.4;

  const materialProps = {
    color: bodyColor,
    emissive: emissiveColor,
    emissiveIntensity,
    metalness: 0.3,
    roughness: 0.5,
  };
  const jointMaterialProps = { color: '#334155', metalness: 0.8, roughness: 0.2 };

  useFrame(() => {
    if (!groupRef.current) return;

    // ====== 座標変換 (walkerPhysics3D と完全統一) ======
    // walker.x = 前進 (Three.js X軸と同一)
    // walker.y = 横ずれ (Three.js Z軸は -walker.y)
    // ロボットの底面が地面(Y=0)に接するようY位置を設定
    // スケール1.0で総高さ≒15ユニット → 重心はY=7.5程度
    const worldX = walker.x;
    const worldZ = -walker.y;       // 横ずれのZ変換
    const worldY = 7.5;             // 地面(Y=0)に接地した重心高さ

    groupRef.current.position.set(worldX, worldY, worldZ);

    // 転倒角 (ふらつき: wobbleAngle)
    const targetTilt = -walker.wobbleAngle;
    // 前進方向 (Heading: angle) -> +X方向基準でY軸回転
    const targetHeading = walker.angle;

    // ====== 歩行アニメーション ======
    if (walker.isActive || walker.status === 'stalled') {
      const stepRhythm = walker.genome.stepRhythm || 1.0;
      const strideLength = walker.genome.strideLength || 1.0;
      const phase = walker.aliveTime * stepRhythm * 0.14;

      // 胴体の上下動（ボビング）
      groupRef.current.position.y = worldY + Math.abs(Math.sin(phase * 2)) * 0.5;
      groupRef.current.rotation.z = targetTilt;
      groupRef.current.rotation.y = targetHeading;

      const leftThighAngle = Math.sin(phase) * 0.5 * strideLength;
      const rightThighAngle = Math.sin(phase + Math.PI) * 0.5 * strideLength;

      const sinP = Math.sin(phase);
      const leftKneeAngle = sinP > 0 ? sinP * 0.7 : 0;
      const rightKneeAngle = sinP < 0 ? -sinP * 0.7 : 0;

      const leftFootWorldAngle = sinP > 0 ? 0.16 * sinP : 0;
      const leftAnkleAngle = leftFootWorldAngle - (leftThighAngle - leftKneeAngle);
      const rightFootWorldAngle = sinP < 0 ? -0.16 * sinP : 0;
      const rightAnkleAngle = rightFootWorldAngle - (rightThighAngle - rightKneeAngle);

      // 腕は足と逆位相で振る (左足が前なら左腕は後ろ)
      const armSwingAngle = Math.sin(phase) * 0.5;

      if (leftLegRef.current) leftLegRef.current.rotation.x = leftThighAngle;
      if (rightLegRef.current) rightLegRef.current.rotation.x = rightThighAngle;
      if (leftKneeRef.current) leftKneeRef.current.rotation.x = -leftKneeAngle;
      if (rightKneeRef.current) rightKneeRef.current.rotation.x = -rightKneeAngle;
      if (leftAnkleRef.current) leftAnkleRef.current.rotation.x = leftAnkleAngle;
      if (rightAnkleRef.current) rightAnkleRef.current.rotation.x = rightAnkleAngle;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwingAngle;
      if (rightArmRef.current) rightArmRef.current.rotation.x = armSwingAngle;

      // stalled 時は激しく揺らす（立ち往生の足掻き）
      if (walker.status === 'stalled') {
        groupRef.current.rotation.z += (Math.random() - 0.5) * 0.2;
        groupRef.current.rotation.x += (Math.random() - 0.5) * 0.2;
      }

    } else if (walker.status === 'goal') {
      groupRef.current.position.y = worldY;
      // ゴール時: バンザイポーズ
      if (leftArmRef.current) leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, Math.PI * 0.7, 0.1);
      if (rightArmRef.current) rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -Math.PI * 0.7, 0.1);
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1);
      if (leftKneeRef.current) leftKneeRef.current.rotation.x = THREE.MathUtils.lerp(leftKneeRef.current.rotation.x, 0, 0.1);
      if (rightKneeRef.current) rightKneeRef.current.rotation.x = THREE.MathUtils.lerp(rightKneeRef.current.rotation.x, 0, 0.1);
    } else if (walker.status === 'fallen') {
      // 転倒時: 脱力＆横倒し (0.5秒〜1秒かけてゆっくり倒れる)
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, Math.PI / 2, 0.05);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 2.5, 0.05);
      if (leftArmRef.current) { leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0, 0.1); leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.1); }
      if (rightArmRef.current) { rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0, 0.1); rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.1); }
    } else if (walker.status === 'outOfLane') {
      // レーン外脱落時: 完全に倒れ、地下へ少し沈む
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, Math.PI / 1.5, 0.03);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, -3, 0.03);
      if (leftArmRef.current) { leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0, 0.1); leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.1); }
      if (rightArmRef.current) { rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0, 0.1); rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.1); }
    }
  });

  // 状態ごとのマテリアルカラー変更
  let finalBodyColor = bodyColor;
  let finalEmissiveColor = emissiveColor;
  if (walker.status === 'fallen' || walker.status === 'outOfLane' || walker.status === 'stalled') {
    finalBodyColor = '#64748b'; // failure gray
    finalEmissiveColor = '#ef4444'; // failure red
  }

  const matProps = {
    ...materialProps,
    color: finalBodyColor,
    emissive: finalEmissiveColor,
  };

  // ============================================================
  // ロボット形状 (前進方向が +X、腕脚は Z軸方向に伸ばす)
  // 重心 (group origin) = 胴体中心 ≈ Y=0（高さはgroupのY positionで制御）
  // 胴体: -2.5〜+2.5 (Y), 全体高さ≒15
  // ============================================================
  return (
    <group ref={groupRef} castShadow>

      {/* エリート用ネームプレート */}
      {isElite && (
        <Html position={[0, 10, 0]} center style={{ pointerEvents: 'none', zIndex: 10 }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            border: '1px solid #fcd34d',
            color: '#fcd34d',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap'
          }}>
            🌟 BEST GENOME
          </div>
        </Html>
      )}

      {/* 失敗状態表示用のVFXエフェクト */}
      {walker.status === 'fallen' && (
        <mesh position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.5, 3, 32]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
      {walker.status === 'outOfLane' && (
        <mesh position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.5, 3, 32]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
      {walker.status === 'stalled' && (
        <mesh position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.5, 3, 32]} />
          <meshBasicMaterial color="#eab308" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 影（地面との接地感） */}
      <mesh position={[0, -7.4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.5, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} />
      </mesh>

      {/* 胴体 (Y: -2.5 〜 +2.5) */}
      <RoundedBox args={[4, 5, 3]} radius={0.5} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>

      {/* 頭部 (胴体上 +4) */}
      <Sphere args={[1.8, 16, 16]} position={[0, 4.5, 0]} castShadow>
        <meshStandardMaterial {...matProps} />
      </Sphere>

      {/* バイザー */}
      <Box args={[2, 0.9, 2.2]} position={[1.2, 4.6, 0]} castShadow>
        <meshPhysicalMaterial color="#22d3ee" opacity={0.85} emissive="#06b6d4" emissiveIntensity={0.6} transparent />
      </Box>

      {/* 王冠 (ゴール到達エリートのみ) */}
      {isElite && walker.reachedGoal && (
        <Cylinder args={[0.9, 1.3, 1.2, 8]} position={[0, 6.8, 0]}>
          <meshStandardMaterial color="#fcd34d" emissive="#fbbf24" emissiveIntensity={0.9} />
        </Cylinder>
      )}

      {/* アンテナ */}
      <Cylinder args={[0.12, 0.12, 2]} position={[0, 6.5, 0.8]}>
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
      </Cylinder>
      <Sphere args={[0.35, 8, 8]} position={[0, 7.6, 0.8]}>
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
      </Sphere>

      {/* ============ 腕（Z軸方向に伸ばす） ============ */}
      {/* 左腕 (+Z側) */}
      <group ref={leftArmRef} position={[0, 1.5, 2.2]}>
        <Sphere args={[0.7]}><meshStandardMaterial {...jointMaterialProps} /></Sphere>
        <Cylinder args={[0.35, 0.3, 3]} position={[0, -1.5, 0]} castShadow>
          <meshStandardMaterial {...matProps} />
        </Cylinder>
        <Sphere args={[0.3]} position={[0, -3, 0]}><meshStandardMaterial {...jointMaterialProps} /></Sphere>
      </group>

      {/* 右腕 (-Z側) */}
      <group ref={rightArmRef} position={[0, 1.5, -2.2]}>
        <Sphere args={[0.7]}><meshStandardMaterial {...jointMaterialProps} /></Sphere>
        <Cylinder args={[0.35, 0.3, 3]} position={[0, -1.5, 0]} castShadow>
          <meshStandardMaterial {...matProps} />
        </Cylinder>
        <Sphere args={[0.3]} position={[0, -3, 0]}><meshStandardMaterial {...jointMaterialProps} /></Sphere>
      </group>

      {/* ============ 脚（Z軸方向オフセット、X軸回りに動く） ============ */}
      {/* 左脚 (+Z側) */}
      <group ref={leftLegRef} position={[0, -2.8, 1.2]}>
        <Sphere args={[0.65]}><meshStandardMaterial {...jointMaterialProps} /></Sphere>
        <Cylinder args={[0.5, 0.4, 3.2]} position={[0, -1.6, 0]} castShadow>
          <meshStandardMaterial {...matProps} />
        </Cylinder>
        <group ref={leftKneeRef} position={[0, -3.2, 0]}>
          <Sphere args={[0.5]}><meshStandardMaterial {...jointMaterialProps} /></Sphere>
          <Cylinder args={[0.4, 0.3, 3]} position={[0, -1.5, 0]} castShadow>
            <meshStandardMaterial {...matProps} />
          </Cylinder>
          <group ref={leftAnkleRef} position={[0, -3, 0]}>
            <Sphere args={[0.4]}><meshStandardMaterial {...jointMaterialProps} /></Sphere>
            {/* 足 (前方に伸ばす +X方向) */}
            <RoundedBox args={[2.8, 0.7, 1.2]} radius={0.2} position={[0.8, -0.35, 0]} castShadow>
              <meshStandardMaterial {...matProps} />
            </RoundedBox>
          </group>
        </group>
      </group>

      {/* 右脚 (-Z側) */}
      <group ref={rightLegRef} position={[0, -2.8, -1.2]}>
        <Sphere args={[0.65]}><meshStandardMaterial {...jointMaterialProps} /></Sphere>
        <Cylinder args={[0.5, 0.4, 3.2]} position={[0, -1.6, 0]} castShadow>
          <meshStandardMaterial {...matProps} />
        </Cylinder>
        <group ref={rightKneeRef} position={[0, -3.2, 0]}>
          <Sphere args={[0.5]}><meshStandardMaterial {...jointMaterialProps} /></Sphere>
          <Cylinder args={[0.4, 0.3, 3]} position={[0, -1.5, 0]} castShadow>
            <meshStandardMaterial {...matProps} />
          </Cylinder>
          <group ref={rightAnkleRef} position={[0, -3, 0]}>
            <Sphere args={[0.4]}><meshStandardMaterial {...jointMaterialProps} /></Sphere>
            {/* 足 (前方に伸ばす +X方向) */}
            <RoundedBox args={[2.8, 0.7, 1.2]} radius={0.2} position={[0.8, -0.35, 0]} castShadow>
              <meshStandardMaterial {...matProps} />
            </RoundedBox>
          </group>
        </group>
      </group>

    </group>
  );
};
