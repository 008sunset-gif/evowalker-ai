import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { WalkerRobot3D } from '../components/three/WalkerRobot3D';
import type { VehicleState } from '../types/simulation';
import { useRef } from 'react';

// Hero用デモ歩行ロボット
const HeroWalkerDemo = () => {
  const walkerRef = useRef<VehicleState>({
    id: 1,
    x: 0,
    y: 0,
    angle: 0.1,
    speed: 0,
    steering: 0,
    color: '#0ea5e9',
    isActive: true,
    currentWaypointIndex: 0,
    maxSpeedLimit: 1,
    noiseFactor: 1,
    waypointsPassed: 0,
    distanceTravelled: 0,
    aliveTime: 0,
    crashReason: '',
    finalScore: 0,
    reachedGoal: false,
    status: 'walking',
    wobbleAngle: 0,
    genome: {
      strideLength: 1.0,
      stepRhythm: 1.0,
      balanceCorrection: 1.0,
      lateralDrift: 0,
      wobbleStrength: 0.2,
      speedFactor: 1.0,
      steeringBias: 0,
      recoveryAbility: 1.0,
      lateralAmplitude: 0.3,
      lateralFrequency: 0.5,
      lateralPhase: 0,
      centerPull: 1.0
    },
  });

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    walkerRef.current.aliveTime += 0.5; // ゆっくりとしたアイドルモーション
    walkerRef.current.wobbleAngle = Math.sin(t * 1.5) * 0.08; // 左右への緩やかな重心移動
    walkerRef.current.angle = Math.sin(t * 0.8) * 0.05; // 軽い首/胴体のひねり
  });

  return <WalkerRobot3D walker={walkerRef.current} isElite={true} />;
};

export const TopPage = () => {
  const navigate = useNavigate();
  const { resetSimulation } = useSimulation();

  const handleStart = () => {
    resetSimulation();
    navigate('/scenario');
  };

  return (
    <div className="top-page-container fade-in" style={{ 
      backgroundImage: 'linear-gradient(rgba(248, 250, 252, 0.85), rgba(226, 232, 240, 0.95)), url(/hero_main.png)', 
      backgroundSize: 'cover', 
      backgroundPosition: 'center' 
    }}>
      <div className="hero-layout">
        <div className="hero-text-section" style={{ paddingLeft: '5%' }}>
          <div className="portfolio-badge" style={{ background: 'var(--color-primary)', color: 'white', letterSpacing: '2px', fontWeight: 800 }}>EVOLUTIONARY AI SIMULATOR</div>
          <h1 className="hero-title" style={{ color: '#0f172a', fontSize: '2.5rem', lineHeight: '1.3' }}>
            転んで、選ばれて、次の世代へ。<br/>
            <span style={{ color: 'var(--color-primary)' }}>AI歩行の進化を観察する。</span>
          </h1>
          <p className="hero-subtitle" style={{ color: '#334155', fontWeight: 500, lineHeight: '1.7' }}>
            <b>遺伝的アルゴリズム</b>で、二足歩行ロボットが世代ごとに転倒・衝突・コースアウトを乗り越えて進化する様子を3Dで観察できるシミュレーターです。<br/>
            最初の世代は転倒やコースアウトを繰り返しますが、成績の良い個体が遺伝子を引き継ぐことで、世代ごとにまっすぐ歩ける個体が増えていきます。
          </p>

          <div className="evolution-preview-steps" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <div className="preview-step">
              <span className="step-badge" style={{ background: '#ef4444' }}>STEP 1</span>
              <span className="step-text">試す (転倒・迷走)</span>
            </div>
            <div className="preview-arrow" style={{ color: '#0ea5e9' }}>›</div>
            <div className="preview-step">
              <span className="step-badge" style={{ background: '#f59e0b' }}>STEP 2</span>
              <span className="step-text">選ばれる (良い遺伝子を残す)</span>
            </div>
            <div className="preview-arrow" style={{ color: '#0ea5e9' }}>›</div>
            <div className="preview-step">
              <span className="step-badge" style={{ background: '#10b981' }}>STEP 3</span>
              <span className="step-text">進化する (直進・ゴール)</span>
            </div>
          </div>

          <div className="hero-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <button onClick={handleStart} className="btn btn-primary btn-lg pulse-glow" style={{ fontSize: '1.1rem', fontWeight: 800, padding: '16px 36px' }}>
              進化シミュレーションを始める
            </button>
          </div>
        </div>

        <div className="hero-visual-section" style={{ flex: 1.2, minWidth: '450px' }}>
          <div className="visual-wrapper" style={{ 
            position: 'relative', width: '100%', height: '550px', borderRadius: '24px', 
            overflow: 'hidden', background: 'rgba(255,255,255,0.15)', 
            boxShadow: '0 20px 40px rgba(14, 165, 233, 0.15)', border: '1px solid rgba(255,255,255,0.6)',
            backdropFilter: 'blur(20px)'
          }}>
            <div className="visual-glow" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '150%', height: '150%', background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 60%)', zIndex: 0 }}></div>
            
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, cursor: 'grab' }} onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'} onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'} onMouseLeave={(e) => e.currentTarget.style.cursor = 'grab'}>
              <Canvas shadows camera={{ position: [18, 12, 18], fov: 42 }}>
                <ambientLight intensity={1.2} color="#ffffff" />
                <directionalLight position={[10, 30, 20]} intensity={2.0} color="#ffffff" castShadow shadow-mapSize={[1024, 1024]} />
                <pointLight position={[-10, 10, -10]} intensity={0.5} color="#0ea5e9" />
                <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                  <planeGeometry args={[200, 200]} />
                  <shadowMaterial opacity={0.15} />
                </mesh>
                <Grid
                  args={[100, 100]}
                  position={[0, -0.49, 0]}
                  cellSize={2}
                  cellThickness={0.5}
                  cellColor="#94a3b8"
                  sectionSize={10}
                  sectionThickness={1}
                  sectionColor="#cbd5e1"
                  fadeDistance={30}
                  fadeStrength={1.5}
                />
                <HeroWalkerDemo />
                <OrbitControls 
                  target={[-3, 6, 0]}
                  enablePan={false} 
                  enableZoom={false} 
                  minPolarAngle={Math.PI / 4} 
                  maxPolarAngle={Math.PI / 2.2} 
                  enableDamping={true} 
                  dampingFactor={0.05} 
                />
              </Canvas>
            </div>
            
            <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.6)', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: '#334155', backdropFilter: 'blur(5px)', pointerEvents: 'none', zIndex: 2 }}>
              ドラッグで視点移動
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TopPage;
