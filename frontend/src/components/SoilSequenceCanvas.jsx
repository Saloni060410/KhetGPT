import { useRef, useEffect, useState, useCallback } from 'react';

export default function SoilSequenceCanvas({ recoveryProgress = 0.72 }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef(new Array(241));
  const [loadPercent, setLoadPercent] = useState(0);
  const totalFrames = 240;

  const currentDrawnFrameRef = useRef(-1);
  const rafIdRef = useRef(null);
  const geometryRef = useRef({
    physW: 0,
    physH: 0,
    destX: 0,
    destY: 0,
    destW: 0,
    destH: 0,
  });

  // Zero-padded frame URL generator
  const getFrameUrl = useCallback((index) => {
    const padded = String(index).padStart(5, '0');
    return `/newanime/${padded}.jpg`;
  }, []);

  // Compute geometry strictly on resize, never in draw loop
  const updateGeometry = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.clientWidth || 800;
    const height = rect.height || canvas.clientHeight || 500;

    const physW = Math.round(width * dpr);
    const physH = Math.round(height * dpr);

    if (canvas.width !== physW || canvas.height !== physH) {
      canvas.width = physW;
      canvas.height = physH;
    }

    const ctx = canvas.getContext('2d', { alpha: false });
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }

    // Object-fit contain calculation with integer rounding
    const canvasAspect = physW / physH;
    const imgAspect = 1280 / 720;

    let destW, destH, destX, destY;
    if (canvasAspect > imgAspect) {
      destH = physH;
      destW = Math.round(destH * imgAspect);
      destX = Math.round((physW - destW) / 2);
      destY = 0;
    } else {
      destW = physW;
      destH = Math.round(destW / imgAspect);
      destX = 0;
      destY = Math.round((physH - destH) / 2);
    }

    geometryRef.current = { physW, physH, destX, destY, destW, destH };
  }, []);

  // Draw active frame with integer coordinates and bicubic smoothing
  const drawFrame = useCallback((targetIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const cache = imagesRef.current;
    let imgToDraw = cache[targetIndex];

    if (!imgToDraw) {
      // Outward search for nearest loaded keyframe
      for (let offset = 1; offset < 25; offset++) {
        if (targetIndex - offset >= 1 && cache[targetIndex - offset]) {
          imgToDraw = cache[targetIndex - offset];
          break;
        }
        if (targetIndex + offset <= totalFrames && cache[targetIndex + offset]) {
          imgToDraw = cache[targetIndex + offset];
          break;
        }
      }
    }

    if (!imgToDraw) return;

    const { physW, physH, destX, destY, destW, destH } = geometryRef.current;
    if (physW === 0 || physH === 0) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Black letterbox background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, physW, physH);

    // Render clean frame
    ctx.drawImage(imgToDraw, destX, destY, destW, destH);
    currentDrawnFrameRef.current = targetIndex;
  }, [totalFrames]);

  // Two-phase preloader with off-thread async decoding
  useEffect(() => {
    let isMounted = true;
    const cache = imagesRef.current;
    let count = 0;

    const loadSingleImage = (frameNum) => {
      if (cache[frameNum]) return Promise.resolve();
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
            // fallback
          }
          if (!isMounted) return resolve();
          cache[frameNum] = img;
          count++;

          if (frameNum === 1 || currentDrawnFrameRef.current === -1) {
            updateGeometry();
            drawFrame(1);
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
        img.src = getFrameUrl(frameNum);
        if (img.complete) {
          onFinish();
        }
      });
    };

    const loadBatch = async (indices, batchSize = 8) => {
      for (let i = 0; i < indices.length; i += batchSize) {
        if (!isMounted) break;
        const slice = indices.slice(i, i + batchSize);
        await Promise.all(slice.map(loadSingleImage));
        if (isMounted) {
          setLoadPercent(Math.round((count / totalFrames) * 100));
        }
      }
    };

    const runPipeline = async () => {
      // Phase 1: Keyframe priority (every 4th frame = 60 frames)
      const keyframes = [];
      for (let i = 1; i <= totalFrames; i += 4) {
        keyframes.push(i);
      }
      if (!keyframes.includes(totalFrames)) {
        keyframes.push(totalFrames);
      }
      await loadBatch(keyframes, 8);

      if (isMounted) {
        updateGeometry();
        const initialTarget = Math.min(totalFrames, Math.max(1, Math.round(recoveryProgress * (totalFrames - 1)) + 1));
        drawFrame(initialTarget);
      }

      // Phase 2: Backfill remaining in-between frames
      const remaining = [];
      for (let i = 1; i <= totalFrames; i++) {
        if (!cache[i]) remaining.push(i);
      }
      await loadBatch(remaining, 8);
    };

    runPipeline();

    return () => {
      isMounted = false;
    };
  }, [getFrameUrl, updateGeometry, drawFrame, totalFrames, recoveryProgress]);

  // Resize listener using ResizeObserver for responsive canvas updates
  useEffect(() => {
    updateGeometry();

    const canvas = canvasRef.current;
    if (!canvas) return;

    let resizeObserver = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateGeometry();
        if (currentDrawnFrameRef.current > 0) {
          drawFrame(currentDrawnFrameRef.current);
        }
      });
      resizeObserver.observe(canvas);
    }

    const handleWindowResize = () => {
      updateGeometry();
      if (currentDrawnFrameRef.current > 0) {
        drawFrame(currentDrawnFrameRef.current);
      }
    };

    window.addEventListener('resize', handleWindowResize, { passive: true });

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [updateGeometry, drawFrame]);

  // Scrub active frame whenever recoveryProgress changes (scheduled via RAF)
  useEffect(() => {
    const clampedProgress = Math.max(0.0, Math.min(1.0, recoveryProgress));
    const targetIndex = Math.min(totalFrames, Math.max(1, Math.round(clampedProgress * (totalFrames - 1)) + 1));

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      drawFrame(targetIndex);
    });

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [recoveryProgress, drawFrame, totalFrames]);

  const activeDisplayFrame = Math.min(
    totalFrames,
    Math.max(1, Math.round(Math.max(0, Math.min(1, recoveryProgress)) * (totalFrames - 1)) + 1)
  );

  return (
    <div className="w-full h-full relative select-none flex items-center justify-center bg-[#000000] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain cursor-ew-resize"
        style={{
          imageRendering: '-webkit-optimize-contrast',
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      />

      {/* Loading Progress Pill (only when initializing keyframe buffer) */}
      {loadPercent < 25 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mb-3" />
          <span className="text-xs font-mono text-emerald-400">
            Buffering Core Strata: {loadPercent}%
          </span>
          <span className="text-[10px] font-mono text-stone-500 mt-1">High-Resolution Sequence</span>
        </div>
      )}

      {/* Floating HUD Badges */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col space-y-1.5 z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#060a0d]/90 border border-white/10 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono font-medium text-emerald-400 tracking-wider uppercase">
            Photorealistic 240-Frame Soil Cutaway
          </span>
        </div>
        <div className="text-[10px] font-mono text-stone-400 pl-1">
          Frame: <span className="text-white font-bold">{activeDisplayFrame} / 240</span> • Buffer: <span className="text-emerald-400">{loadPercent}%</span>
        </div>
      </div>

      {/* Interactive Guide Hint */}
      <div className="absolute bottom-4 right-4 pointer-events-none z-10">
        <div className="px-3 py-1.5 rounded-lg bg-[#060a0d]/90 border border-white/10 text-[10px] font-mono text-stone-400 flex items-center space-x-1.5 shadow-lg">
          <span>Scrub timeline below to inspect subsurface profile</span>
        </div>
      </div>
    </div>
  );
}
