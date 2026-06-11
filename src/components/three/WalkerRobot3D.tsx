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

    // ====== "上手さ"遺伝子 → 歩容の安定度マッピング（描画のみ。GA/物理ロジックには一切不干渉） ======
    // balanceCorrection 高 = 上体が安定 / recoveryAbility 高 = 立て直しが滑らか /
    // wobbleStrength 高 = 生まれつき不安定。これらを正規化し、歩きの「ガクつき量」を合成する。
    const g = walker.genome;
    const balance01 = Math.min(1, Math.max(0, (g.balanceCorrection ?? 1.0) / 1.5));
    const recovery01 = Math.min(1, Math.max(0, (g.recoveryAbility ?? 1.0) / 1.2));
    const wobble01 = Math.min(1, Math.max(0, (g.wobbleStrength ?? 1.0) / 2.5));
    // 0.0 = 滑らかな達人 / 1.0 = ガクガクの新人。世代が進むと選抜でこの値が下がり、歩きが洗練されて見える。
    const instability = Math.min(
      1,
      wobble01 * 0.5 + (1 - balance01) * 0.3 + (1 - recovery01) * 0.2
    );
    const idPhase = walker.id * 1.7; // 個体ごとに揺れの位相をずらして群れの単調さを防ぐ

    // ====== 歩行アニメーション ======
    if (walker.isActive || walker.status === 'stalled') {
      const stepRhythm = walker.genome.stepRhythm || 1.0;
      const strideLength = walker.genome.strideLength || 1.0;
      const phase = walker.aliveTime * stepRhythm * 0.14;

      // 非整数倍音サインを重ねて「不規則だが滑らかな揺れ」を作る（乱数フリッカを避ける）
      const tremor = (amp: number, freq: number) => Math.sin(phase * freq + idPhase) * amp;
      // 上体の横揺れ: balance低/wobble高で高周波の小刻みな揺れ + recovery低で低周波の戻り遅れ
      const swayZ =
        instability * (tremor(0.22, 1.7) + tremor(0.1, 3.3)) +
        (1 - recovery01) * tremor(0.16, 0.9);
      // 上体の前後ぐらつき（ピッチ）
      const pitchX = instability * (tremor(0.12, 2.3) + tremor(0.05, 4.1));

      // 胴体の上下動（ボビング）：両脚接地で沈み、立脚の中央で持ち上がる（2倍周期・滑らか）
      const baseBob = (0.5 - 0.5 * Math.cos(phase * 2)) * 0.55;
      const roughBob = instability * Math.abs(Math.sin(phase * 3.1 + idPhase)) * 0.4;
      // 体重移動による自然な左右の揺れ（歩調と同周期）＋上体のひねり（肩と腰の逆回転）＋わずかな前傾
      const naturalSwayZ = Math.sin(phase) * 0.07;
      const torsoYaw = Math.sin(phase) * 0.05;
      const forwardLean = 0.05;

      groupRef.current.position.y = worldY + baseBob + roughBob;
      groupRef.current.rotation.z = targetTilt + naturalSwayZ + swayZ;
      groupRef.current.rotation.x = forwardLean + pitchX;
      groupRef.current.rotation.y = targetHeading + torsoYaw;

      // 脚の前後スイング（股関節）— 不安定なほど歩幅が左右非対称・小刻みに乱れる
      const strideJitterL = 1 + instability * tremor(0.28, 1.3);
      const strideJitterR =
        1 + instability * Math.sin(phase * 1.3 + idPhase + Math.PI) * 0.28;
      const thighAmp = 0.55 * strideLength;
      const leftThighAngle = Math.sin(phase) * thighAmp * strideJitterL;
      const rightThighAngle = Math.sin(phase + Math.PI) * thighAmp * strideJitterR;

      // 膝：遊脚（踏み出し）で大きく曲げて足を持ち上げ、立脚ではほぼ伸ばす。
      //   sin を二乗した正の隆起で「立脚=伸び／遊脚=曲げ」のメリハリを出す（膝は後方へ曲がる）。
      const kneeBend = (legPhase: number) => {
        const swing = Math.max(0, Math.sin(legPhase + 0.9));
        return swing * swing * 1.2;
      };
      const leftKneeAngle = kneeBend(phase);
      const rightKneeAngle = kneeBend(phase + Math.PI);

      // 足首：踏み出しでつま先を上げ、蹴り出しで下げる＋脛の傾きに対して足裏を地面寄りへ補正
      const ankleRoll = (legPhase: number, thigh: number, knee: number) =>
        Math.sin(legPhase - 0.3) * 0.2 - (thigh - knee) * 0.22;
      const leftAnkleAngle = ankleRoll(phase, leftThighAngle, leftKneeAngle);
      const rightAnkleAngle = ankleRoll(phase + Math.PI, rightThighAngle, rightKneeAngle);

      // 腕は脚と逆位相で自然に振る（左脚が前なら左腕は後ろ）。不安定な個体は腕がバタつく
      const armSwingAngle = Math.sin(phase) * 0.45;
      const armFlail = instability * tremor(0.35, 2.7);

      if (leftLegRef.current) leftLegRef.current.rotation.x = leftThighAngle;
      if (rightLegRef.current) rightLegRef.current.rotation.x = rightThighAngle;
      if (leftKneeRef.current) leftKneeRef.current.rotation.x = -leftKneeAngle;
      if (rightKneeRef.current) rightKneeRef.current.rotation.x = -rightKneeAngle;
      if (leftAnkleRef.current) leftAnkleRef.current.rotation.x = leftAnkleAngle;
      if (rightAnkleRef.current) rightAnkleRef.current.rotation.x = rightAnkleAngle;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwingAngle + armFlail;
      if (rightArmRef.current) rightArmRef.current.rotation.x = armSwingAngle - armFlail;

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
    } else if (walker.status === 'obstacleHit') {
      // 障害物衝突時: 倒れず、その場で停止して軽くのけぞる（転倒・コースアウトと区別）
      groupRef.current.position.y = worldY;
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.15);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -0.3, 0.15);
      // 両腕を前に出して衝突をガードするポーズ
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -1.2, 0.1);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -1.2, 0.1);
    }
  });

  // 状態ごとのマテリアルカラー変更
  let finalBodyColor = bodyColor;
  let finalEmissiveColor = emissiveColor;
  if (walker.status === 'fallen' || walker.status === 'obstacleHit' || walker.status === 'outOfLane' || walker.status === 'stalled') {
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
            🌟 現世代ベスト
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
      {walker.status === 'obstacleHit' && (
        // 衝突: 太く明るい赤の警告リング（転倒の細い赤・コースアウトの橙と区別）
        <mesh position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.4, 3.4, 32]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.9} side={THREE.DoubleSide} />
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
