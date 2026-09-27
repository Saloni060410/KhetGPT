import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

// Shared biophilic materials with realistic organic reflectance
const goldenGrainMaterial = new THREE.MeshStandardMaterial({
  color: '#D49222',
  roughness: 0.45,
  metalness: 0.08,
});
const amberAwnMaterial = new THREE.MeshStandardMaterial({
  color: '#E0A838',
  roughness: 0.5,
  metalness: 0.05,
});
const stemMaterial = new THREE.MeshStandardMaterial({
  color: '#7F984E',
  roughness: 0.55,
  metalness: 0.05,
});
const lushGreenMaterial = new THREE.MeshStandardMaterial({
  color: '#2D5E2E',
  roughness: 0.5,
  metalness: 0.04,
});
const paleLeafMaterial = new THREE.MeshStandardMaterial({
  color: '#558238',
  roughness: 0.55,
  metalness: 0.04,
});
const whiteCottonMaterial = new THREE.MeshStandardMaterial({
  color: '#F8F7F2',
  roughness: 0.95,
  metalness: 0.0,
});
const cottonBractMaterial = new THREE.MeshStandardMaterial({
  color: '#284625',
  roughness: 0.6,
  metalness: 0.05,
});
const podMaterial = new THREE.MeshStandardMaterial({
  color: '#658F42',
  roughness: 0.5,
  metalness: 0.05,
});
const sugarcaneCaneMaterial = new THREE.MeshStandardMaterial({
  color: '#427433',
  roughness: 0.35,
  metalness: 0.08,
});
const sugarcaneRingMaterial = new THREE.MeshStandardMaterial({
  color: '#C68B2C',
  roughness: 0.5,
  metalness: 0.05,
});
const sugarcaneWaxMaterial = new THREE.MeshStandardMaterial({
  color: '#8CAE6E',
  roughness: 0.6,
  metalness: 0.03,
});
const maizeCobMaterial = new THREE.MeshStandardMaterial({
  color: '#ECA817',
  roughness: 0.35,
  metalness: 0.08,
});
const maizeHuskMaterial = new THREE.MeshStandardMaterial({
  color: '#5E8842',
  roughness: 0.55,
  metalness: 0.04,
});

/**
 * 1. Wheat 3D Model: Golden Earhead with Long Plumed Awns & Spikelets
 */
export function Wheat3D() {
  const spikelets = [
    { y: -0.35, rot: 0.32, s: 0.95 },
    { y: -0.15, rot: -0.32, s: 1.05 },
    { y: 0.05, rot: 0.35, s: 1.15 },
    { y: 0.25, rot: -0.35, s: 1.15 },
    { y: 0.45, rot: 0.3, s: 1.05 },
    { y: 0.62, rot: -0.25, s: 0.95 },
    { y: 0.76, rot: 0.0, s: 0.8 },
  ];

  return (
    <group position={[0, 0.4, 0]}>
      {/* Basal Stalk */}
      <mesh material={stemMaterial} position={[0, -0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.8, 12]} />
      </mesh>

      {/* Dense Alternating Plump Spikelets */}
      {spikelets.map((sp, idx) => {
        const isRight = sp.rot >= 0;
        return (
          <group key={idx} position={[isRight ? 0.09 : -0.09, sp.y, 0]} rotation={[0, 0, sp.rot]}>
            {/* Kernel Pair */}
            <mesh material={goldenGrainMaterial} position={[0.07, 0, 0]} scale={[sp.s * 1.1, sp.s, sp.s * 0.9]} castShadow>
              <sphereGeometry args={[0.15, 12, 12]} />
            </mesh>
            <mesh material={goldenGrainMaterial} position={[-0.07, 0, 0]} scale={[sp.s * 1.1, sp.s, sp.s * 0.9]} castShadow>
              <sphereGeometry args={[0.15, 12, 12]} />
            </mesh>

            {/* Long Golden Awn Beard extending upward */}
            <mesh
              material={amberAwnMaterial}
              position={[isRight ? 0.26 : -0.26, 0.38, 0]}
              rotation={[0, 0, isRight ? -0.35 : 0.35]}
              castShadow
            >
              <cylinderGeometry args={[0.012, 0.018, 0.75, 8]} />
            </mesh>
          </group>
        );
      })}

      {/* Crest Awns at apex */}
      <mesh material={amberAwnMaterial} position={[0, 0.98, 0]} castShadow>
        <cylinderGeometry args={[0.01, 0.016, 0.65, 8]} />
      </mesh>
      <mesh material={amberAwnMaterial} position={[0.08, 0.95, 0]} rotation={[0, 0, -0.15]} castShadow>
        <cylinderGeometry args={[0.01, 0.014, 0.6, 8]} />
      </mesh>
      <mesh material={amberAwnMaterial} position={[-0.08, 0.95, 0]} rotation={[0, 0, 0.15]} castShadow>
        <cylinderGeometry args={[0.01, 0.014, 0.6, 8]} />
      </mesh>
    </group>
  );
}

/**
 * 2. Barley 3D Model: Compact 6-row Earhead with Parallel Bristle Beard
 */
export function Barley3D() {
  const tiers = [-0.3, -0.12, 0.06, 0.24, 0.42, 0.58];

  return (
    <group position={[0, 0.4, 0]} rotation={[0, 0, -0.08]}>
      {/* Stem */}
      <mesh material={stemMaterial} position={[0, -0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.8, 12]} />
      </mesh>

      {/* Compact 6-row Earhead */}
      {tiers.map((y, idx) => (
        <group key={idx} position={[0, y, 0]}>
          <mesh material={goldenGrainMaterial} scale={[1.2, 0.9, 1.2]} castShadow>
            <cylinderGeometry args={[0.18, 0.19, 0.18, 10]} />
          </mesh>
          {/* Symmetrical Long Parallel Awn Bristles */}
          <mesh material={amberAwnMaterial} position={[0.22, 0.42, 0]} rotation={[0, 0, -0.14]} castShadow>
            <cylinderGeometry args={[0.01, 0.015, 0.85, 8]} />
          </mesh>
          <mesh material={amberAwnMaterial} position={[-0.22, 0.42, 0]} rotation={[0, 0, 0.14]} castShadow>
            <cylinderGeometry args={[0.01, 0.015, 0.85, 8]} />
          </mesh>
          <mesh material={amberAwnMaterial} position={[0, 0.45, 0.2]} rotation={[0.14, 0, 0]} castShadow>
            <cylinderGeometry args={[0.01, 0.014, 0.85, 8]} />
          </mesh>
        </group>
      ))}

      {/* Terminal Crown */}
      <mesh material={amberAwnMaterial} position={[0, 0.92, 0]} castShadow>
        <cylinderGeometry args={[0.01, 0.016, 0.7, 8]} />
      </mesh>
    </group>
  );
}

/**
 * 3. Rice (Paddy) 3D Model: Graceful Cascading Golden Basmati Panicle
 */
export function Rice3D() {
  const grains = [
    { pos: [0.18, 0.48, 0.08], rot: 0.45, s: 1.1 },
    { pos: [-0.18, 0.38, -0.08], rot: -0.38, s: 1.05 },
    { pos: [0.28, 0.22, 0.12], rot: 0.55, s: 1.15 },
    { pos: [-0.26, 0.08, -0.12], rot: -0.45, s: 1.1 },
    { pos: [0.34, -0.1, 0.08], rot: 0.65, s: 1.15 },
    { pos: [-0.3, -0.22, -0.08], rot: -0.55, s: 1.1 },
    { pos: [0.22, -0.38, 0.05], rot: 0.75, s: 1.0 },
    { pos: [-0.16, -0.46, -0.04], rot: -0.65, s: 0.95 },
  ];

  return (
    <group position={[-0.05, 0.45, 0]}>
      {/* Arching Central Rachis (Stem) */}
      <mesh material={stemMaterial} position={[0, -0.1, 0]} rotation={[0, 0, 0.18]} castShadow receiveShadow>
        <cylinderGeometry args={[0.035, 0.05, 1.4, 12]} />
      </mesh>

      {/* Clustered Drooping Rice Grains */}
      {grains.map((g, idx) => (
        <group key={idx} position={g.pos} rotation={[0, 0, g.rot]}>
          {/* Elongated Golden Basmati Grain */}
          <mesh material={goldenGrainMaterial} scale={[g.s * 0.9, g.s * 1.9, g.s * 0.9]} castShadow>
            <sphereGeometry args={[0.13, 12, 12]} />
          </mesh>
          {/* Delicate Grain Tip */}
          <mesh material={amberAwnMaterial} position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.008, 0.015, 0.18, 6]} />
          </mesh>
        </group>
      ))}

      {/* Top Drooping Apex */}
      <mesh material={stemMaterial} position={[0.18, 0.62, 0]} rotation={[0, 0, 0.7]} castShadow>
        <cylinderGeometry args={[0.02, 0.035, 0.45, 8]} />
      </mesh>
    </group>
  );
}

/**
 * 4. Maize 3D Model: Plump Corn Cob with Kernels, Peeling Husks & Silk Tassel
 */
export function Maize3D() {
  const huskAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];

  return (
    <group position={[0, 0.45, 0]}>
      {/* Stalk */}
      <mesh material={lushGreenMaterial} position={[0, -0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.6, 14]} />
      </mesh>

      {/* Plump Golden Corn Cob Body */}
      <mesh material={maizeCobMaterial} position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.33, 0.35, 0.95, 18]} />
      </mesh>
      {/* Rounded Cob Tip */}
      <mesh material={maizeCobMaterial} position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.33, 18, 14]} />
      </mesh>

      {/* Peeling Green Husk Leaves */}
      {huskAngles.map((angle, idx) => (
        <group key={idx} rotation={[0, angle, 0]}>
          <mesh
            material={maizeHuskMaterial}
            position={[0.32, -0.05, 0]}
            rotation={[0, 0, -0.32]}
            scale={[0.1, 1.0, 0.6]}
            castShadow
          >
            <cylinderGeometry args={[0.1, 0.36, 0.9, 10, 1, true]} />
          </mesh>
        </group>
      ))}

      {/* Golden Corn Silk Tassel Crown */}
      <mesh material={amberAwnMaterial} position={[0, 0.88, 0]} castShadow>
        <coneGeometry args={[0.16, 0.38, 12]} />
      </mesh>
    </group>
  );
}

/**
 * 5. Cotton 3D Model: Five-lobed Green Epicalyx with Soft White Puffed Cotton Bolls
 */
export function Cotton3D() {
  const sepalAngles = [0, (Math.PI * 2) / 5, (Math.PI * 4) / 5, (Math.PI * 6) / 5, (Math.PI * 8) / 5];

  return (
    <group position={[0, 0.4, 0]}>
      {/* Sturdy Wood Stem */}
      <mesh material={stemMaterial} position={[0, -0.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.9, 12]} />
      </mesh>

      {/* Five-lobed Green Epicalyx (Bracts) */}
      <mesh material={cottonBractMaterial} position={[0, -0.16, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.42, 0.36, 8]} />
      </mesh>
      {sepalAngles.map((a, i) => (
        <mesh
          key={i}
          material={cottonBractMaterial}
          position={[Math.cos(a) * 0.36, -0.05, Math.sin(a) * 0.36]}
          rotation={[0.3, a, 0]}
          castShadow
        >
          <coneGeometry args={[0.09, 0.3, 5]} />
        </mesh>
      ))}

      {/* 4 Soft Puffed Cotton Bolls */}
      <mesh material={whiteCottonMaterial} position={[0.22, 0.16, 0.22]} castShadow>
        <sphereGeometry args={[0.29, 18, 18]} />
      </mesh>
      <mesh material={whiteCottonMaterial} position={[-0.22, 0.16, 0.22]} castShadow>
        <sphereGeometry args={[0.29, 18, 18]} />
      </mesh>
      <mesh material={whiteCottonMaterial} position={[0.22, 0.16, -0.22]} castShadow>
        <sphereGeometry args={[0.29, 18, 18]} />
      </mesh>
      <mesh material={whiteCottonMaterial} position={[-0.22, 0.16, -0.22]} castShadow>
        <sphereGeometry args={[0.29, 18, 18]} />
      </mesh>
      {/* Central Crown Boll */}
      <mesh material={whiteCottonMaterial} position={[0, 0.36, 0]} castShadow>
        <sphereGeometry args={[0.28, 18, 18]} />
      </mesh>
    </group>
  );
}

/**
 * 6. Sugarcane 3D Model: Segmented Culm with Nodal Rings & Tropical Fountain Leaves
 */
export function Sugarcane3D() {
  const internodes = [
    { y: -0.45, h: 0.28, r: 0.155 },
    { y: -0.18, h: 0.28, r: 0.15 },
    { y: 0.08, h: 0.28, r: 0.145 },
    { y: 0.32, h: 0.24, r: 0.14 },
  ];

  const leafAngles = [
    0,
    Math.PI * 0.25,
    Math.PI * 0.5,
    Math.PI * 0.75,
    Math.PI,
    Math.PI * 1.25,
    Math.PI * 1.5,
    Math.PI * 1.75,
  ];

  return (
    <group position={[0, 0.45, 0]}>
      {/* Primary Stalk: Segmented Bamboo-like Culm */}
      {internodes.map((node, idx) => (
        <group key={idx} position={[0, node.y, 0]}>
          {/* Emerald Internode */}
          <mesh material={sugarcaneCaneMaterial} castShadow receiveShadow>
            <cylinderGeometry args={[node.r * 0.96, node.r, node.h, 18]} />
          </mesh>

          {/* Golden/Amber Nodal Ring */}
          <mesh material={sugarcaneRingMaterial} position={[0, node.h * 0.48, 0]} castShadow>
            <torusGeometry args={[node.r * 1.02, 0.022, 10, 24]} />
          </mesh>

          {/* Pale Wax Band */}
          <mesh material={sugarcaneWaxMaterial} position={[0, node.h * 0.36, 0]} castShadow>
            <cylinderGeometry args={[node.r * 1.01, node.r * 1.01, 0.05, 18]} />
          </mesh>

          {/* Alternating Vegetative Bud Eye */}
          <mesh
            material={sugarcaneRingMaterial}
            position={[
              idx % 2 === 0 ? node.r * 0.98 : -node.r * 0.98,
              node.h * 0.52,
              0,
            ]}
          >
            <sphereGeometry args={[0.035, 10, 10]} />
          </mesh>
        </group>
      ))}

      {/* Secondary Companion Stalk */}
      <group position={[-0.24, -0.15, 0.08]} rotation={[0, 0, 0.12]}>
        <mesh material={sugarcaneCaneMaterial} position={[0, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.095, 0.5, 14]} />
        </mesh>
        <mesh material={sugarcaneRingMaterial} position={[0, 0.08, 0]} castShadow>
          <torusGeometry args={[0.095, 0.018, 8, 16]} />
        </mesh>
        <mesh material={paleLeafMaterial} position={[0, 0.25, 0]} rotation={[0, 0, 0.35]} castShadow>
          <boxGeometry args={[0.45, 0.03, 0.08]} />
        </mesh>
      </group>

      {/* Crown Apex Stem */}
      <mesh material={paleLeafMaterial} position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.2, 14]} />
      </mesh>

      {/* Arching Leaf Fountain */}
      {leafAngles.map((angle, idx) => {
        const isOdd = idx % 2 === 1;
        const leafLength = isOdd ? 0.65 : 0.78;
        const droopAngle = isOdd ? 0.65 : 0.8;

        return (
          <group key={idx} position={[0, 0.52, 0]} rotation={[0, angle, 0]}>
            <group rotation={[droopAngle * 0.5, 0, 0]}>
              <mesh material={lushGreenMaterial} position={[0, leafLength * 0.25, leafLength * 0.1]} castShadow>
                <boxGeometry args={[0.13, leafLength * 0.45, 0.02]} />
              </mesh>
              <group position={[0, leafLength * 0.45, leafLength * 0.18]} rotation={[droopAngle * 0.75, 0, 0]}>
                <mesh material={paleLeafMaterial} position={[0, leafLength * 0.22, 0]} castShadow>
                  <boxGeometry args={[0.1, leafLength * 0.45, 0.015]} />
                </mesh>
              </group>
            </group>
          </group>
        );
      })}
    </group>
  );
}

/**
 * 7. Chickpea 3D Model: Legume Branch with Swollen Pods & Pinnate Leaflets
 */
export function Chickpea3D() {
  const pods = [
    { pos: [0.26, 0.26, 0.12], rot: 0.35, s: 1.15 },
    { pos: [-0.26, 0.14, -0.12], rot: -0.38, s: 1.15 },
    { pos: [0.28, -0.12, -0.15], rot: 0.45, s: 1.2 },
    { pos: [-0.25, -0.28, 0.12], rot: -0.4, s: 1.1 },
    { pos: [0.12, 0.46, -0.08], rot: 0.2, s: 1.05 },
  ];

  return (
    <group position={[0, 0.4, 0]}>
      {/* Central Branching Green Stem */}
      <mesh material={stemMaterial} position={[0, -0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.9, 12]} />
      </mesh>

      {/* Plump Swollen Pods */}
      {pods.map((p, idx) => (
        <group key={idx} position={p.pos} rotation={[0, 0, p.rot]}>
          <mesh material={podMaterial} scale={[p.s * 1.35, p.s * 1.05, p.s * 0.95]} castShadow>
            <sphereGeometry args={[0.18, 16, 16]} />
          </mesh>
          <mesh material={podMaterial} position={[p.s * 0.22, 0, 0]} rotation={[0, 0, -0.6]} castShadow>
            <coneGeometry args={[0.04, 0.12, 8]} />
          </mesh>
          <mesh material={stemMaterial} position={[-p.s * 0.18, 0, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.2, 6]} />
          </mesh>
        </group>
      ))}

      {/* Compound Pinnate Leaflet Clusters */}
      <mesh material={lushGreenMaterial} position={[0, 0.58, 0]} castShadow>
        <sphereGeometry args={[0.16, 12, 12]} />
      </mesh>
      <mesh material={lushGreenMaterial} position={[-0.18, 0.35, 0.1]} castShadow>
        <sphereGeometry args={[0.12, 10, 10]} />
      </mesh>
      <mesh material={lushGreenMaterial} position={[0.18, 0.05, 0.12]} castShadow>
        <sphereGeometry args={[0.13, 10, 10]} />
      </mesh>
    </group>
  );
}

/**
 * Robust Error Boundary for External GLB Models
 */
class GLBErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn('GLB load error, using botanical procedural fallback:', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Generic Normalized GLB Crop Component
 * Automatically calculates bounding box, centers at (0, 0), aligns root base to soil (y = 0),
 * and scales to realistic botanical height.
 */
function GLBCrop({ url, targetHeight = 1.0, fallback }) {
  const { scene } = useGLTF(url);

  const normalizedObject = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone(true);
    clone.updateMatrixWorld(true);

    // Enable realistic shadow casting and receiving on all child meshes
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.side = THREE.DoubleSide;
        }
      }
    });

    // Auto-calculate exact bounding box
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const scale = targetHeight / (size.y || 1);

    const wrapper = new THREE.Group();
    clone.scale.set(scale, scale, scale);
    // Center in X & Z, place lowest Y vertex precisely on soil ground at Y = 0
    clone.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    wrapper.add(clone);

    return wrapper;
  }, [scene, targetHeight]);

  if (!normalizedObject) return fallback || null;
  return <primitive object={normalizedObject} />;
}

// Preload external GLB models for zero latency
useGLTF.preload('/barley.glb?v=1');
useGLTF.preload('/chickpea.glb?v=1');
useGLTF.preload('/corn.glb?v=1');
useGLTF.preload('/cotton.glb?v=1');
useGLTF.preload('/rice.glb?v=1');
useGLTF.preload('/sugarcane.glb?v=1');
useGLTF.preload('/wheat.glb?v=1');

/**
 * Model Components with Procedural Suspense & Error Fallbacks
 */
export function WheatModel() {
  return (
    <GLBErrorBoundary fallback={<Wheat3D />}>
      <React.Suspense fallback={<Wheat3D />}>
        <GLBCrop url="/wheat.glb?v=1" targetHeight={1.0} fallback={<Wheat3D />} />
      </React.Suspense>
    </GLBErrorBoundary>
  );
}

export function BarleyModel() {
  return (
    <GLBErrorBoundary fallback={<Barley3D />}>
      <React.Suspense fallback={<Barley3D />}>
        <GLBCrop url="/barley.glb?v=1" targetHeight={1.05} fallback={<Barley3D />} />
      </React.Suspense>
    </GLBErrorBoundary>
  );
}

export function RiceModel() {
  return (
    <GLBErrorBoundary fallback={<Rice3D />}>
      <React.Suspense fallback={<Rice3D />}>
        <GLBCrop url="/rice.glb?v=1" targetHeight={0.92} fallback={<Rice3D />} />
      </React.Suspense>
    </GLBErrorBoundary>
  );
}

export function SugarcaneModel() {
  return (
    <GLBErrorBoundary fallback={<Sugarcane3D />}>
      <React.Suspense fallback={<Sugarcane3D />}>
        <GLBCrop url="/sugarcane.glb?v=1" targetHeight={1.65} fallback={<Sugarcane3D />} />
      </React.Suspense>
    </GLBErrorBoundary>
  );
}

export function MaizeModel() {
  return (
    <GLBErrorBoundary fallback={<Maize3D />}>
      <React.Suspense fallback={<Maize3D />}>
        <GLBCrop url="/corn.glb?v=1" targetHeight={1.4} fallback={<Maize3D />} />
      </React.Suspense>
    </GLBErrorBoundary>
  );
}

export function CottonModel() {
  return (
    <GLBErrorBoundary fallback={<Cotton3D />}>
      <React.Suspense fallback={<Cotton3D />}>
        <GLBCrop url="/cotton.glb?v=1" targetHeight={0.95} fallback={<Cotton3D />} />
      </React.Suspense>
    </GLBErrorBoundary>
  );
}

export function ChickpeaModel() {
  return (
    <GLBErrorBoundary fallback={<Chickpea3D />}>
      <React.Suspense fallback={<Chickpea3D />}>
        <GLBCrop url="/chickpea.glb?v=1" targetHeight={0.92} fallback={<Chickpea3D />} />
      </React.Suspense>
    </GLBErrorBoundary>
  );
}

/**
 * Universal Crop 3D Renderer Dispatcher
 * Dispatches realistic GLB models for all 7 crops:
 * wheat, barley, rice, maize/corn, cotton, sugarcane, and chickpea.
 */
export default function CropMesh({ cropId }) {
  switch (cropId) {
    case 'wheat':
      return <WheatModel />;
    case 'barley':
      return <BarleyModel />;
    case 'rice':
      return <RiceModel />;
    case 'maize':
      return <MaizeModel />;
    case 'cotton':
      return <CottonModel />;
    case 'sugarcane':
      return <SugarcaneModel />;
    case 'chickpea':
      return <ChickpeaModel />;
    default:
      return <WheatModel />;
  }
}
