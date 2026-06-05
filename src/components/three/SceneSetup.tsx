import { PerspectiveCamera, Environment, Sky } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export const SceneSetup = () => {
  const { camera } = useThree();

  useEffect(() => {
    // 初期位置: スタート地点(X=0)を斜め後方・斜め上から見る
    // X軸が前進方向なので、後ろ(-X) + 高め(+Y) + 横(+Z)から見る
    camera.position.set(-50, 60, 90);
    camera.lookAt(50, 7.5, 0); // スタート地点付近のロボット重心を見る
  }, [camera]);

  return (
    <>
      {/* カメラ設定 */}
      <PerspectiveCamera makeDefault fov={50} near={0.1} far={2000} />

      {/* ベースとなる環境光と太陽光 */}
      <ambientLight intensity={0.6} color="#e0f2fe" />
      <directionalLight
        position={[-100, 200, -50]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={1000}
        shadow-camera-left={-200}
        shadow-camera-right={600}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-bias={-0.0001}
      />
      
      {/* 青・紫系のクリーンなトーンを強調するヘミスフィアライト */}
      <hemisphereLight args={['#bae6fd', '#e0e7ff', 0.4]} />

      {/* 美しい背景環境 */}
      <Environment preset="city" />
      <Sky distance={45000} sunPosition={[-100, 20, -50]} inclination={0} azimuth={0.25} />
      
      {/* 遠景のフォグ (フェードアウト用) */}
      <fog attach="fog" args={['#f0f9ff', 150, 800]} />
    </>
  );
};
