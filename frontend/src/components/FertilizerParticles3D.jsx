import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 3D Nutrient Particle Stream Simulation
 * Simulates real-time physical delivery of Nitrogen (Urea), Phosphorus (DAP),
 * Potassium (MOP), and Organic Vermicompost into the crop and root strata.
 */
export default function FertilizerParticles3D({
  position = [0, 0, 0],
  activeType = null, // 'urea' | 'dap' | 'mop' | 'vermicompost' | null
  count = 90,
}) {
  const pointsRef = useRef();

  // Particle color palette by nutrient
  const nutrientColors = {
    urea: '#38bdf8', // Azure Sky (Nitrogen bio-spray)
    dap: '#f59e0b',  // Amber Gold (Phosphorus root placement)
    mop: '#a855f7',  // Violet Cation (Potassium)
    vermicompost: '#10b981', // Radiant Emerald (Microbiome bio-inoculant)
    all: '#34d399',
  };

  const currentColor = nutrientColors[activeType] || '#38bdf8';

  // Generate particle positions, velocities, and lifetimes
  const { positions, velocities, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const ph = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spawn in a fountain / cloud cylinder above and around crop (radius 0.45, height 0.2 to 1.6)
      const radius = 0.15 + Math.random() * 0.4;
      const angle = Math.random() * Math.PI * 2;
      pos[i3] = Math.cos(angle) * radius;
      pos[i3 + 1] = 0.2 + Math.random() * 1.5;
      pos[i3 + 2] = Math.sin(angle) * radius;

      // Downward / spiral velocity
      vel[i3] = (Math.random() - 0.5) * 0.25;
      vel[i3 + 1] = -(0.4 + Math.random() * 0.6); // Falling downward
      vel[i3 + 2] = (Math.random() - 0.5) * 0.25;

      ph[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, velocities: vel, phases: ph };
  }, [count]);

  // Animate particle flow
  useFrame(({ clock }) => {
    if (!pointsRef.current || !activeType) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const posArray = posAttr.array;
    const t = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spiral swirling motion while descending
      posArray[i3] += Math.sin(t * 3.5 + phases[i]) * 0.008 + velocities[i3] * 0.016;
      posArray[i3 + 1] += velocities[i3 + 1] * 0.016;
      posArray[i3 + 2] += Math.cos(t * 3.5 + phases[i]) * 0.008 + velocities[i3 + 2] * 0.016;

      // Reset when particle reaches soil surface (Y <= 0)
      if (posArray[i3 + 1] < 0.05) {
        const radius = 0.12 + Math.random() * 0.45;
        const angle = Math.random() * Math.PI * 2;
        posArray[i3] = Math.cos(angle) * radius;
        posArray[i3 + 1] = 1.3 + Math.random() * 0.5;
        posArray[i3 + 2] = Math.sin(angle) * radius;
      }
    }

    posAttr.needsUpdate = true;
  });

  if (!activeType) return null;

  return (
    <group position={position}>
      {/* 1. Falling Nutrient Particle Mist */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          color={currentColor}
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* 2. Expanding Soil Nutrient Infiltration Pulse Ring */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.65, 32]} />
        <meshBasicMaterial
          color={currentColor}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. Nutrient Delivery Point Light */}
      <pointLight
        position={[0, 0.8, 0]}
        color={currentColor}
        intensity={2.8}
        distance={3.2}
        decay={1.5}
      />
    </group>
  );
}
