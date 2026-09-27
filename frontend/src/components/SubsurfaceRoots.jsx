import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * SubsurfaceRoots: High-Performance Educational Root Network
 * - Merges all root tubes into a SINGLE draw call using mergeGeometries.
 * - Renders all nutrient pulses in a SINGLE InstancedMesh draw call.
 * - Extreme 60+ FPS efficiency with zero per-frame React re-renders or GC overhead.
 */
export default function SubsurfaceRoots({ stage = 1, intensity = 1.0 }) {
  const rootMaterialRef = useRef();
  const instancedMeshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Procedural biological root spline curves & unified geometry
  const { mergedRootGeometry, pulsePaths, nutrientBeads } = useMemo(() => {
    const systems = [
      {
        origin: [-0.8, 0, 2.27],
        mainWaypoints: [
          [-0.8, 0, 2.27],
          [-0.78, -0.3, 2.272],
          [-0.85, -0.65, 2.27],
          [-0.8, -1.0, 2.268],
          [-0.83, -1.3, 2.27],
        ],
        branches: [
          [[-0.78, -0.3, 2.272], [-0.55, -0.5, 2.27], [-0.4, -0.75, 2.268]],
          [[-0.78, -0.35, 2.272], [-1.05, -0.55, 2.27], [-1.25, -0.8, 2.268]],
          [[-0.85, -0.65, 2.27], [-0.62, -0.9, 2.27], [-0.5, -1.15, 2.268]],
          [[-0.8, -0.75, 2.27], [-1.0, -1.0, 2.27], [-1.15, -1.25, 2.268]],
        ],
      },
      {
        origin: [0.4, 0, 2.27],
        mainWaypoints: [
          [0.4, 0, 2.27],
          [0.42, -0.35, 2.272],
          [0.37, -0.7, 2.27],
          [0.43, -1.05, 2.268],
          [0.39, -1.35, 2.27],
        ],
        branches: [
          [[0.42, -0.35, 2.272], [0.65, -0.55, 2.27], [0.8, -0.85, 2.268]],
          [[0.42, -0.4, 2.272], [0.15, -0.65, 2.27], [-0.05, -0.9, 2.268]],
          [[0.37, -0.7, 2.27], [0.6, -0.95, 2.27], [0.75, -1.2, 2.268]],
          [[0.37, -0.75, 2.27], [0.18, -1.05, 2.27], [0.05, -1.28, 2.268]],
        ],
      },
      {
        origin: [1.5, 0, 2.27],
        mainWaypoints: [
          [1.5, 0, 2.27],
          [1.52, -0.3, 2.272],
          [1.46, -0.6, 2.27],
          [1.53, -0.95, 2.268],
          [1.48, -1.25, 2.27],
        ],
        branches: [
          [[1.52, -0.3, 2.272], [1.75, -0.5, 2.27], [1.95, -0.75, 2.268]],
          [[1.52, -0.35, 2.272], [1.25, -0.58, 2.27], [1.05, -0.82, 2.268]],
          [[1.46, -0.6, 2.27], [1.7, -0.85, 2.27], [1.88, -1.1, 2.268]],
          [[1.46, -0.68, 2.27], [1.28, -0.95, 2.27], [1.18, -1.2, 2.268]],
        ],
      },
    ];

    const tubeGeometries = [];
    const paths = [];

    systems.forEach((sys) => {
      // Primary Taproot
      const mainPoints = sys.mainWaypoints.map((p) => new THREE.Vector3(...p));
      const mainCurve = new THREE.CatmullRomCurve3(mainPoints);
      tubeGeometries.push(new THREE.TubeGeometry(mainCurve, 24, 0.02, 6, false));
      paths.push({ curve: mainCurve, count: 4 });

      // Secondary lateral roots
      sys.branches.forEach((b) => {
        const bPoints = b.map((p) => new THREE.Vector3(...p));
        const bCurve = new THREE.CatmullRomCurve3(bPoints);
        tubeGeometries.push(new THREE.TubeGeometry(bCurve, 14, 0.012, 5, false));
        paths.push({ curve: bCurve, count: 2 });
      });
    });

    // Merge into 1 single root geometry
    const mergedGeo = mergeGeometries(tubeGeometries, false);

    // Dispose temporary unmerged geometries
    tubeGeometries.forEach((g) => g.dispose());

    // Nutrient pulse bead definitions
    const palette = [
      new THREE.Color('#10b981'), // Nitrogen (Emerald)
      new THREE.Color('#34d399'), // Light Nitrogen
      new THREE.Color('#f59e0b'), // Phosphorus (Amber)
      new THREE.Color('#fbbf24'), // Bright Phosphorus
      new THREE.Color('#06b6d4'), // Potassium (Cyan)
      new THREE.Color('#38bdf8'), // Electric Potassium
    ];

    const beads = [];
    let id = 0;

    paths.forEach((item, pathIdx) => {
      for (let i = 0; i < item.count; i++) {
        const offset = i / item.count + (pathIdx * 0.17);
        beads.push({
          id: id++,
          pathIndex: pathIdx,
          offset: offset % 1.0,
          speed: 0.18 + ((id % 7) * 0.012),
          color: palette[(id + pathIdx) % palette.length],
          baseSize: 0.026 + (id % 3) * 0.004,
        });
      }
    });

    return { mergedRootGeometry: mergedGeo, pulsePaths: paths, nutrientBeads: beads };
  }, []);

  // Shared sphere geometry for instanced beads
  const beadSphereGeo = useMemo(() => new THREE.SphereGeometry(1, 8, 8), []);

  // Shared material for all beads
  const beadMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  // Initialize instanced colors once
  useEffect(() => {
    if (instancedMeshRef.current) {
      nutrientBeads.forEach((bead, i) => {
        instancedMeshRef.current.setColorAt(i, bead.color);
      });
      if (instancedMeshRef.current.instanceColor) {
        instancedMeshRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [nutrientBeads]);

  // Per-frame instanced matrix updates (1 single draw call!)
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const isDiagnostics = stage === 3;
    const speedMultiplier = isDiagnostics ? 1.5 : stage === 2 ? 0.35 : 1.0;

    if (!instancedMeshRef.current) return;

    for (let i = 0; i < nutrientBeads.length; i++) {
      const bead = nutrientBeads[i];
      const pathItem = pulsePaths[bead.pathIndex];
      if (!pathItem) continue;

      // Move upwards from root tips to stem base
      const progress = 1.0 - ((bead.offset + time * bead.speed * speedMultiplier) % 1.0);
      const pos = pathItem.curve.getPointAt(progress);
      dummy.position.copy(pos);

      // Pulse size
      const pulse =
        bead.baseSize *
        (1 + Math.sin(time * 5 + i) * 0.25) *
        (isDiagnostics ? 1.4 : 1.0) *
        intensity;
      dummy.scale.set(pulse, pulse, pulse);
      dummy.updateMatrix();

      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;

    // Bio-fluorescent glow on merged root mesh
    if (rootMaterialRef.current) {
      if (isDiagnostics) {
        rootMaterialRef.current.emissive.set('#0ea5e9');
        rootMaterialRef.current.emissiveIntensity = 0.35 + Math.sin(time * 3) * 0.15;
      } else if (stage === 2) {
        rootMaterialRef.current.emissive.set('#451a03');
        rootMaterialRef.current.emissiveIntensity = 0.08;
      } else {
        rootMaterialRef.current.emissive.set('#10b981');
        rootMaterialRef.current.emissiveIntensity = 0.04;
      }
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Merged Root Geometry (Single Draw Call!) */}
      <mesh geometry={mergedRootGeometry} receiveShadow>
        <meshStandardMaterial
          ref={rootMaterialRef}
          color={stage === 2 ? '#8a662e' : '#dfd4c4'}
          roughness={0.65}
          metalness={0.05}
          polygonOffset
          polygonOffsetFactor={-1.5}
          polygonOffsetUnits={-1.5}
        />
      </mesh>

      {/* 2. Instanced Nutrient Pulses (Single Draw Call for all beads!) */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[beadSphereGeo, beadMaterial, nutrientBeads.length]}
      />
    </group>
  );
}
