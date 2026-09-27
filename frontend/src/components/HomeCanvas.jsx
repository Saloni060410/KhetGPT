import { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import SubsurfaceRoots from './SubsurfaceRoots';
import InteractiveCropsField from './InteractiveCropsField';
import { CROPS_DATA } from '../data/cropsData';

// 3D Model Paths
const MODEL_PATHS = {
  crop: '/models/crop_stages.glb',
  fertilizerBag: '/models/vermicompost_bag.glb',
};

// High-Resolution PBR Texture Paths
const TEXTURE_PATHS = {
  farmDiff: '/textures/soil_farm_diff.jpg',
  farmNor: '/textures/soil_farm_nor.jpg',
  farmRough: '/textures/soil_farm_rough.jpg',
  farmAo: '/textures/soil_farm_ao.jpg',
  strataDiff: '/textures/soil_strata_diff.jpg',
  strataNor: '/textures/soil_strata_nor.jpg',
  strataRough: '/textures/soil_strata_rough.jpg',
  strataAo: '/textures/soil_strata_ao.jpg',
  depletedDiff: '/textures/soil_depleted_diff.jpg',
  depletedNor: '/textures/soil_depleted_nor.jpg',
  depletedRough: '/textures/soil_depleted_rough.jpg',
  depletedAo: '/textures/soil_depleted_ao.jpg',
};

// Preloads
useGLTF.preload(MODEL_PATHS.crop);
useGLTF.preload(MODEL_PATHS.fertilizerBag);
useTexture.preload(Object.values(TEXTURE_PATHS));

/**
 * SceneContent: High-Fidelity Agricultural Soil Cross-Section Diorama
 * Uses authentic CC0 PBR textures for topsoil, cracked earth, and sedimentary strata.
 */
function SceneContent({
  sceneRefs,
  currentStage = 1,
  onReady,
  selectedCropId,
  onSelectCrop,
  activeNutrientStream,
}) {
  const { camera } = useThree();
  const cropGLTF = useGLTF(MODEL_PATHS.crop);
  const bagGLTF = useGLTF(MODEL_PATHS.fertilizerBag);

  // Load PBR Textures
  const [
    farmDiff,
    farmNor,
    farmRough,
    farmAo,
    strataDiff,
    strataNor,
    strataRough,
    strataAo,
    depletedDiff,
    depletedNor,
    depletedRough,
    depletedAo,
  ] = useTexture([
    TEXTURE_PATHS.farmDiff,
    TEXTURE_PATHS.farmNor,
    TEXTURE_PATHS.farmRough,
    TEXTURE_PATHS.farmAo,
    TEXTURE_PATHS.strataDiff,
    TEXTURE_PATHS.strataNor,
    TEXTURE_PATHS.strataRough,
    TEXTURE_PATHS.strataAo,
    TEXTURE_PATHS.depletedDiff,
    TEXTURE_PATHS.depletedNor,
    TEXTURE_PATHS.depletedRough,
    TEXTURE_PATHS.depletedAo,
  ]);

  // Configure texture wrap and tiling for expanded agricultural field
  useMemo(() => {
    [farmDiff, farmNor, farmRough, farmAo].forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8.0, 6.0);
    });
    [strataDiff, strataNor, strataRough, strataAo].forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6.0, 1.2);
    });
    [depletedDiff, depletedNor, depletedRough, depletedAo].forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6.0, 5.0);
    });
  }, [
    farmDiff,
    farmNor,
    farmRough,
    farmAo,
    strataDiff,
    strataNor,
    strataRough,
    strataAo,
    depletedDiff,
    depletedNor,
    depletedRough,
    depletedAo,
  ]);

  // Expanded Soil slab dimensions for 7 full furrow rows
  const slabWidth = 15.0;
  const slabHeight = 2.0;
  const slabDepth = 12.5;

  // Internal Fallback Refs
  const internalSun = useRef();
  const internalFill = useRef();
  const internalWorld = useRef();
  const internalTopSoil = useRef();
  const internalCrop = useRef();
  const internalFertilizer = useRef();
  const internalSubLight = useRef();
  const internalSubLight2 = useRef();
  const cropColorRef = useRef(new THREE.Color('#ffffff'));
  const prevColorRef = useRef(new THREE.Color('#ffffff'));
  const activeStageRef = useRef(currentStage);

  const sunRef = sceneRefs?.sunLightRef || internalSun;
  const fillRef = sceneRefs?.fillLightRef || internalFill;
  const worldRef = sceneRefs?.worldGroupRef || internalWorld;
  const topSoilRef = sceneRefs?.topSoilRef || sceneRefs?.healthySoilRef || internalTopSoil;
  const cropRef = sceneRefs?.cropRef || internalCrop;
  const fertilizerRef = sceneRefs?.fertilizerRef || internalFertilizer;
  const subLightRef = sceneRefs?.subterraneanLightRef || internalSubLight;
  const subLight2Ref = sceneRefs?.subterraneanLight2Ref || internalSubLight2;

  // Track active stage
  useEffect(() => {
    activeStageRef.current = currentStage;
  }, [currentStage]);

  // Clustered crop beds & material collection with model geometry centering fix
  const { cropMaterials } = useMemo(() => {
    const crops = [];
    const mats = [];

    const cropConfigs = [
      // Row 1: Front Furrow Row (Planted precisely above the 3 subterranean taproot heads at z = 2.26)
      { pos: [-0.8, 0, 2.26], scale: [2.2, 2.2, 2.2], rot: [0, 0.15, 0] },
      { pos: [0.4, 0, 2.26], scale: [2.35, 2.35, 2.35], rot: [0, -0.2, 0] },
      { pos: [1.5, 0, 2.26], scale: [2.25, 2.25, 2.25], rot: [0, 0.3, 0] },

      // Row 2: Middle Furrow Row
      { pos: [-1.7, 0, 0.75], scale: [1.85, 1.85, 1.85], rot: [0, 0.25, 0] },
      { pos: [-0.5, 0, 0.75], scale: [1.95, 1.95, 1.95], rot: [0, -0.1, 0] },
      { pos: [0.7, 0, 0.75], scale: [1.9, 1.9, 1.9], rot: [0, 0.18, 0] },
      { pos: [1.9, 0, 0.75], scale: [1.8, 1.8, 1.8], rot: [0, -0.25, 0] },

      // Row 3: Back Furrow Row
      { pos: [-1.2, 0, -0.75], scale: [1.7, 1.7, 1.7], rot: [0, 0.35, 0] },
      { pos: [0.1, 0, -0.75], scale: [1.75, 1.75, 1.75], rot: [0, -0.15, 0] },
      { pos: [1.4, 0, -0.75], scale: [1.65, 1.65, 1.65], rot: [0, 0.2, 0] },
    ];

    cropConfigs.forEach((cfg) => {
      const cloned = cropGLTF.scene.clone(true);

      // Model Centering Bug Fix:
      // The raw crop GLB has an internal node translation (+0.51) which offsets the center of mass
      // and causes rotation and placement to pivot far away from the root stem.
      // Re-center child meshes horizontally so [0, 0, 0] is the true root base center.
      const box = new THREE.Box3().setFromObject(cloned);
      const center = new THREE.Vector3();
      box.getCenter(center);
      cloned.children.forEach((child) => {
        child.position.x -= center.x;
        child.position.y -= box.min.y; // Sit flush on top of soil
        child.position.z -= center.z;
      });

      cloned.traverse((child) => {
        if (child.isMesh && child.material) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = child.material.clone();
          mats.push(child.material);
        }
      });
      crops.push({ scene: cloned, ...cfg });
    });

    return { clonedCrops: crops, cropMaterials: mats };
  }, [cropGLTF]);

  // Fertilizer bag shadows
  useEffect(() => {
    bagGLTF.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [bagGLTF]);

  // Optimized plowed furrow geometry (48x36 segments) with UV2 for AO map
  // Edge-tapered displacement eliminates edge gaps with the cutaway box
  const furrowPlaneGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(slabWidth, slabDepth, 48, 36);
    const pos = geo.attributes.position;
    const halfW = slabWidth / 2;
    const halfD = slabDepth / 2;
    for (let i = 0; i < pos.count; i++) {
      const xLocal = pos.getX(i);
      const yLocal = pos.getY(i);
      // Fade furrow displacement to 0 at perimeter to prevent gap artifacts with cutaway walls
      const edgeFactor = Math.min(
        1,
        Math.max(0, (halfD - Math.abs(yLocal)) / 0.45),
        Math.max(0, (halfW - Math.abs(xLocal)) / 0.45)
      );
      const furrow = (Math.sin(yLocal * 9.0) * 0.035 + Math.sin(xLocal * 14.0) * 0.012) * edgeFactor;
      pos.setZ(i, furrow);
    }
    geo.computeVertexNormals();
    geo.setAttribute('uv2', geo.attributes.uv);
    return geo;
  }, [slabWidth, slabDepth]);

  // Strata cutaway block geometry with UV2 for AO
  const cutawayBoxGeo = useMemo(() => {
    const geo = new THREE.BoxGeometry(slabWidth, slabHeight, slabDepth);
    geo.setAttribute('uv2', geo.attributes.uv);
    return geo;
  }, [slabWidth, slabHeight, slabDepth]);

  // Geological strata cutaway materials with AO
  const cutawayBoxMaterials = useMemo(() => {
    const frontCutawayMat = new THREE.MeshStandardMaterial({
      map: strataDiff,
      normalMap: strataNor,
      roughnessMap: strataRough,
      aoMap: strataAo,
      aoMapIntensity: 1.15,
      color: new THREE.Color('#b5a28f'),
      roughness: 0.84,
      metalness: 0.02,
    });

    const sideWallMat = new THREE.MeshStandardMaterial({
      map: strataDiff,
      normalMap: strataNor,
      roughnessMap: strataRough,
      aoMap: strataAo,
      aoMapIntensity: 1.0,
      color: new THREE.Color('#4d3a2a'),
      roughness: 0.9,
      metalness: 0.02,
    });

    const bottomMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#140d08'),
      roughness: 0.98,
    });

    const innerTopMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#22170f'),
      roughness: 0.9,
    });

    return [
      sideWallMat,       // +X
      sideWallMat,       // -X
      innerTopMat,       // +Y
      bottomMat,         // -Y
      frontCutawayMat,   // +Z (front cutaway wall)
      sideWallMat,       // -Z
    ];
  }, [strataDiff, strataNor, strataRough, strataAo]);

  // Dynamic texture switching between healthy farm soil and depleted cracked earth
  useEffect(() => {
    if (topSoilRef.current) {
      const isDepleted = currentStage === 2;
      topSoilRef.current.map = isDepleted ? depletedDiff : farmDiff;
      topSoilRef.current.normalMap = isDepleted ? depletedNor : farmNor;
      topSoilRef.current.roughnessMap = isDepleted ? depletedRough : farmRough;
      topSoilRef.current.aoMap = isDepleted ? depletedAo : farmAo;
      topSoilRef.current.needsUpdate = true;
    }
  }, [
    currentStage,
    farmDiff,
    farmNor,
    farmRough,
    farmAo,
    depletedDiff,
    depletedNor,
    depletedRough,
    depletedAo,
  ]);

  // Connect exposed refs to parent container
  useEffect(() => {
    if (sceneRefs && 'current' in sceneRefs) {
      sceneRefs.current.camera = camera;
      sceneRefs.current.sunLight = sunRef.current;
      sceneRefs.current.fillLight = fillRef.current;
      sceneRefs.current.worldGroup = worldRef.current;
      sceneRefs.current.topSoil = topSoilRef.current;
      sceneRefs.current.healthySoil = topSoilRef.current;
      sceneRefs.current.crop = cropRef.current;
      sceneRefs.current.fertilizerBag = fertilizerRef.current;
      sceneRefs.current.fertilizer = fertilizerRef.current;
      sceneRefs.current.subterraneanLight = subLightRef.current;
      sceneRefs.current.subterraneanLight2 = subLight2Ref.current;
      sceneRefs.current.cropColor = cropColorRef.current;
      sceneRefs.current.setStage = (s) => {
        activeStageRef.current = s;
      };
      sceneRefs.current.focusCrop = (cropId) => {
        const crop = CROPS_DATA.find((c) => c.id === cropId);
        if (crop && controlsRef.current) {
          const cropWorldX = 0.0;
          const cropWorldY = -1.0 + slabHeight / 2 + 0.4;
          const cropWorldZ = crop.rowZ;
          gsap.to(controlsRef.current.target, { x: cropWorldX, y: cropWorldY, z: cropWorldZ, duration: 1.0 });
          gsap.to(camera.position, { x: cropWorldX, y: cropWorldY + 2.2, z: cropWorldZ + 4.2, duration: 1.3 });
        }
      };
      sceneRefs.current.resetOverview = () => {
        if (controlsRef.current) {
          gsap.to(controlsRef.current.target, { x: 0.0, y: 0.0, z: 0.0, duration: 1.2 });
          gsap.to(camera.position, { x: 0.0, y: 7.5, z: 13.5, duration: 1.4 });
        }
      };
      if (onReady) {
        onReady();
      }
    }
  }, [camera, onReady, sceneRefs, slabHeight]);

  const controlsRef = useRef();

  // Smooth camera zoom & glide to selected crop row in 3D space
  useEffect(() => {
    if (!controlsRef.current) return;
    if (selectedCropId) {
      const crop = CROPS_DATA.find((c) => c.id === selectedCropId);
      if (crop) {
        const cropWorldX = 0.0;
        const cropWorldY = -1.0 + slabHeight / 2 + 0.4;
        const cropWorldZ = crop.rowZ;

        gsap.to(controlsRef.current.target, {
          x: cropWorldX,
          y: cropWorldY,
          z: cropWorldZ,
          duration: 1.2,
          ease: 'power3.inOut',
        });

        gsap.to(camera.position, {
          x: cropWorldX,
          y: cropWorldY + 2.2,
          z: cropWorldZ + 4.2,
          duration: 1.4,
          ease: 'power3.inOut',
        });
      }
    }
  }, [selectedCropId, camera, slabHeight]);

  // Lazy update: only update material colors when GSAP tweens cropColorRef
  useFrame(() => {
    if (cropColorRef.current && !prevColorRef.current.equals(cropColorRef.current)) {
      prevColorRef.current.copy(cropColorRef.current);
      for (let i = 0; i < cropMaterials.length; i++) {
        cropMaterials[i].color.copy(cropColorRef.current);
      }
    }
  });

  return (
    <>
      {/* Natural Agricultural Sky Environment HDR */}
      <Environment files="/sky.hdr" background environmentIntensity={0.8} />

      {/* Primary Directional Sunlight with expanded agricultural shadow coverage */}
      <directionalLight
        ref={sunRef}
        position={[12, 18, 10]}
        intensity={2.2}
        color="#fff6eb"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0003}
      />

      {/* Front Warm Agricultural Sky Fill Light */}
      <directionalLight
        ref={fillRef}
        position={[-8, 8, 12]}
        intensity={0.7}
        color="#d4af88"
      />

      <hemisphereLight args={['#4a3728', '#1c1510', 0.65]} />
      <ambientLight intensity={0.45} color="#ffffff" />

      {/* Subterranean AI Scan Lights in front of expanded strata face */}
      <pointLight
        ref={subLightRef}
        position={[0.0, -0.9, slabDepth / 2 + 1.2]}
        intensity={0}
        color="#06b6d4"
        distance={14}
        decay={1.2}
      />
      <pointLight
        ref={subLight2Ref}
        position={[-1.2, -0.9, slabDepth / 2 + 1.0]}
        intensity={0}
        color="#10b981"
        distance={13}
        decay={1.2}
      />

      {/* Main Soil Cross-Section Diorama Group */}
      <group ref={worldRef} position={[0.0, -1.0, 0]}>
        {/* 1. Vertical Front Subterranean Cutaway Wall & Strata Block */}
        <mesh receiveShadow castShadow geometry={cutawayBoxGeo} material={cutawayBoxMaterials} />

        {/* 2. Top Ground Plane: Authentic PBR Ribbed Furrow Soil Surface for the 7 Rows */}
        <mesh
          position={[0, slabHeight / 2 + 0.002, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          geometry={furrowPlaneGeo}
          receiveShadow
        >
          <meshStandardMaterial
            ref={topSoilRef}
            map={farmDiff}
            normalMap={farmNor}
            roughnessMap={farmRough}
            aoMap={farmAo}
            aoMapIntensity={1.2}
            color="#ffffff"
            roughness={0.88}
            metalness={0.02}
          />
        </mesh>

        {/* 2b. Vast Continuous Soil Ground Surface covering the entire page */}
        <mesh
          position={[0, slabHeight / 2 - 0.002, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial
            map={farmDiff}
            normalMap={farmNor}
            roughnessMap={farmRough}
            aoMap={farmAo}
            aoMapIntensity={1.1}
            color="#f5ede4"
            roughness={0.92}
            metalness={0.01}
          />
        </mesh>

        {/* 3. Retaining Edge Bevel Frame at Diorama Base */}
        <mesh position={[0, -slabHeight / 2 - 0.06, 0]}>
          <boxGeometry args={[slabWidth + 0.4, 0.12, slabDepth + 0.4]} />
          <meshStandardMaterial color="#0b1118" roughness={0.45} metalness={0.35} />
        </mesh>

        {/* 4. Subsurface Root & Biology Layer (Aligned to front cutaway face) */}
        <group position={[0, slabHeight / 2, slabDepth / 2 - 2.25]}>
          <SubsurfaceRoots stage={activeStageRef.current} />
        </group>

        {/* 5. 7 Interactive Crop Rows Across Furrows */}
        <group ref={cropRef} position={[0, slabHeight / 2, 0]}>
          <InteractiveCropsField
            selectedCropId={selectedCropId}
            onSelectCrop={onSelectCrop}
            activeNutrientStream={activeNutrientStream}
          />
        </group>

        {/* 6. Vermicompost Fertilizer Sack */}
        <primitive
          ref={fertilizerRef}
          object={bagGLTF.scene}
          position={[5.5, slabHeight / 2, 4.5]}
          scale={[0, 0, 0]}
          rotation={[0, -0.4, 0]}
        />
      </group>

      {/* 3D Interactive Turntable & Orbit Navigation */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        minDistance={2.5}
        maxDistance={35}
        maxPolarAngle={Math.PI / 2 - 0.02}
        enableDamping
        dampingFactor={0.06}
      />

      {/* Cached Ground Contact Shadows */}
      <ContactShadows
        position={[0.0, -2.08, 0]}
        opacity={0.88}
        scale={30}
        blur={2.5}
        far={10}
        resolution={512}
        frames={1}
      />
    </>
  );
}

/**
 * HomeCanvas: High-Performance Canvas with Continuous Soil Earth & Warm Sunlight
 */
export function HomeCanvas({
  sceneRefs,
  onReady,
  currentStage = 1,
  selectedCropId,
  onSelectCrop,
  activeNutrientStream,
}) {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-auto z-0">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0.0, 7.5, 13.5], fov: 46 }}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >

        <Suspense fallback={null}>
          <SceneContent
            sceneRefs={sceneRefs}
            currentStage={currentStage}
            onReady={onReady}
            selectedCropId={selectedCropId}
            onSelectCrop={onSelectCrop}
            activeNutrientStream={activeNutrientStream}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default HomeCanvas;
