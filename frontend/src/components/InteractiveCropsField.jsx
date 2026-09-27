import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CROPS_DATA } from '../data/cropsData';
import CropMesh from './Crop3DModels';
import FertilizerParticles3D from './FertilizerParticles3D';

// 7 evenly spaced plants filling each furrow row across the field width
const PLANT_X_OFFSETS = [-5.2, -3.5, -1.75, 0.0, 1.75, 3.5, 5.2];

/**
 * Individual Plant Instance in a Crop Row
 */
function PlantInstance({
  crop,
  xOffset,
  plantIndex,
  isSelected,
  isRowHovered,
  onPlantClick,
  onPointerOver,
  onPointerOut,
}) {
  const groupRef = useRef();
  const plantWindOffset = useMemo(() => ((plantIndex * 37) % 8) + plantIndex * 0.8, [plantIndex]);
  const rotationY = useMemo(() => (plantIndex * 0.95) % (Math.PI * 2), [plantIndex]);
  const scaleMultiplier = useMemo(() => 0.94 + ((plantIndex * 3) % 5) * 0.03, [plantIndex]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() + plantWindOffset;

    if (isSelected) {
      // Gentle biological pulse and slight sway when row is active
      groupRef.current.position.y = Math.sin(t * 2.2) * 0.025;
      groupRef.current.rotation.z = Math.sin(t * 1.8) * 0.03;
    } else {
      // Organic breeze sway
      const sway = isRowHovered ? 0.035 : 0.02;
      groupRef.current.rotation.z = Math.sin(t * 1.9) * sway;
      groupRef.current.rotation.x = Math.cos(t * 1.5) * (sway * 0.6);
      groupRef.current.position.y = 0;
    }
  });

  return (
    <group position={[xOffset, 0, 0]}>
      {/* Individual Base Planting Disc */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial
          color={crop.color || '#10b981'}
          transparent
          opacity={isSelected ? 0.5 : isRowHovered ? 0.3 : 0.12}
        />
      </mesh>

      {/* Invisible Click / Hover Hitbox */}
      <mesh
        position={[0, 0.65, 0]}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onPlantClick}
        visible={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 1.6, 10]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* 3D Botanical Mesh */}
      <group
        ref={groupRef}
        rotation={[0, rotationY, 0]}
        scale={crop.scale * scaleMultiplier * (isSelected ? 1.15 : isRowHovered ? 1.06 : 1.0)}
      >
        <CropMesh cropId={crop.id} />
      </group>
    </group>
  );
}

/**
 * Complete Agricultural Furrow Row filled with one specific crop
 */
function CropRowPlot({
  crop,
  isSelected,
  onSelect,
  activeNutrientStream,
}) {
  const [rowHovered, setRowHovered] = useState(false);

  const handlePointerOver = (e) => {
    e.stopPropagation();
    setRowHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setRowHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(crop);
  };

  const activeColor = crop.color || '#10b981';

  return (
    <group position={[0, 0, crop.rowZ]}>
      {/* 1. Plowed Soil Furrow Glow Strip running along the entire row */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12.6, isSelected ? 0.75 : 0.45]} />
        <meshBasicMaterial
          color={activeColor}
          transparent
          opacity={isSelected ? 0.35 : rowHovered ? 0.2 : 0.06}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Interactive Row Plants: 7 plants filling the row */}
      {PLANT_X_OFFSETS.map((x, idx) => (
        <PlantInstance
          key={idx}
          crop={crop}
          xOffset={x}
          plantIndex={idx}
          isSelected={isSelected}
          isRowHovered={rowHovered}
          onPlantClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      ))}

      {/* 3. Physical 3D Nutrient Particle Delivery across the selected row */}
      {isSelected && activeNutrientStream && (
        <group>
          <FertilizerParticles3D position={[-3.5, 0, 0]} activeType={activeNutrientStream} count={50} />
          <FertilizerParticles3D position={[0, 0, 0]} activeType={activeNutrientStream} count={80} />
          <FertilizerParticles3D position={[3.5, 0, 0]} activeType={activeNutrientStream} count={50} />
        </group>
      )}

      {/* 4. Floating 3D Precision Row Tag Beacon */}
      <Html
        position={[0, isSelected ? 1.75 : 1.45, 0]}
        center
        distanceFactor={14}
        zIndexRange={[10, 0]}
      >
        <button
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300 backdrop-blur-xl whitespace-nowrap cursor-pointer shadow-xl ${
            isSelected
              ? 'bg-slate-950/95 text-white border-2 border-emerald-400 shadow-emerald-500/50 scale-110 ring-4 ring-emerald-500/25'
              : rowHovered
              ? 'bg-slate-950/90 text-emerald-300 border border-emerald-400/80 shadow-emerald-500/25 scale-105'
              : 'bg-slate-950/75 text-slate-300 border border-slate-700/60 opacity-90 hover:opacity-100'
          }`}
          style={{
            borderColor: isSelected ? activeColor : undefined,
          }}
        >
          {/* Animated Status Pulse */}
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSelected ? 'bg-emerald-400' : 'bg-slate-400'
              }`}
              style={{ backgroundColor: activeColor }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: activeColor }}
            />
          </span>

          <span className="font-bold">
            Row {crop.rowNum}: {crop.name}
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
            {crop.punjabiName}
          </span>
        </button>
      </Html>
    </group>
  );
}

/**
 * Interactive Crops Field: Renders 7 complete agricultural furrow rows
 * filled with their respective crops across the entire field.
 */
export default function InteractiveCropsField({
  selectedCropId,
  onSelectCrop,
  activeNutrientStream,
}) {
  return (
    <group position={[0, 0, 0]}>
      {CROPS_DATA.map((crop) => (
        <CropRowPlot
          key={crop.id}
          crop={crop}
          isSelected={selectedCropId === crop.id}
          onSelect={onSelectCrop}
          activeNutrientStream={activeNutrientStream}
        />
      ))}
    </group>
  );
}
