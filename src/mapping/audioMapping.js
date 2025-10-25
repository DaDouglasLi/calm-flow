// Audio parameter mapping from EMA IKI (inter-key interval)
// Maps typing speed to audio parameters with gentle ramps

// IKI range (ms): 80 = fast typing, 500 = slow/paused
const IKI_MIN = 80
const IKI_MAX = 500

// Audio parameter ranges
const GAIN_MIN = 0.18  // fast typing (lower volume)
const GAIN_MAX = 0.28  // slow typing (higher volume)
const CUTOFF_MIN = 800  // fast typing (darker/lower cutoff)
const CUTOFF_MAX = 2200 // slow typing (brighter/higher cutoff)
const BREATH_MIN = 0.07  // fast typing (slower breathing)
const BREATH_MAX = 0.12  // slow typing (faster breathing)

// Ramp timing (ms)
const ATTACK_TIME = 300
const RELEASE_TIME = 1500

// Last mapped values for smooth transitions
let lastGain = null
let lastCutoff = null

// Linear interpolation helper
function lerp(min, max, t) {
  return min + (max - min) * t
}

// Clamp value to range
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// Map IKI to normalized position [0, 1]
function mapIkiToNormalized(ikiMs) {
  // Clamp IKI to valid range
  const clampedIki = clamp(ikiMs, IKI_MIN, IKI_MAX)
  
  // Convert to normalized position (0 = fast, 1 = slow)
  return (clampedIki - IKI_MIN) / (IKI_MAX - IKI_MIN)
}

// Map normalized position to audio parameters
function mapToAudioParams(normalized) {
  // Linear mapping: 0 (fast) → min values, 1 (slow) → max values
  const gain = lerp(GAIN_MIN, GAIN_MAX, normalized)
  const cutoff = lerp(CUTOFF_MIN, CUTOFF_MAX, normalized)
  const breathHz = lerp(BREATH_MIN, BREATH_MAX, normalized)
  
  return { gain, cutoff, breathHz }
}

// Create ramp helper for smooth parameter changes
function createRampHelper(audioEngine, paramName, targetValue, currentValue) {
  if (currentValue === null) {
    // First value - set immediately
    return { [paramName]: targetValue }
  }
  
  const timeConstant = targetValue > currentValue ? ATTACK_TIME : RELEASE_TIME
  
  return {
    [paramName]: targetValue,
    rampTime: timeConstant
  }
}

// Main mapping function
export function mapIkiToAudioParams(ikiMs, audioEngine) {
  if (ikiMs === null || audioEngine === null) {
    return null
  }
  
  // Map IKI to normalized position
  const normalized = mapIkiToNormalized(ikiMs)
  
  // Map to audio parameters
  const { gain, cutoff, breathHz } = mapToAudioParams(normalized)
  
  // Create smooth ramps
  const gainRamp = createRampHelper(audioEngine, 'gain', gain, lastGain)
  const cutoffRamp = createRampHelper(audioEngine, 'cutoffHz', cutoff, lastCutoff)
  
  // Store last values for next ramp
  lastGain = gain
  lastCutoff = cutoff
  
  // Combine parameters
  const params = {
    gain: gainRamp.gain,
    cutoffHz: cutoffRamp.cutoffHz,
    breathHz: breathHz
  }
  
  // Add ramp timing if needed
  if (gainRamp.rampTime) {
    params.rampTime = gainRamp.rampTime
  }
  
  return params
}

// Reset mapping state (useful for cleanup)
export function resetMapping() {
  lastGain = null
  lastCutoff = null
}

// Get current mapping state for debugging
export function getMappingState() {
  return {
    lastGain,
    lastCutoff,
    ikiRange: { min: IKI_MIN, max: IKI_MAX },
    gainRange: { min: GAIN_MIN, max: GAIN_MAX },
    cutoffRange: { min: CUTOFF_MIN, max: CUTOFF_MAX },
    breathRange: { min: BREATH_MIN, max: BREATH_MAX }
  }
}
