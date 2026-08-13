import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BoxGeometry, EdgesGeometry, type Group } from "three";

function RotatingCube() {
  const groupRef = useRef<Group | null>(null);

  // Pre-generate box geometry & edges geometry
  const [boxGeo, edgesGeo] = useMemo(() => {
    const box = new BoxGeometry(1.6, 1.6, 1.6);
    const edges = new EdgesGeometry(box);
    return [box, edges];
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += delta * 0.35;
      groupRef.current.rotation.y += delta * 0.45;
      groupRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 1.5) * 0.06;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Subtle translucent core */}
      <mesh geometry={boxGeo}>
        <meshStandardMaterial
          color="#999999"
          metalness={0.6}
          opacity={0.12}
          roughness={0.2}
          transparent
        />
      </mesh>

      {/* Crisp wireframe lines */}
      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial
          color="#888888"
          linewidth={1.5}
          opacity={0.85}
          transparent
        />
      </lineSegments>
    </group>
  );
}

export function HeroCube3D({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 42 }}
        className="pointer-events-none size-full"
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={1.8} />
        <directionalLight intensity={2.5} position={[6, 6, 6]} />
        <directionalLight intensity={1} position={[-6, -4, -3]} />
        <RotatingCube />
      </Canvas>
    </div>
  );
}
