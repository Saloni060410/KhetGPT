import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const TOTAL_FRAMES = 240;

export default function SoilScroll() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef(new Array(TOTAL_FRAMES));
  const currentDrawnIndexRef = useRef(-1);
  const targetFrameRef = useRef(0);
  const rafScheduledRef = useRef(false);

  // Pre-calculated canvas geometry to prevent layout thrashing
  const geometryRef = useRef({
    physW: 0,
    physH: 0,
    destX: 0,
    destY: 0,
    destW: 0,
    destH: 0,
  });

  // Direct DOM refs for non-re-rendering scroll HUD elements
  const meterBarRef = useRef(null);
  const labelSurfaceRef = useRef(null);
  const label30cmRef = useRef(null);
  const label75cmRef = useRef(null);

  // Stage tracking: only triggers a React state update when entering/exiting a stage
  const [activeStage, setActiveStage] = useState(1);
  const activeStageRef = useRef(1);

  // Loading state
  const [isReady, setIsReady] = useState(false);
  const [loadedPercent, setLoadedPercent] = useState(0);

  // Map vertical scroll progress across the 320vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Zero-padded frame URL generator
  const getFrameUrl = useCallback((index) => {
    const frameNumber = String(index + 1).padStart(5, '0');
    return `/newanime/${frameNumber}.jpg`;
  }, []);

  // Update canvas resolution & precalculate integer cover coordinates
  const updateGeometry = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const physW = Math.round(width * dpr);
    const physH = Math.round(height * dpr);

    if (canvas.width !== physW || canvas.height !== physH) {
      canvas.width = physW;
      canvas.height = physH;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    const ctx = canvas.getContext('2d', { alpha: false });
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }

    const imgAspect = 1280 / 720;
    const destH = Math.round(Math.min(physH * 0.92, physW / imgAspect));
    const destW = Math.round(destH * imgAspect);
    const destX = Math.round((physW - destW) / 2);
    const destY = Math.round((physH - destH) / 2);

    geometryRef.current = { physW, physH, destX, destY, destW, destH };
  }, []);

  // Instant canvas draw with zero layout reads and integer pixel precision
  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Retrieve active frame or closest loaded keyframe across entire cache
    const cache = imagesRef.current;
    let img = cache[frameIndex];

    if (!img) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        if (frameIndex - offset >= 0 && cache[frameIndex - offset]) {
          img = cache[frameIndex - offset];
          break;
        }
        if (frameIndex + offset < TOTAL_FRAMES && cache[frameIndex + offset]) {
          img = cache[frameIndex + offset];
          break;
        }
      }
    }

    if (!img) return;

    const { physW, physH, destX, destY, destW, destH } = geometryRef.current;
    if (physW === 0 || physH === 0) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, physW, physH);

    ctx.drawImage(img, destX, destY, destW, destH);
    currentDrawnIndexRef.current = frameIndex;
  }, []);

  // Render loop scheduled with requestAnimationFrame
  const renderFrame = useCallback(() => {
    rafScheduledRef.current = false;
    drawFrame(targetFrameRef.current);
  }, [drawFrame]);

  // Progressive background preloading with off-thread async image decoding
  useEffect(() => {
    let isMounted = true;
    const cache = imagesRef.current;
    let totalLoaded = 0;

    const loadAndDecode = async (idx) => {
      if (cache[idx]) return;
      return new Promise((resolve) => {
        const img = new Image();
        let finished = false;

        const onFinish = async () => {
          if (finished) return;
          finished = true;
          if (!isMounted) return resolve();
          try {
            if ('decode' in img) {
              await img.decode().catch(() => {});
            }
          } catch {
            // Browser decode fallback
          }
          if (!isMounted) return resolve();
          cache[idx] = img;
          totalLoaded++;

          // As soon as the first frame loads, mark ready and draw immediately
          if (idx === 0 || currentDrawnIndexRef.current === -1) {
            setIsReady(true);
            updateGeometry();
            drawFrame(targetFrameRef.current || 0);
          }

          resolve();
        };

        img.onload = onFinish;
        img.onerror = () => {
          if (!finished) {
            finished = true;
            resolve();
          }
        };
        img.src = getFrameUrl(idx);
        if (img.complete) {
          onFinish();
        }
      });
    };

    const loadBatchConcurrently = async (indices, concurrency = 12) => {
      for (let i = 0; i < indices.length; i += concurrency) {
        if (!isMounted) break;
        const slice = indices.slice(i, i + concurrency);
        await Promise.all(slice.map(loadAndDecode));

        if (isMounted) {
          const pct = Math.round((totalLoaded / TOTAL_FRAMES) * 100);
          setLoadedPercent(pct);
        }
      }
    };

    const runPipeline = async () => {
      // Step 1: Preload frame 0 immediately with highest priority
      await loadAndDecode(0);
      if (isMounted) {
        setIsReady(true);
        updateGeometry();
        drawFrame(0);
      }

      // Step 2: Load keyframes (every 4th frame)
      const keyframes = [];
      for (let i = 0; i < TOTAL_FRAMES; i += 4) {
        if (i !== 0) keyframes.push(i);
      }
      if (!keyframes.includes(TOTAL_FRAMES - 1)) {
        keyframes.push(TOTAL_FRAMES - 1);
      }

      await loadBatchConcurrently(keyframes, 12);

      if (isMounted) {
        setIsReady(true);
        updateGeometry();
        drawFrame(targetFrameRef.current || 0);
      }

      // Step 3: Backfill all remaining frames
      const remaining = [];
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        if (!cache[i]) remaining.push(i);
      }

      await loadBatchConcurrently(remaining, 16);

      if (isMounted) {
        setLoadedPercent(100);
      }
    };

    runPipeline();

    return () => {
      isMounted = false;
    };
  }, [getFrameUrl, drawFrame, updateGeometry]);

  // Window resize handler: updates geometry and repaints current frame
  useEffect(() => {
    updateGeometry();

    const handleResize = () => {
      updateGeometry();
      drawFrame(targetFrameRef.current);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [updateGeometry, drawFrame]);

  // Core progress update function shared by both Framer Motion and native scroll listener
  const updateProgress = useCallback((latest) => {
    const clamped = Math.min(1, Math.max(0, latest));
    const frame = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.floor(clamped * (TOTAL_FRAMES - 1)))
    );

    if (frame !== targetFrameRef.current) {
      targetFrameRef.current = frame;
      if (!rafScheduledRef.current) {
        rafScheduledRef.current = true;
        requestAnimationFrame(renderFrame);
      }
    }

    // Direct DOM update for depth meter (ZERO React re-renders)
    if (meterBarRef.current) {
      meterBarRef.current.style.height = `${clamped * 100}%`;
    }

    // Direct DOM update for depth labels (ZERO React re-renders)
    if (labelSurfaceRef.current && label30cmRef.current && label75cmRef.current) {
      const isSurf = clamped < 0.25;
      const is30 = clamped >= 0.25 && clamped < 0.65;
      const is75 = clamped >= 0.65;

      labelSurfaceRef.current.className = isSurf ? 'text-[#BFE272] font-bold' : 'text-[#5C7F68] font-medium';
      label30cmRef.current.className = is30 ? 'text-[#BFE272] font-bold' : 'text-[#5C7F68] font-medium';
      label75cmRef.current.className = is75 ? 'text-[#BFE272] font-bold' : 'text-[#5C7F68] font-medium';
    }

    // Update active stage ONLY when the stage actually changes
    let nextStage = 0;
    if (clamped <= 0.28) {
      nextStage = 1;
    } else if (clamped >= 0.35 && clamped <= 0.66) {
      nextStage = 2;
    } else if (clamped >= 0.74) {
      nextStage = 3;
    }

    if (nextStage !== activeStageRef.current) {
      activeStageRef.current = nextStage;
      setActiveStage(nextStage);
    }
  }, [renderFrame]);

  // Listen to Framer Motion scroll
  useMotionValueEvent(scrollYProgress, 'change', updateProgress);

  // Fallback native scroll listener to guarantee 60fps even if framer-motion has any timing issue
  useEffect(() => {
    const handleNativeScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScroll = rect.height - window.innerHeight;
      if (totalScroll <= 0) return;
      const progress = -rect.top / totalScroll;
      updateProgress(progress);
    };

    window.addEventListener('scroll', handleNativeScroll, { passive: true });
    handleNativeScroll();
    return () => window.removeEventListener('scroll', handleNativeScroll);
  }, [updateProgress]);

  return (
    <section ref={containerRef} className="relative w-full h-[320vh] bg-black">
      {/* Sticky Full-Screen Viewport Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-black">
        
        {/* Full-Screen Scrollytelling Canvas with Hardware Acceleration */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block select-none pointer-events-none"
          style={{
            imageRendering: '-webkit-optimize-contrast',
            transform: 'translateZ(0)',
            willChange: 'transform',
          }}
        />

        {/* Minimal Initial Loader */}
        <AnimatePresence>
          {!isReady && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
            >
              <div className="font-mono text-[11px] uppercase tracking-widest text-[#BFE272] mb-2 font-bold">
                Loading Soil Sequence
              </div>
              <div className="w-28 h-1 bg-stone-900 overflow-hidden relative rounded-full">
                <div 
                  className="h-full bg-[#BFE272] transition-all duration-200"
                  style={{ width: `${Math.max(5, loadedPercent)}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimalist Depth Meter Axis (Right Side) */}
        <div className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2 z-20 pointer-events-none hidden sm:flex flex-col items-end space-y-6 font-mono text-[11px]">
          <div className="flex items-center space-x-2">
            <span ref={labelSurfaceRef} className="text-[#B8791E] font-medium">Surface (0 cm)</span>
            <div className="w-2.5 h-[1px] bg-[#3E382E]" />
          </div>
          <div className="flex items-center space-x-2">
            <span ref={label30cmRef} className="text-[#8C8474] font-medium">Root Zone (-30 cm)</span>
            <div className="w-2.5 h-[1px] bg-[#3E382E]" />
          </div>
          <div className="flex items-center space-x-2">
            <span ref={label75cmRef} className="text-[#8C8474] font-medium">Subsoil (-75 cm)</span>
            <div className="w-2.5 h-[1px] bg-[#3E382E]" />
          </div>

          {/* Minimalist Progress Meter Bar */}
          <div className="w-1 h-20 bg-[#1A1813] relative mt-1 rounded-full overflow-hidden border border-[#3E382E]">
            <div 
              ref={meterBarRef}
              className="w-full bg-[#B8791E] transition-none rounded-full"
              style={{ height: '0%' }}
            />
          </div>
        </div>

        {/* ================= EDITORIAL STORY OVERLAYS (RESTRAINED, FRAUNCES + IBM PLEX MONO) ================= */}

        {/* STAGE 1: 0% – 28% (Top-Left Clean Editorial Card) */}
        <AnimatePresence>
          {activeStage === 1 && (
            <motion.div
              key="stage-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-20 sm:top-24 left-6 sm:left-12 max-w-sm sm:max-w-md z-20 pointer-events-auto"
            >
              <div className="p-6 sm:p-7 rounded-2xl bg-[#221F19]/95 border border-[#3E382E] text-[#F6F1E4] shadow-2xl">
                <span className="inline-block px-3 py-1 rounded-full bg-[#33512E] text-[#F6F1E4] text-[11px] font-mono tracking-wider uppercase mb-3">
                  01 · Living Surface (0 cm)
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-medium text-[#F6F1E4] tracking-tight mb-2">
                  The Root Horizon
                </h3>
                <p className="text-xs sm:text-sm text-[#D8D0BF] leading-relaxed font-sans font-normal">
                  Porous topsoil where beneficial microbes and feeder roots cycle phosphorus and nitrogen under balanced soil moisture.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STAGE 2: 35% – 66% (Top-Right Clean Editorial Card) */}
        <AnimatePresence>
          {activeStage === 2 && (
            <motion.div
              key="stage-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-20 sm:top-24 right-6 sm:right-12 max-w-sm sm:max-w-md z-20 pointer-events-auto text-left"
            >
              <div className="p-6 sm:p-7 rounded-2xl bg-[#221F19]/95 border border-[#9C4530]/60 text-[#F6F1E4] shadow-2xl">
                <span className="inline-block px-3 py-1 rounded-full bg-[#9C4530] text-[#F6F1E4] text-[11px] font-mono tracking-wider uppercase mb-3">
                  02 · Chemical Risk (-30 cm)
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-medium text-[#F6F1E4] tracking-tight mb-2">
                  Unabsorbed Hardpan
                </h3>
                <p className="text-xs sm:text-sm text-[#D8D0BF] leading-relaxed font-sans font-normal">
                  Excess synthetic urea acidifies soil carbon, creating dense compaction that halts root penetration and causes deep nitrate leaching.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STAGE 3: 75% – 100% (Bottom Clean Action Card) */}
        <AnimatePresence>
          {activeStage === 3 && (
            <motion.div
              key="stage-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-10 left-6 right-6 sm:left-12 sm:right-auto sm:max-w-md z-30 pointer-events-auto"
            >
              <div className="p-6 sm:p-7 rounded-2xl bg-[#221F19]/95 border border-[#3E382E] text-[#F6F1E4] shadow-2xl">
                <span className="inline-block px-3 py-1 rounded-full bg-[#B8791E] text-[#F6F1E4] text-[11px] font-mono tracking-wider uppercase mb-3">
                  03 · Calibrated Solution (-75 cm)
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-medium text-[#F6F1E4] tracking-tight mb-2">
                  Precision Uptake
                </h3>
                <p className="text-xs sm:text-sm text-[#D8D0BF] leading-relaxed mb-5 font-sans font-normal">
                  PAU split dosing delivers nutrients in sync with vegetative demand, allowing 60+ cm deep root penetration with zero wasted bags.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('formula-story');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 rounded-full bg-[#B8791E] hover:bg-[#9E6515] text-[#F6F1E4] font-medium font-sans text-xs tracking-wide transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    How Formula Works ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/dashboard');
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="px-4 py-2.5 rounded-full border border-[#DECFAF]/60 hover:border-[#F6F1E4] text-[#F6F1E4] text-xs font-sans font-medium tracking-wide transition-all active:scale-95 cursor-pointer"
                  >
                    Farmer Dashboard →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
