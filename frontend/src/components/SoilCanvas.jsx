import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Procedural Soil Stratum Block with dynamic degradation/recovery shading
function SoilBlock({ recoveryProgress }) {
  const meshRef = useRef();

  // Dynamic soil color interpolation:
  // Degraded: Pale dusty grey-brown / chalky alkali (#5A524A / #6E6357)
  // Healthy: Deep rich black loam / humic chocolate (#1F1914 / #2A1F18)
  const soilColor = useMemo(() => {
    const degradedColor = new THREE.Color('#5E564F');
    const healthyColor = new THREE.Color('#221B14');
    return degradedColor.lerp(healthyColor, recoveryProgress);
  }, [recoveryProgress]);

  const topSoilColor = useMemo(() => {
    const degradedTop = new THREE.Color('#786E5E');
    const healthyTop = new THREE.Color('#2E3B28'); // Organic humus with subtle green bio-film
    return degradedTop.lerp(healthyTop, recoveryProgress);
  }, [recoveryProgress]);

  // Gentle idle rotation / breathing
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <group ref={meshRef} position={[0, -0.6, 0]}>
      {/* Main Soil Stratum Cube (Cutaway profile) */}
      <mesh receiveShadow castShadow position={[0, 0, 0]}>
        <boxGeometry args={[3.2, 2.2, 3.2]} />
        <meshStandardMaterial 
          color={soilColor} 
          roughness={0.92} 
          metalness={0.05} 
        />
      </mesh>

      {/* Topsoil / Humic Surface Layer */}
      <mesh receiveShadow castShadow position={[0, 1.11, 0]}>
        <boxGeometry args={[3.22, 0.06, 3.22]} />
        <meshStandardMaterial 
          color={topSoilColor} 
          roughness={0.85} 
          metalness={0.02} 
        />
      </mesh>

      {/* Stratification Horizon Lines (Visualizing soil horizons A, B, C) */}
      <mesh position={[0, 0.4, 1.615]}>
        <planeGeometry args={[3.15, 0.03]} />
        <meshBasicMaterial color="#3E342B" opacity={0.6} transparent />
      </mesh>
      <mesh position={[0, -0.3, 1.615]}>
        <planeGeometry args={[3.15, 0.04]} />
        <meshBasicMaterial color="#2B231D" opacity={0.7} transparent />
      </mesh>

      {/* Soil moisture gradient rim (glows cyan when moist) */}
      <mesh position={[0, 1.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.6, 32]} />
        <meshBasicMaterial 
          color={recoveryProgress > 0.5 ? '#10B981' : '#F59E0B'} 
          opacity={0.3 + recoveryProgress * 0.4} 
          transparent 
        />
      </mesh>
    </group>
  );
}

// Procedural Plant & Root System reacting to recovery
function CropAndRoots({ recoveryProgress }) {
  const rootGroupRef = useRef();
  const plantGroupRef = useRef();

  useFrame((state, delta) => {
    if (plantGroupRef.current) {
      // Gentle wind breeze
      plantGroupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.04;
      plantGroupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 1.2) * 0.03;
    }
  });

  // Calculate plant scale based on health (0.4 to 1.1)
  const plantScale = 0.4 + recoveryProgress * 0.7;
  const leafColor = useMemo(() => {
    const yellowed = new THREE.Color('#A39E5C'); // Chlorosis / chemical burn
    const lush = new THREE.Color('#10B981'); // Vibrant rich emerald
    return yellowed.lerp(lush, recoveryProgress);
  }, [recoveryProgress]);

  return (
    <group position={[0, 0.5, 0]}>
      {/* Above-ground Crop Stem & Foliage */}
      <group ref={plantGroupRef} scale={[plantScale, plantScale, plantScale]} position={[0, 0.05, 0]}>
        {/* Main Stem */}
        <mesh castShadow position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.04, 0.07, 1.2, 8]} />
          <meshStandardMaterial color={leafColor} roughness={0.6} />
        </mesh>

        {/* Leaves */}
        {[-0.6, 0.6, 0].map((angle, idx) => (
          <group key={idx} position={[0, 0.4 + idx * 0.35, 0]} rotation={[0.4, angle, 0.3 * (idx % 2 === 0 ? 1 : -1)]}>
            <mesh castShadow position={[0.4, 0.1, 0]} rotation={[0, 0, -0.4]}>
              <coneGeometry args={[0.22, 0.9, 5]} />
              <meshStandardMaterial color={leafColor} roughness={0.5} />
            </mesh>
          </group>
        ))}

        {/* Top Healthy Shoot / Bud */}
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={leafColor} roughness={0.4} />
        </mesh>
      </group>

      {/* Subsurface Root System */}
      <group ref={rootGroupRef} position={[0, -0.1, 0]}>
        {/* Primary Taproot */}
        <mesh position={[0, -0.5 * plantScale, 0]}>
          <cylinderGeometry args={[0.03, 0.01, 1.0 * plantScale, 6]} />
          <meshStandardMaterial color="#D7CFBE" roughness={0.8} />
        </mesh>
        
        {/* Lateral root branches (branching outwards more vigorously as recovery increases) */}
        {[
          { pos: [0.25, -0.3, 0.2], rot: [0.3, 0.8, -0.8], len: 0.7 },
          { pos: [-0.3, -0.5, -0.15], rot: [-0.4, -0.7, 0.9], len: 0.8 },
          { pos: [0.15, -0.7, -0.25], rot: [0.6, -0.5, -0.7], len: 0.6 },
          { pos: [-0.2, -0.8, 0.2], rot: [-0.5, 0.4, 0.8], len: 0.75 },
        ].map((branch, i) => (
          <mesh 
            key={i} 
            position={branch.pos.map(v => v * plantScale)} 
            rotation={branch.rot}
            scale={[1, plantScale, 1]}
          >
            <cylinderGeometry args={[0.018, 0.005, branch.len, 5]} />
            <meshStandardMaterial color="#E8E2D5" roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Subsurface Bio-Active Nutrient Particles (N-P-K Ion Swarm)
function NutrientNodes({ recoveryProgress }) {
  const pointsRef = useRef();
  const particleCount = 140;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    const cNitrogen = new THREE.Color('#00F59B'); // Bioluminescent Emerald N
    const cPhosphorus = new THREE.Color('#F59E0B'); // Warm Ochre P
    const cPotassium = new THREE.Color('#06B6D4'); // Bio-Cyan K
    const cToxic = new THREE.Color('#EF4444'); // Red/Saline stress

    for (let i = 0; i < particleCount; i++) {
      // Clustered under the soil within bounds
      pos[i * 3 + 0] = (Math.random() - 0.5) * 2.6;
      pos[i * 3 + 1] = -0.1 - Math.random() * 1.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.6;

      const randType = Math.random();
      let chosenCol;
      if (randType < 0.45) chosenCol = cNitrogen;
      else if (randType < 0.75) chosenCol = cPhosphorus;
      else chosenCol = cPotassium;

      col[i * 3 + 0] = chosenCol.r;
      col[i * 3 + 1] = chosenCol.g;
      col[i * 3 + 2] = chosenCol.b;
    }

    return [pos, col];
  }, [particleCount]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.06;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        vertexColors
        transparent
        opacity={0.35 + recoveryProgress * 0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function SoilCanvas({ recoveryProgress = 0.72 }) {
  // Environmental lighting reacts to degradation:
  // Low recovery = murky overcast gloom
  // High recovery = crisp warm sunlight with lush ambient fill
  const sunIntensity = 1.0 + recoveryProgress * 1.8;
  const sunColor = recoveryProgress > 0.5 ? '#FFF7ED' : '#E2E8F0';

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        camera={{ position: [3.8, 2.4, 4.2], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4 + recoveryProgress * 0.5} />
        
        {/* Directional Sunlight */}
        <directionalLight
          position={[5, 8, 4]}
          intensity={sunIntensity}
          color={sunColor}
          castShadow
          shadow-mapSize={1024}
        />
        
        {/* Soft Subsurface Fill Light (Bio-glow) */}
        <pointLight 
          position={[0, -0.8, 0]} 
          intensity={0.8 + recoveryProgress * 1.5} 
          color={recoveryProgress > 0.4 ? '#00F59B' : '#F59E0B'} 
          distance={4}
        />

        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.2}>
          <group position={[0, -0.2, 0]}>
            <SoilBlock recoveryProgress={recoveryProgress} />
            <CropAndRoots recoveryProgress={recoveryProgress} />
            <NutrientNodes recoveryProgress={recoveryProgress} />
          </group>
        </Float>

        <ContactShadows
          position={[0, -1.8, 0]}
          opacity={0.65}
          scale={7}
          blur={2.4}
          far={4}
          color="#040709"
        />

        <OrbitControls
          enableZoom={true}
          minDistance={3.2}
          maxDistance={7.5}
          maxPolarAngle={Math.PI / 2 + 0.15}
          minPolarAngle={Math.PI / 6}
          enablePan={false}
          autoRotate={false}
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Floating 3D Viewport Controls & HUD Overlay Badges */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col space-y-1.5">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-forest-950/80 backdrop-blur-md border border-forest-700/60 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-bright animate-beacon" />
          <span className="text-[11px] font-mono font-medium text-emerald-bright tracking-wider uppercase">
            Live Rhizosphere Simulation
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 pl-1">
          Stratum depth: <span className="text-white">0–120 cm</span> • Core pH: <span className="text-white">6.4</span>
        </div>
      </div>

      {/* Viewport Interactive Guide Hint */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <div className="px-3 py-1.5 rounded-lg bg-forest-950/70 backdrop-blur-md border border-forest-800 text-[10px] font-mono text-slate-400 flex items-center space-x-1.5">
          <span>⤹ Drag to orbit 3D core</span>
          <span>•</span>
          <span>Scroll to zoom</span>
        </div>
      </div>

      {/* Dynamic Strata Key (Micro HUD bottom-left) */}
      <div className="absolute bottom-4 left-4 pointer-events-none hidden sm:flex items-center space-x-3 px-3 py-1.5 rounded-lg bg-forest-950/70 backdrop-blur-md border border-forest-800/80 text-[10px] font-mono">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-bright" />
          <span className="text-slate-300">N (Nitrogen)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-slate-300">P (Phosphorus)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-slate-300">K (Potassium)</span>
        </div>
      </div>
    </div>
  );
}
