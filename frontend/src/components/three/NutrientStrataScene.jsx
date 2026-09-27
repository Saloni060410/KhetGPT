import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

// Register GSAP plugins
gsap.registerPlugin(useGSAP)

// Color definitions for nutrients
const NUTRIENT_THEMES = {
  n: {
    symbol: 'N',
    name: 'Nitrogen',
    colorHex: '#10b981',
    glowColor: '#34d399',
    soilColor: '#5c3a21',
    creditColor: '#d97706',
    borderClass: 'border-emerald-500/40',
    badgeClass: 'bg-emerald-500 text-white',
    ringColor: '#059669',
  },
  p: {
    symbol: 'P',
    name: 'Phosphorus',
    colorHex: '#f59e0b',
    glowColor: '#fbbf24',
    soilColor: '#52341b',
    creditColor: '#b45309',
    borderClass: 'border-amber-500/40',
    badgeClass: 'bg-amber-500 text-white',
    ringColor: '#d97706',
  },
  k: {
    symbol: 'K',
    name: 'Potassium',
    colorHex: '#6366f1',
    glowColor: '#818cf8',
    soilColor: '#4d301b',
    creditColor: '#92400e',
    borderClass: 'border-indigo-500/40',
    badgeClass: 'bg-indigo-500 text-white',
    ringColor: '#4f46e5',
  },
}

/**
 * Individual Stratified Soil Column
 * Represents Native Soil Supply + Prior Credit + Fertilizer Needed to Apply
 */
function SoilCoreColumn({
  nutrientKey,
  position,
  data,
  maxVal,
  isSelected,
  isExpanded,
  onSelect,
  isAnySelected,
}) {
  const { invalidate } = useThree()
  const theme = NUTRIENT_THEMES[nutrientKey] || NUTRIENT_THEMES.n

  const groupRef = useRef()
  const soilMeshRef = useRef()
  const creditMeshRef = useRef()
  const neededMeshRef = useRef()
  const capMeshRef = useRef()
  const pedestalRef = useRef()

  const standardDose = Number(data?.standardDoseKgHa ?? data?.cropDemandKgHa ?? 100)
  const soilSupply = Number(data?.soilAdjustmentKgHa ?? data?.soilSupplyKgHa ?? 30)
  const priorCredit = Number(data?.priorCreditKgHa ?? 0)
  const fertilizerNeeded = Number(data?.fertilizerNeededKgHa ?? 50)
  const soilRating = (data?.soilRating || 'medium').toLowerCase()

  // Height mappings (normalized to 3.2 units max)
  const heightScale = 3.2 / Math.max(maxVal, 140)
  const baseRadius = 0.55

  const targetSoilHeight = Math.max(0.25, soilSupply * heightScale)
  const targetCreditHeight = priorCredit > 0 ? Math.max(0.18, priorCredit * heightScale) : 0
  const targetNeededHeight = Math.max(0.35, fertilizerNeeded * heightScale)
  const standardHeightPos = Math.max(0.4, standardDose * heightScale)

  // Exploded spacing offset
  const explodeGap = isExpanded && isSelected ? 0.35 : 0

  // Animated positions ref for smooth GSAP transitions
  const animState = useRef({
    soilY: targetSoilHeight / 2,
    soilScaleY: 1,
    creditY: targetSoilHeight + explodeGap + targetCreditHeight / 2,
    creditScaleY: targetCreditHeight > 0 ? 1 : 0.001,
    neededY:
      targetSoilHeight +
      (targetCreditHeight > 0 ? targetCreditHeight + explodeGap * 2 : explodeGap) +
      targetNeededHeight / 2,
    neededScaleY: 1,
    groupElevation: isSelected ? 0.15 : 0,
    opacityFactor: isAnySelected && !isSelected ? 0.55 : 1,
  })

  // GSAP animation when data or selection state changes
  useGSAP(
    () => {
      const sH = targetSoilHeight
      const cH = targetCreditHeight
      const nH = targetNeededHeight
      const gap = isExpanded && isSelected ? 0.38 : 0

      const nextSoilY = sH / 2
      const nextCreditY = sH + (cH > 0 ? gap + cH / 2 : 0)
      const nextNeededY = sH + (cH > 0 ? cH + gap * 2 : gap) + nH / 2
      const nextElev = isSelected ? 0.2 : 0
      const nextOpacity = isAnySelected && !isSelected ? 0.5 : 1

      gsap.to(animState.current, {
        soilY: nextSoilY,
        creditY: nextCreditY,
        neededY: nextNeededY,
        groupElevation: nextElev,
        opacityFactor: nextOpacity,
        duration: 0.7,
        ease: 'power2.out',
        onUpdate: () => {
          if (groupRef.current) {
            groupRef.current.position.y = position[1] + animState.current.groupElevation
          }
          if (soilMeshRef.current) {
            soilMeshRef.current.position.y = animState.current.soilY
          }
          if (creditMeshRef.current && cH > 0) {
            creditMeshRef.current.position.y = animState.current.creditY
          }
          if (neededMeshRef.current) {
            neededMeshRef.current.position.y = animState.current.neededY
          }
          invalidate()
        },
      })
    },
    {
      dependencies: [
        targetSoilHeight,
        targetCreditHeight,
        targetNeededHeight,
        isSelected,
        isExpanded,
        isAnySelected,
      ],
      scope: groupRef,
    },
  )

  const ratingBadgeBg =
    soilRating === 'low'
      ? 'bg-amber-500/90 text-amber-950 font-bold'
      : soilRating === 'high'
        ? 'bg-blue-500/90 text-white font-bold'
        : 'bg-emerald-500/90 text-white font-bold'

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Base Pedestal Ring */}
      <mesh
        ref={pedestalRef}
        position={[0, -0.05, 0]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(nutrientKey)
        }}
        cursor="pointer"
      >
        <cylinderGeometry args={[baseRadius * 1.35, baseRadius * 1.45, 0.08, 32]} />
        <meshStandardMaterial
          color={isSelected ? theme.ringColor : '#1e293b'}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* Decorative Ground Target Ring */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[baseRadius * 1.5, baseRadius * 1.62, 32]} />
        <meshBasicMaterial
          color={theme.colorHex}
          transparent
          opacity={isSelected ? 0.8 : 0.25}
        />
      </mesh>

      {/* 2. Bottom Stratum: Native Soil Reserve / Adjustment */}
      <mesh
        ref={soilMeshRef}
        position={[0, targetSoilHeight / 2, 0]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(nutrientKey)
        }}
        cursor="pointer"
      >
        <cylinderGeometry args={[baseRadius, baseRadius, targetSoilHeight, 32]} />
        <meshStandardMaterial
          color={theme.soilColor}
          roughness={0.9}
          metalness={0.08}
          transparent
          opacity={animState.current.opacityFactor}
        />
      </mesh>

      {/* Soil Horizon separator ring */}
      <mesh position={[0, targetSoilHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[baseRadius * 0.96, baseRadius * 1.02, 32]} />
        <meshBasicMaterial color="#3e2716" opacity={0.6} transparent />
      </mesh>

      {/* 3. Middle Stratum: Prior Credit (Rendered when credit > 0) */}
      {targetCreditHeight > 0 && (
        <mesh
          ref={creditMeshRef}
          position={[0, targetSoilHeight + explodeGap + targetCreditHeight / 2, 0]}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(nutrientKey)
          }}
          cursor="pointer"
        >
          <cylinderGeometry args={[baseRadius, baseRadius, targetCreditHeight, 32]} />
          <meshStandardMaterial
            color={theme.creditColor}
            roughness={0.4}
            metalness={0.35}
            transparent
            opacity={animState.current.opacityFactor}
          />
        </mesh>
      )}

      {/* 4. Top Stratum: Fertilizer Needed To Apply (Active Payload) */}
      <mesh
        ref={neededMeshRef}
        position={[
          0,
          targetSoilHeight +
            (targetCreditHeight > 0 ? targetCreditHeight + explodeGap * 2 : explodeGap) +
            targetNeededHeight / 2,
          0,
        ]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(nutrientKey)
        }}
        cursor="pointer"
      >
        <cylinderGeometry args={[baseRadius, baseRadius, targetNeededHeight, 32]} />
        <meshStandardMaterial
          color={theme.colorHex}
          roughness={0.3}
          metalness={0.15}
          emissive={theme.glowColor}
          emissiveIntensity={isSelected ? 0.35 : 0.15}
          transparent
          opacity={animState.current.opacityFactor}
        />
      </mesh>

      {/* 5. Upper Wireframe Cap: Standard Gross Crop Demand Line */}
      <mesh
        ref={capMeshRef}
        position={[0, standardHeightPos, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[baseRadius * 1.06, baseRadius * 1.15, 32]} />
        <meshBasicMaterial
          color="#94a3b8"
          transparent
          opacity={isSelected ? 0.85 : 0.45}
        />
      </mesh>

      {/* 6. Drei HTML Overlays: Floating nutrient info & stratum tags */}
      <Html
        position={[
          0,
          targetSoilHeight +
            (targetCreditHeight > 0 ? targetCreditHeight : 0) +
            targetNeededHeight +
            (isExpanded && isSelected ? 0.85 : 0.45),
          0,
        ]}
        center
        distanceFactor={7.5}
        zIndexRange={[10, 0]}
      >
        <div
          onClick={() => onSelect(nutrientKey)}
          className={`pointer-events-auto cursor-pointer select-none rounded-xl p-2.5 backdrop-blur-md transition-all duration-300 text-center shadow-lg border ${
            isSelected
              ? 'bg-slate-900/90 text-white scale-105 ring-2 ring-emerald-400 border-emerald-400'
              : 'bg-slate-900/75 text-slate-200 hover:bg-slate-900/85 border-slate-700'
          }`}
          style={{ width: '135px' }}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span
              className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black text-white"
              style={{ backgroundColor: theme.colorHex }}
            >
              {theme.symbol}
            </span>
            <span className="text-[11px] font-bold tracking-wide uppercase">
              {theme.name}
            </span>
            <span
              className={`text-[9px] uppercase px-1.5 py-0.5 rounded-full ${ratingBadgeBg}`}
            >
              {soilRating}
            </span>
          </div>

          <div className="text-sm font-extrabold text-white">
            {fertilizerNeeded} <span className="text-[10px] font-normal text-slate-300">kg/ha</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">needed to apply</div>
        </div>
      </Html>

      {/* Exploded Stratum Floating Badges (Visible when pillar is expanded & selected) */}
      {isExpanded && isSelected && (
        <>
          {/* Needed Tag */}
          <Html
            position={[
              baseRadius + 0.5,
              targetSoilHeight +
                (targetCreditHeight > 0 ? targetCreditHeight + explodeGap * 2 : explodeGap) +
                targetNeededHeight / 2,
              0,
            ]}
            distanceFactor={8}
            zIndexRange={[20, 0]}
          >
            <div className="whitespace-nowrap px-2 py-1 rounded-md bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-[11px] font-bold shadow-md">
              +{fertilizerNeeded} kg/ha (Fertilizer Needed)
            </div>
          </Html>

          {/* Credit Tag (if > 0) */}
          {targetCreditHeight > 0 && (
            <Html
              position={[
                baseRadius + 0.5,
                targetSoilHeight + explodeGap + targetCreditHeight / 2,
                0,
              ]}
              distanceFactor={8}
              zIndexRange={[20, 0]}
            >
              <div className="whitespace-nowrap px-2 py-1 rounded-md bg-amber-950/90 border border-amber-500/60 text-amber-300 text-[11px] font-bold shadow-md">
                -{priorCredit} kg/ha (Prior Recent Credit)
              </div>
            </Html>
          )}

          {/* Soil Reserve Tag */}
          <Html
            position={[baseRadius + 0.5, targetSoilHeight / 2, 0]}
            distanceFactor={8}
            zIndexRange={[20, 0]}
          >
            <div className="whitespace-nowrap px-2 py-1 rounded-md bg-stone-900/90 border border-stone-600/60 text-stone-200 text-[11px] font-bold shadow-md">
              -{soilSupply} kg/ha (Native Soil Supply)
            </div>
          </Html>

          {/* Standard Dose Benchmark Line */}
          <Html
            position={[-baseRadius - 0.5, standardHeightPos, 0]}
            distanceFactor={8}
            zIndexRange={[20, 0]}
          >
            <div className="whitespace-nowrap px-2 py-0.5 rounded bg-slate-800/85 border border-slate-600 text-slate-300 text-[10px] font-medium shadow-sm">
              = {standardDose} kg/ha Gross Crop Demand
            </div>
          </Html>
        </>
      )}
    </group>
  )
}

/**
 * Main 3D Canvas Scene
 * Rendered on demand, paused when tab is hidden, reacts to WebGL context loss
 */
export default function NutrientStrataScene({
  nutrientBalance = {},
  selectedNutrient = 'n',
  onSelectNutrient,
  isExpanded = false,
  onToggleExpand,
  onWebGLContextLost,
}) {
  const [tabHidden, setTabHidden] = useState(false)
  const controlsRef = useRef()

  // Tab hidden listener: pauses canvas rendering when user minimizes or switches tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isHidden = document.hidden
      setTabHidden(isHidden)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Calculate highest metric to normalize column heights
  const maxVal = useMemo(() => {
    const vals = ['n', 'p', 'k'].map((k) => {
      const item = nutrientBalance[k] || {}
      const needed = Number(item.fertilizerNeededKgHa ?? 0)
      const soil = Number(item.soilAdjustmentKgHa ?? item.soilSupplyKgHa ?? 0)
      const credit = Number(item.priorCreditKgHa ?? 0)
      const gross = Number(item.standardDoseKgHa ?? item.cropDemandKgHa ?? 0)
      return Math.max(needed + soil + credit, gross)
    })
    return Math.max(...vals, 140)
  }, [nutrientBalance])

  return (
    <div className="relative w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-inner">
      {/* 3D Canvas with project-mandated optimizations:
          - dpr={[1, 1.5]}
          - frameloop="demand" (only renders on demand / animation update)
          - shadows={false} (no expensive real-time shadow maps)
          - low-power preference
          - webglcontextlost listener for immediate fallback
      */}
      <Canvas
        dpr={[1, 1.5]}
        frameloop={tabHidden ? 'never' : 'demand'}
        shadows={false}
        camera={{ position: [0, 2.8, 6.6], fov: 42 }}
        gl={{
          powerPreference: 'low-power',
          antialias: true,
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          const dom = gl.domElement
          if (dom) {
            dom.addEventListener(
              'webglcontextlost',
              (event) => {
                event.preventDefault()
                onWebGLContextLost?.()
              },
              false,
            )
          }
        }}
      >
        {/* Lights (Ambient + simple directional, no realtime shadow maps) */}
        <ambientLight intensity={0.85} />
        <directionalLight position={[5, 8, 4]} intensity={1.1} />
        <directionalLight position={[-4, 3, -2]} intensity={0.4} color="#93c5fd" />

        {/* Orbit Controls (smooth interactive inspection) */}
        <OrbitControls
          ref={controlsRef}
          enableZoom={true}
          minDistance={4.5}
          maxDistance={11}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minPolarAngle={Math.PI / 6}
          enablePan={false}
          makeDefault
        />

        {/* Ground Reference Plane */}
        <group position={[0, -0.06, 0]}>
          <gridHelper
            args={[12, 12, '#334155', '#1e293b']}
            position={[0, 0, 0]}
          />
        </group>

        {/* The Three Stratified Soil Core Columns: N, P, K */}
        <SoilCoreColumn
          nutrientKey="n"
          position={[-2.3, 0, 0]}
          data={nutrientBalance.n}
          maxVal={maxVal}
          isSelected={selectedNutrient === 'n'}
          isExpanded={isExpanded}
          onSelect={onSelectNutrient}
          isAnySelected={Boolean(selectedNutrient)}
        />

        <SoilCoreColumn
          nutrientKey="p"
          position={[0, 0, 0]}
          data={nutrientBalance.p}
          maxVal={maxVal}
          isSelected={selectedNutrient === 'p'}
          isExpanded={isExpanded}
          onSelect={onSelectNutrient}
          isAnySelected={Boolean(selectedNutrient)}
        />

        <SoilCoreColumn
          nutrientKey="k"
          position={[2.3, 0, 0]}
          data={nutrientBalance.k}
          maxVal={maxVal}
          isSelected={selectedNutrient === 'k'}
          isExpanded={isExpanded}
          onSelect={onSelectNutrient}
          isAnySelected={Boolean(selectedNutrient)}
        />
      </Canvas>
    </div>
  )
}
