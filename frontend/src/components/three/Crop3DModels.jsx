import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Shared warm organic materials with natural biophilic reflectance
const goldenGrainMaterial = new THREE.MeshStandardMaterial({
  color: '#D49222',
  roughness: 0.4,
  metalness: 0.08,
});
const amberAwnMaterial = new THREE.MeshStandardMaterial({
  color: '#E0A838',
  roughness: 0.5,
  metalness: 0.05,
});
const stemMaterial = new THREE.MeshStandardMaterial({
  color: '#7F984E',
  roughness: 0.5,
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
 * 1. Wheat 3D Model (Zoomed-in Hero Golden Earhead with Long Plumed Awns)
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
    <group position={[0, -0.05, 0]}>
      {/* Basal Stalk */}
      <mesh material={stemMaterial} position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.8, 12]} />
      </mesh>

      {/* Dense Alternating Plump Spikelets */}
      {spikelets.map((sp, idx) => {
        const isRight = sp.rot >= 0;
        return (
          <group key={idx} position={[isRight ? 0.09 : -0.09, sp.y, 0]} rotation={[0, 0, sp.rot]}>
            {/* Kernel Pair */}
            <mesh material={goldenGrainMaterial} position={[0.07, 0, 0]} scale={[sp.s * 1.1, sp.s, sp.s * 0.9]}>
              <sphereGeometry args={[0.15, 12, 12]} />
            </mesh>
            <mesh material={goldenGrainMaterial} position={[-0.07, 0, 0]} scale={[sp.s * 1.1, sp.s, sp.s * 0.9]}>
              <sphereGeometry args={[0.15, 12, 12]} />
            </mesh>

            {/* Long Golden Awn Beard extending upward */}
            <mesh
              material={amberAwnMaterial}
              position={[isRight ? 0.26 : -0.26, 0.38, 0]}
              rotation={[0, 0, isRight ? -0.35 : 0.35]}
            >
              <cylinderGeometry args={[0.012, 0.018, 0.75, 8]} />
            </mesh>
          </group>
        );
      })}

      {/* Crest Awns at apex */}
      <mesh material={amberAwnMaterial} position={[0, 0.98, 0]}>
        <cylinderGeometry args={[0.01, 0.016, 0.65, 8]} />
      </mesh>
      <mesh material={amberAwnMaterial} position={[0.08, 0.95, 0]} rotation={[0, 0, -0.15]}>
        <cylinderGeometry args={[0.01, 0.014, 0.6, 8]} />
      </mesh>
      <mesh material={amberAwnMaterial} position={[-0.08, 0.95, 0]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.01, 0.014, 0.6, 8]} />
      </mesh>
    </group>
  );
}

/**
 * 2. Barley 3D Model (Zoomed-in Arched Earhead with Parallel Bristle Beard)
 */
export function Barley3D() {
  const tiers = [-0.3, -0.12, 0.06, 0.24, 0.42, 0.58];

  return (
    <group position={[0, 0.0, 0]} rotation={[0, 0, -0.08]}>
      {/* Stem */}
      <mesh material={stemMaterial} position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.8, 12]} />
      </mesh>

      {/* Compact 6-row Earhead */}
      {tiers.map((y, idx) => (
        <group key={idx} position={[0, y, 0]}>
          <mesh material={goldenGrainMaterial} scale={[1.2, 0.9, 1.2]}>
            <cylinderGeometry args={[0.18, 0.19, 0.18, 10]} />
          </mesh>
          {/* Symmetrical Long Parallel Awn Bristles */}
          <mesh material={amberAwnMaterial} position={[0.22, 0.42, 0]} rotation={[0, 0, -0.14]}>
            <cylinderGeometry args={[0.01, 0.015, 0.85, 8]} />
          </mesh>
          <mesh material={amberAwnMaterial} position={[-0.22, 0.42, 0]} rotation={[0, 0, 0.14]}>
            <cylinderGeometry args={[0.01, 0.015, 0.85, 8]} />
          </mesh>
          <mesh material={amberAwnMaterial} position={[0, 0.45, 0.2]} rotation={[0.14, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.014, 0.85, 8]} />
          </mesh>
        </group>
      ))}

      {/* Terminal Crown */}
      <mesh material={amberAwnMaterial} position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.01, 0.016, 0.7, 8]} />
      </mesh>
    </group>
  );
}

/**
 * 3. Rice (Paddy) 3D Model (Zoomed-in Graceful Cascading Golden Panicle)
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
    <group position={[-0.05, 0.05, 0]}>
      {/* Arching Central Rachis (Stem) */}
      <mesh material={stemMaterial} position={[0, -0.1, 0]} rotation={[0, 0, 0.18]}>
        <cylinderGeometry args={[0.035, 0.05, 1.4, 12]} />
      </mesh>

      {/* Clustered Drooping Rice Grains */}
      {grains.map((g, idx) => (
        <group key={idx} position={g.pos} rotation={[0, 0, g.rot]}>
          {/* Elongated Golden Basmati Grain */}
          <mesh material={goldenGrainMaterial} scale={[g.s * 0.9, g.s * 1.9, g.s * 0.9]}>
            <sphereGeometry args={[0.13, 12, 12]} />
          </mesh>
          {/* Delicate Grain Tip */}
          <mesh material={amberAwnMaterial} position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.008, 0.015, 0.18, 6]} />
          </mesh>
        </group>
      ))}

      {/* Top Drooping Apex */}
      <mesh material={stemMaterial} position={[0.18, 0.62, 0]} rotation={[0, 0, 0.7]}>
        <cylinderGeometry args={[0.02, 0.035, 0.45, 8]} />
      </mesh>
    </group>
  );
}

/**
 * 4. Maize 3D Model (Zoomed-in Hero Corn Cob with Kernels & Peeling Husks)
 */
export function Maize3D() {
  const huskAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];

  return (
    <group position={[0, 0.0, 0]}>
      {/* Stalk */}
      <mesh material={lushGreenMaterial} position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.6, 14]} />
      </mesh>

      {/* Plump Golden Corn Cob Body */}
      <mesh material={maizeCobMaterial} position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.33, 0.35, 0.95, 18]} />
      </mesh>
      {/* Rounded Cob Tip */}
      <mesh material={maizeCobMaterial} position={[0, 0.6, 0]}>
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
          >
            <cylinderGeometry args={[0.1, 0.36, 0.9, 10, 1, true]} />
          </mesh>
        </group>
      ))}

      {/* Golden Corn Silk Tassel Crown */}
      <mesh material={amberAwnMaterial} position={[0, 0.88, 0]}>
        <coneGeometry args={[0.16, 0.38, 12]} />
      </mesh>
    </group>
  );
}

/**
 * 5. Cotton 3D Model (The user's favorite zoomed-in reference in Image 2)
 */
export function Cotton3D() {
  const sepalAngles = [0, (Math.PI * 2) / 5, (Math.PI * 4) / 5, (Math.PI * 6) / 5, (Math.PI * 8) / 5];

  return (
    <group position={[0, 0.02, 0]}>
      {/* Sturdy Wood Stem */}
      <mesh material={stemMaterial} position={[0, -0.65, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 0.9, 12]} />
      </mesh>

      {/* Five-lobed Green Epicalyx (Bracts) */}
      <mesh material={cottonBractMaterial} position={[0, -0.16, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.42, 0.36, 8]} />
      </mesh>
      {sepalAngles.map((a, i) => (
        <mesh
          key={i}
          material={cottonBractMaterial}
          position={[Math.cos(a) * 0.36, -0.05, Math.sin(a) * 0.36]}
          rotation={[0.3, a, 0]}
        >
          <coneGeometry args={[0.09, 0.3, 5]} />
        </mesh>
      ))}

      {/* 4 Soft Puffed Cotton Bolls */}
      <mesh material={whiteCottonMaterial} position={[0.22, 0.16, 0.22]}>
        <sphereGeometry args={[0.29, 18, 18]} />
      </mesh>
      <mesh material={whiteCottonMaterial} position={[-0.22, 0.16, 0.22]}>
        <sphereGeometry args={[0.29, 18, 18]} />
      </mesh>
      <mesh material={whiteCottonMaterial} position={[0.22, 0.16, -0.22]}>
        <sphereGeometry args={[0.29, 18, 18]} />
      </mesh>
      <mesh material={whiteCottonMaterial} position={[-0.22, 0.16, -0.22]}>
        <sphereGeometry args={[0.29, 18, 18]} />
      </mesh>
      {/* Central Crown Boll */}
      <mesh material={whiteCottonMaterial} position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.28, 18, 18]} />
      </mesh>
    </group>
  );
}

/**
 * 6. Sugarcane 3D Model (FIXED: Lush Punjab Sugarcane Stool with Arching Fountain Leaves)
 * Solves Image 1: No longer an infinite cut-off pipe!
 * Perfectly framed with segmented culm, growth rings, bud eyes, and arching leaf fountain!
 */
export function Sugarcane3D() {
  // Internode heights centered nicely from -0.55 to 0.3
  const internodes = [
    { y: -0.45, h: 0.28, r: 0.155 },
    { y: -0.18, h: 0.28, r: 0.15 },
    { y: 0.08, h: 0.28, r: 0.145 },
    { y: 0.32, h: 0.24, r: 0.14 },
  ];

  // 8 Arching blade leaves forming a majestic tropical crown
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
    <group position={[0, 0.0, 0]}>
      {/* Primary Stalk: Segmented Bamboo-like Culm */}
      {internodes.map((node, idx) => (
        <group key={idx} position={[0, node.y, 0]}>
          {/* Juicy Emerald Internode */}
          <mesh material={sugarcaneCaneMaterial}>
            <cylinderGeometry args={[node.r * 0.96, node.r, node.h, 18]} />
          </mesh>

          {/* Golden/Amber Nodal Ring */}
          <mesh material={sugarcaneRingMaterial} position={[0, node.h * 0.48, 0]}>
            <torusGeometry args={[node.r * 1.02, 0.022, 10, 24]} />
          </mesh>

          {/* Pale Wax Band beneath the node */}
          <mesh material={sugarcaneWaxMaterial} position={[0, node.h * 0.36, 0]}>
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

      {/* Secondary Companion Stalk (Adds natural stool volume like in field) */}
      <group position={[-0.24, -0.15, 0.08]} rotation={[0, 0, 0.12]}>
        <mesh material={sugarcaneCaneMaterial} position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.09, 0.095, 0.5, 14]} />
        </mesh>
        <mesh material={sugarcaneRingMaterial} position={[0, 0.08, 0]}>
          <torusGeometry args={[0.095, 0.018, 8, 16]} />
        </mesh>
        <mesh material={paleLeafMaterial} position={[0, 0.25, 0]} rotation={[0, 0, 0.35]}>
          <boxGeometry args={[0.45, 0.03, 0.08]} />
        </mesh>
      </group>

      {/* Crown Apex Stem */}
      <mesh material={paleLeafMaterial} position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.2, 14]} />
      </mesh>

      {/* Majestic Leaf Fountain (Curving outward and downward, staying safely inside frame) */}
      {leafAngles.map((angle, idx) => {
        const isOdd = idx % 2 === 1;
        const leafLength = isOdd ? 0.65 : 0.78;
        const droopAngle = isOdd ? 0.65 : 0.8;

        return (
          <group key={idx} position={[0, 0.52, 0]} rotation={[0, angle, 0]}>
            {/* Proximal ascending leaf sheath */}
            <group rotation={[droopAngle * 0.5, 0, 0]}>
              <mesh material={lushGreenMaterial} position={[0, leafLength * 0.25, leafLength * 0.1]}>
                <boxGeometry args={[0.13, leafLength * 0.45, 0.02]} />
              </mesh>
              {/* Distal gracefully arching blade tip */}
              <group position={[0, leafLength * 0.45, leafLength * 0.18]} rotation={[droopAngle * 0.75, 0, 0]}>
                <mesh material={paleLeafMaterial} position={[0, leafLength * 0.22, 0]}>
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
 * 7. Chickpea 3D Model (Zoomed-in Legume Branch with Plump Swollen Pods)
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
    <group position={[0, 0.05, 0]}>
      {/* Central Branching Green Stem */}
      <mesh material={stemMaterial} position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.9, 12]} />
      </mesh>

      {/* Plump Swollen Pods with Beaked Tips */}
      {pods.map((p, idx) => (
        <group key={idx} position={p.pos} rotation={[0, 0, p.rot]}>
          {/* Swollen Pod Body */}
          <mesh material={podMaterial} scale={[p.s * 1.35, p.s * 1.05, p.s * 0.95]}>
            <sphereGeometry args={[0.18, 16, 16]} />
          </mesh>
          {/* Beaked Pod Tip */}
          <mesh material={podMaterial} position={[p.s * 0.22, 0, 0]} rotation={[0, 0, -0.6]}>
            <coneGeometry args={[0.04, 0.12, 8]} />
          </mesh>
          {/* Pedicel Attachment */}
          <mesh material={stemMaterial} position={[-p.s * 0.18, 0, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.2, 6]} />
          </mesh>
        </group>
      ))}

      {/* Compound Pinnate Leaflet Clusters */}
      <mesh material={lushGreenMaterial} position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.16, 12, 12]} />
      </mesh>
      <mesh material={lushGreenMaterial} position={[-0.18, 0.35, 0.1]}>
        <sphereGeometry args={[0.12, 10, 10]} />
      </mesh>
      <mesh material={lushGreenMaterial} position={[0.18, 0.05, 0.12]}>
        <sphereGeometry args={[0.13, 10, 10]} />
      </mesh>
    </group>
  );
}

/**
 * Main Dynamic Switcher Component
 * Includes smooth floating hover and gentle idle turntable rotation
 */
export default function Crop3DModel({ cropId = 'wheat' }) {
  const groupRef = useRef(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    // Gentle floating motion
    groupRef.current.position.y = Math.sin(t * 1.6) * 0.04;
    // Turntable idle yaw rotation
    groupRef.current.rotation.y += 0.007;
  });

  return (
    <group ref={groupRef}>
      {cropId === 'wheat' && <Wheat3D />}
      {cropId === 'barley' && <Barley3D />}
      {cropId === 'rice' && <Rice3D />}
      {cropId === 'maize' && <Maize3D />}
      {cropId === 'cotton' && <Cotton3D />}
      {cropId === 'sugarcane' && <Sugarcane3D />}
      {cropId === 'chickpea' && <Chickpea3D />}
    </group>
  );
}
