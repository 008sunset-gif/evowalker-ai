import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type ParticleType = 'ripple' | 'smoke' | 'spark' | 'confetti';

export interface ParticleData {
  id: number;
  type: ParticleType;
  x: number;
  y: number; // 物理座標の横ずれ (3D Z軸は -y にマッピング)
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
  rot?: number;
  vRot?: number;
}

interface ParticleSystem3DProps {
  particles: ParticleData[];
}

export const ParticleSystem3D = ({ particles }: ParticleSystem3DProps) => {
  return (
    <group>
      {particles.map(p => {
        if (p.type === 'ripple') return <RippleParticle key={p.id} particle={p} />;
        if (p.type === 'smoke') return <SmokeParticle key={p.id} particle={p} />;
        if (p.type === 'confetti') return <ConfettiParticle key={p.id} particle={p} />;
        if (p.type === 'spark') return <SparkParticle key={p.id} particle={p} />;
        return null;
      })}
    </group>
  );
};

// スパーク火花 (クラッシュ時、足元Y≈1付近)
const SparkParticle = ({ particle }: { particle: ParticleData }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.x += particle.vx * 0.2;
      meshRef.current.position.y += Math.abs(particle.vy) * 0.3;
      (meshRef.current.material as THREE.Material).opacity = particle.alpha;
      meshRef.current.scale.setScalar(particle.size * 0.05);
    }
  });

  return (
    <mesh ref={meshRef} position={[particle.x, 1, -particle.y]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color={particle.color || '#f59e0b'} transparent opacity={particle.alpha} />
    </mesh>
  );
};

// 接地波紋 (足元Y=0の地面上)
const RippleParticle = ({ particle }: { particle: ParticleData }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.Material).opacity = particle.alpha;
      meshRef.current.scale.set(particle.size * 0.12, particle.size * 0.12, 1);
    }
  });

  return (
    <mesh ref={meshRef} position={[particle.x, 0.1, -particle.y]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1.2, 32]} />
      <meshBasicMaterial color={particle.color || '#60a5fa'} transparent opacity={particle.alpha} side={THREE.DoubleSide} />
    </mesh>
  );
};

// 土埃 (足元から上昇)
const SmokeParticle = ({ particle }: { particle: ParticleData }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y += 0.05;
      (meshRef.current.material as THREE.Material).opacity = particle.alpha;
      meshRef.current.scale.setScalar(particle.size * 0.15);
    }
  });

  return (
    <mesh ref={meshRef} position={[particle.x, 1, -particle.y]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#94a3b8" transparent opacity={particle.alpha} />
    </mesh>
  );
};

// 紙吹雪 (ゴール到達時、ロボットの上方に降る)
const ConfettiParticle = ({ particle }: { particle: ParticleData }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y -= 0.1;
      meshRef.current.position.x += particle.vx * 0.05;
      meshRef.current.rotation.x += (particle.vRot || 0.05);
      meshRef.current.rotation.z += (particle.vRot || 0.03);
      (meshRef.current.material as THREE.Material).opacity = particle.alpha;
    }
  });

  return (
    <mesh ref={meshRef} position={[particle.x, 25, -particle.y]}>
      <planeGeometry args={[particle.size * 0.4, particle.size * 0.2]} />
      <meshBasicMaterial color={particle.color} transparent opacity={particle.alpha} side={THREE.DoubleSide} />
    </mesh>
  );
};
