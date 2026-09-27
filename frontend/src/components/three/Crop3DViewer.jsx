import React, { Suspense, Component, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Crop3DModel from './Crop3DModels.jsx';
import { isWebGLAvailable } from '../../utils/deviceCapabilities.js';
import {
  WheatIcon,
  BarleyIcon,
  RiceIcon,
  MaizeIcon,
  CottonIcon,
  SugarcaneIcon,
  ChickpeaIcon,
} from '../icons/CropIcons.jsx';

const CROP_ICONS = {
  wheat: WheatIcon,
  barley: BarleyIcon,
  rice: RiceIcon,
  maize: MaizeIcon,
  cotton: CottonIcon,
  sugarcane: SugarcaneIcon,
  chickpea: ChickpeaIcon,
};

class ThreeErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err) {
    console.warn('Three.js / WebGL render error caught gracefully:', err);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function Crop2DFallback({ cropId }) {
  const IconComponent = CROP_ICONS[cropId] || WheatIcon;
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none bg-gradient-to-b from-[#FAF8F5] to-[#EAE3D3]">
      <div className="w-28 h-28 flex items-center justify-center mb-2 animate-bounce-subtle">
        <IconComponent size={96} accentColor="#B8791E" inkColor="#1C1B18" />
      </div>
      <span className="text-xs font-serif text-[#1C1B18] tracking-wide">
        Botanical Field Preview
      </span>
      <span className="text-[10px] text-[#756F63] mt-0.5">
        Optimized 2D Mode Active
      </span>
    </div>
  );
}

export default function Crop3DViewer({
  cropId = 'wheat',
  autoRotate = false,
  enableZoom = true,
  cameraDistance = 2.55,
  interactive = true,
}) {
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    setWebGLSupported(isWebGLAvailable());
  }, []);

  if (!webGLSupported) {
    return <Crop2DFallback cropId={cropId} />;
  }

  return (
    <ThreeErrorBoundary fallback={<Crop2DFallback cropId={cropId} />}>
      <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none">
        <Canvas
          camera={{ position: [0, 0.12, cameraDistance], fov: 42 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: 'high-performance', antialias: true, alpha: true }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              setWebGLSupported(false);
            }, false);
          }}
        >
          {/* Warm Studio Lighting */}
          <ambientLight intensity={1.15} />
          <directionalLight position={[4, 6, 4]} intensity={1.4} color="#FFF5E5" />
          <directionalLight position={[-4, 2, -2]} intensity={0.65} color="#C4DEC9" />
          <pointLight position={[0, -2, 2]} intensity={0.45} color="#D9A84E" />

          <Suspense fallback={null}>
            <Crop3DModel cropId={cropId} />
          </Suspense>

          {interactive && (
            <OrbitControls
              target={[0, 0.1, 0]}
              enablePan={false}
              enableZoom={enableZoom}
              minDistance={1.4}
              maxDistance={4.2}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 1.8}
              autoRotate={autoRotate}
              autoRotateSpeed={1.3}
              dampingFactor={0.08}
            />
          )}
        </Canvas>
      </div>
    </ThreeErrorBoundary>
  );
}
