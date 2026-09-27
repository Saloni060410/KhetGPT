/**
 * Utility to detect WebGL support, hardware capability, and user motion preferences
 * Ensures optimal performance and graceful degradation per NFR2 & project constraints.
 */

export function isWebGLAvailable() {
  if (typeof window === 'undefined' || !window.WebGLRenderingContext) {
    return false
  }
  try {
    const canvas = document.createElement('canvas')
    const ctx =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    return Boolean(ctx)
  } catch {
    return false
  }
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isLowEndDevice() {
  if (typeof navigator === 'undefined') {
    return false
  }
  const lowCores =
    typeof navigator.hardwareConcurrency === 'number' &&
    navigator.hardwareConcurrency <= 2

  const lowMemory =
    typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2

  return lowCores || lowMemory
}

export function canRun3DScene() {
  return isWebGLAvailable() && !prefersReducedMotion() && !isLowEndDevice()
}
