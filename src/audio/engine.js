// Simple pink-ish noise audio engine using Web Audio API
// Generates white noise, filters it to pink-ish, and provides safe parameter control

// Default parameters
const DEFAULT_GAIN = 0.18
const DEFAULT_CUTOFF_HZ = 1800
const MAX_GAIN = 0.3
const BUFFER_LENGTH = 2 // seconds
const SAMPLE_RATE = 44100
const DEFAULT_BREATH_HZ = 0.10
const BREATH_DEPTH = 0.05 // ±5% modulation

// Audio engine state
let audioContext = null
let bufferSource = null
let lowpassFilter = null
let tiltFilter = null
let masterGain = null
let visibilityGain = null  // Additional gain node for visibility scaling
let breathOscillator = null  // LFO oscillator for breathing
let breathModGain = null    // Gain node for breath modulation depth
let isRunning = false
let hasBeenStarted = false  // Prevent node recreation

// Create white noise buffer
function createWhiteNoiseBuffer(context) {
  const bufferLength = BUFFER_LENGTH * context.sampleRate
  const buffer = context.createBuffer(1, bufferLength, context.sampleRate)
  const data = buffer.getChannelData(0)
  
  // Generate white noise
  for (let i = 0; i < bufferLength; i++) {
    data[i] = Math.random() * 2 - 1
  }
  
  return buffer
}

// Create audio engine
export function createAudioEngine() {
  return {
    async start() {
      if (isRunning) {
        console.log('Audio engine already running')
        return
      }
      
      // Prevent node recreation if already started once
      if (hasBeenStarted) {
        console.log('Audio engine was already started, reusing existing nodes')
        isRunning = true
        return
      }
      
      try {
        // Check Web Audio API availability
        if (!window.AudioContext && !window.webkitAudioContext) {
          console.warn('Web Audio API not available - audio engine disabled')
          return
        }
        
        // Create AudioContext
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
        
        // Resume AudioContext if suspended (required for autoplay policy)
        if (audioContext.state === 'suspended') {
          await audioContext.resume()
          console.log('AudioContext resumed from suspended state')
        }
        
        // Create white noise buffer
        const whiteNoiseBuffer = createWhiteNoiseBuffer(audioContext)
        
        // Create buffer source (looped white noise)
        bufferSource = audioContext.createBufferSource()
        bufferSource.buffer = whiteNoiseBuffer
        bufferSource.loop = true
        
        // Create lowpass filter for pink-ish tilt
        lowpassFilter = audioContext.createBiquadFilter()
        lowpassFilter.type = 'lowpass'
        lowpassFilter.frequency.setValueAtTime(DEFAULT_CUTOFF_HZ, audioContext.currentTime)
        lowpassFilter.Q.setValueAtTime(1, audioContext.currentTime)
        
        // Optional gentle pink tilt with low shelf filter
        tiltFilter = audioContext.createBiquadFilter()
        tiltFilter.type = 'lowshelf'
        tiltFilter.frequency.setValueAtTime(300, audioContext.currentTime)
        tiltFilter.gain.setValueAtTime(-3, audioContext.currentTime) // Gentle pink tilt
        
        // Create master gain node
        masterGain = audioContext.createGain()
        masterGain.gain.setValueAtTime(DEFAULT_GAIN, audioContext.currentTime)
        
        // Create visibility gain node for tab switching
        visibilityGain = audioContext.createGain()
        visibilityGain.gain.setValueAtTime(1.0, audioContext.currentTime)
        
        // Create breathing LFO oscillator
        breathOscillator = audioContext.createOscillator()
        breathOscillator.type = 'sine'
        breathOscillator.frequency.setValueAtTime(DEFAULT_BREATH_HZ, audioContext.currentTime)
        
        // Create breath modulation gain node
        breathModGain = audioContext.createGain()
        breathModGain.gain.setValueAtTime(BREATH_DEPTH, audioContext.currentTime)
        
        // Connect breathing modulation to master gain
        breathOscillator.connect(breathModGain)
        breathModGain.connect(masterGain.gain)
        
        // Connect audio graph: BufferSource → TiltFilter → LowpassFilter → MasterGain → VisibilityGain → Destination
        bufferSource.connect(tiltFilter)
        tiltFilter.connect(lowpassFilter)
        lowpassFilter.connect(masterGain)
        masterGain.connect(visibilityGain)
        visibilityGain.connect(audioContext.destination)
        
        // Start the buffer source and breathing oscillator
        bufferSource.start()
        breathOscillator.start()
        
        isRunning = true
        hasBeenStarted = true
        console.log('Audio engine started')
        console.log('Audio context state:', audioContext.state)
        console.log('Master gain value:', masterGain.gain.value)
        console.log('Lowpass cutoff:', lowpassFilter.frequency.value)
        
      } catch (error) {
        console.error('Failed to start audio engine:', error)
        isRunning = false
      }
    },
    
    stop() {
      if (!isRunning) {
        console.log('Audio engine not running')
        return
      }
      
      try {
        // Stop buffer source
        if (bufferSource) {
          bufferSource.stop()
          bufferSource.disconnect()
          bufferSource = null
        }
        
        // Stop breathing oscillator
        if (breathOscillator) {
          breathOscillator.stop()
          breathOscillator.disconnect()
          breathOscillator = null
        }
        
        // Disconnect all nodes
        if (tiltFilter) {
          tiltFilter.disconnect()
          tiltFilter = null
        }
        
        if (lowpassFilter) {
          lowpassFilter.disconnect()
          lowpassFilter = null
        }
        
        if (masterGain) {
          masterGain.disconnect()
          masterGain = null
        }
        
        if (visibilityGain) {
          visibilityGain.disconnect()
          visibilityGain = null
        }
        
        if (breathModGain) {
          breathModGain.disconnect()
          breathModGain = null
        }
        
        // Close audio context
        if (audioContext) {
          audioContext.close()
          audioContext = null
        }
        
        isRunning = false
        console.log('Audio engine stopped')
        
      } catch (error) {
        console.error('Error stopping audio engine:', error)
      }
    },
    
    setParams(params) {
      if (!isRunning || !audioContext) {
        console.warn('Audio engine not running, cannot set parameters')
        return
      }
      
      const currentTime = audioContext.currentTime
      
      try {
        // Use custom ramp time if provided, otherwise default to 0.1s
        const rampTime = params.rampTime ? params.rampTime / 1000 : 0.1
        
        // Set master gain with strict safety cap (≤ 0.3)
        if (params.gain !== undefined) {
          const safeGain = Math.min(Math.max(params.gain, 0), MAX_GAIN)
          masterGain.gain.setTargetAtTime(safeGain, currentTime, rampTime)
        }
        
        // Set lowpass cutoff frequency with safety bounds
        if (params.cutoffHz !== undefined) {
          const safeCutoff = Math.min(Math.max(params.cutoffHz, 20), 20000)
          lowpassFilter.frequency.setTargetAtTime(safeCutoff, currentTime, rampTime)
        }
        
        // Set breath rate (LFO frequency) with safety bounds
        if (params.breathHz !== undefined) {
          const safeBreathHz = Math.min(Math.max(params.breathHz, 0.05), 0.2)
          breathOscillator.frequency.setTargetAtTime(safeBreathHz, currentTime, rampTime)
        }
        
        console.log('Audio parameters updated:', params)
        
      } catch (error) {
        console.error('Error setting audio parameters:', error)
      }
    },
    
    isRunning() {
      return isRunning
    },
    
    // Set visibility gain scalar (0.5 for hidden, 1.0 for visible)
    setVisibilityGain(scalar) {
      if (!isRunning || !visibilityGain) {
        console.warn('Audio engine not running, cannot set visibility gain')
        return
      }
      
      const currentTime = audioContext.currentTime
      const safeScalar = Math.min(Math.max(scalar, 0), 1)
      
      try {
        visibilityGain.gain.setTargetAtTime(safeScalar, currentTime, 0.1)
        console.log('Visibility gain set to:', safeScalar)
      } catch (error) {
        console.error('Error setting visibility gain:', error)
      }
    },
    
    // Get current visibility gain value
    getVisibilityGain() {
      return visibilityGain ? visibilityGain.gain.value : 1.0
    }
  }
}
