/**
 * Visual parameter mapping from cadence to visual parameters
 * Maps IKI (inter-key interval) to visual scene parameters
 */

// Mapping constants
const IKI_MIN = 80  // Fast typing (ms)
const IKI_MAX = 500 // Slow typing (ms)

// Visual parameter ranges
const SPEED_MIN = 0.07  // Fast typing
const SPEED_MAX = 0.12  // Slow typing
const DETAIL_MIN = 0.6   // Fast typing
const DETAIL_MAX = 1.0   // Slow typing (capped at 1.0)
const SATURATION_MIN = 0.6 // Fast typing
const SATURATION_MAX = 0.8 // Slow typing

// Smoothing parameters
const ATTACK_TIME = 300  // ms
const RELEASE_TIME = 1500 // ms

// State for smoothing
let lastSpeed = null
let lastDetail = null
let lastSaturation = null

/**
 * Clamp IKI to valid range and normalize to 0-1
 */
function mapIkiToNormalized(ikiMs) {
  if (ikiMs === null || ikiMs === undefined) return null
  
  // Clamp to valid range
  const clampedIki = Math.min(Math.max(ikiMs, IKI_MIN), IKI_MAX)
  
  // Normalize to 0-1 (0 = fast, 1 = slow)
  return (clampedIki - IKI_MIN) / (IKI_MAX - IKI_MIN)
}

/**
 * Map normalized IKI to visual parameters
 */
function mapToVisualParams(normalized) {
  if (normalized === null) return null
  
  // Linear interpolation
  const speed = SPEED_MIN + (SPEED_MAX - SPEED_MIN) * normalized
  const detail = DETAIL_MIN + (DETAIL_MAX - DETAIL_MIN) * normalized
  const saturation = SATURATION_MIN + (SATURATION_MAX - SATURATION_MIN) * normalized
  
  return {
    speed: Math.min(speed, SPEED_MAX),
    detail: Math.min(detail, DETAIL_MAX),
    saturation: Math.min(saturation, SATURATION_MAX)
  }
}

/**
 * Create smooth ramp helper for visual parameters
 */
function createRampHelper(scene, paramName, targetValue, currentValue) {
  if (currentValue === null) {
    // Immediate set for first value
    return targetValue
  }
  
  // Use smooth interpolation for subsequent values
  const time = Date.now()
  const rampTime = targetValue > currentValue ? ATTACK_TIME : RELEASE_TIME
  
  // Simple exponential approach
  const alpha = 1 - Math.exp(-time / rampTime)
  return currentValue + (targetValue - currentValue) * alpha
}

/**
 * Main mapping function - maps IKI to visual parameters
 */
export function mapIkiToVisualParams(ikiMs, scene) {
  if (!scene) {
    console.warn('Visual scene not available for mapping')
    return null
  }
  
  const normalized = mapIkiToNormalized(ikiMs)
  if (normalized === null) return null
  
  const mapped = mapToVisualParams(normalized)
  if (!mapped) return null
  
  // Apply smoothing
  const smoothedSpeed = createRampHelper(scene, 'speed', mapped.speed, lastSpeed)
  const smoothedDetail = createRampHelper(scene, 'detail', mapped.detail, lastDetail)
  const smoothedSaturation = createRampHelper(scene, 'saturation', mapped.saturation, lastSaturation)
  
  // Update state
  lastSpeed = smoothedSpeed
  lastDetail = smoothedDetail
  lastSaturation = smoothedSaturation
  
  const result = {
    speed: smoothedSpeed,
    detail: smoothedDetail,
    saturation: smoothedSaturation
  }
  
  console.log('Visual mapping:', {
    ikiMs: ikiMs?.toFixed(1),
    normalized: normalized?.toFixed(3),
    speed: smoothedSpeed.toFixed(3),
    detail: smoothedDetail.toFixed(3),
    saturation: smoothedSaturation.toFixed(3)
  })
  
  return result
}

/**
 * Reset mapping state
 */
export function resetVisualMapping() {
  lastSpeed = null
  lastDetail = null
  lastSaturation = null
  console.log('Visual mapping reset')
}

/**
 * Get current mapping state for debugging
 */
export function getVisualMappingState() {
  return {
    lastSpeed,
    lastDetail,
    lastSaturation
  }
}
