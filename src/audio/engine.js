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
let userBufferSource = null  // User file source
let pinkNoiseGenerator = null  // Pink noise generator for user audio
let rhythmAnalyzer = null    // Analyzer for user audio rhythm
let lowpassFilter = null
let tiltFilter = null
let masterGain = null
let visibilityGain = null  // Additional gain node for visibility scaling
let breathOscillator = null  // LFO oscillator for breathing
let breathModGain = null    // Gain node for breath modulation depth
let rhythmModGain = null    // Gain node for rhythm modulation
let isRunning = false
let hasBeenStarted = false  // Prevent node recreation
let currentSource = 'noise'  // 'noise' or 'user'

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

// Analyze user audio for rhythm and dynamics
function analyzeUserAudio(audioBuffer) {
  const data = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  const length = data.length
  
  // Calculate RMS (Root Mean Square) for dynamics
  let rmsSum = 0
  for (let i = 0; i < length; i++) {
    rmsSum += data[i] * data[i]
  }
  const rms = Math.sqrt(rmsSum / length)
  
  // Simple beat detection using energy peaks
  const windowSize = Math.floor(sampleRate * 0.1) // 100ms windows
  const energyWindows = []
  
  for (let i = 0; i < length - windowSize; i += windowSize) {
    let energy = 0
    for (let j = i; j < i + windowSize; j++) {
      energy += data[j] * data[j]
    }
    energyWindows.push(energy / windowSize)
  }
  
  // Find peaks (potential beats)
  const threshold = rms * 0.5
  const beats = []
  for (let i = 1; i < energyWindows.length - 1; i++) {
    if (energyWindows[i] > threshold && 
        energyWindows[i] > energyWindows[i-1] && 
        energyWindows[i] > energyWindows[i+1]) {
      beats.push(i * windowSize / sampleRate) // Convert to seconds
    }
  }
  
  // Calculate average tempo
  let tempo = 120 // default BPM
  if (beats.length > 1) {
    const intervals = []
    for (let i = 1; i < beats.length; i++) {
      intervals.push(beats[i] - beats[i-1])
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    tempo = 60 / avgInterval
  }
  
  return {
    rms: rms,
    tempo: Math.min(Math.max(tempo, 60), 180), // Clamp to reasonable range
    beats: beats,
    energyWindows: energyWindows
  }
}

// Create pink noise generator with rhythm
function createPinkNoiseGenerator(context, rhythmData) {
  const bufferLength = context.sampleRate * 4 // 4 seconds
  const buffer = context.createBuffer(1, bufferLength, context.sampleRate)
  const data = buffer.getChannelData(0)
  
  // Pink noise generation (1/f noise)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  
  for (let i = 0; i < bufferLength; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.86650 * b3 + white * 0.3104856
    b4 = 0.55000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 + white * 0.0168980
    
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
    b6 = white * 0.115926
    
    // Apply rhythm modulation
    const time = i / context.sampleRate
    const rhythmMod = Math.sin(time * (rhythmData.tempo / 60) * 2 * Math.PI) * 0.3 + 0.7
    data[i] = pink * rhythmMod * 0.1 // Scale down for safety
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
        
        // Force start audio immediately - no user gesture required
        if (audioContext.state === 'running') {
          console.log('AudioContext is running - starting audio immediately')
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
        
        // Create rhythm modulation gain node
        rhythmModGain = audioContext.createGain()
        rhythmModGain.gain.setValueAtTime(0, audioContext.currentTime)
        
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
        
        // Stop user buffer source
        if (userBufferSource) {
          userBufferSource.stop()
          userBufferSource.disconnect()
          userBufferSource = null
        }
        
        // Stop rhythm analyzer
        if (rhythmAnalyzer) {
          rhythmAnalyzer.stop()
          rhythmAnalyzer.disconnect()
          rhythmAnalyzer = null
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
    },
    
    // Get audio context (for decoding)
    get audioContext() {
      return audioContext
    },
    
    // Switch back to internal noise source
    async useNoiseSource() {
      if (!isRunning || !audioContext) {
        console.warn('Audio engine not running, cannot switch sources')
        return
      }
      
      try {
        // Stop and disconnect current source
        if (currentSource === 'user' && userBufferSource) {
          userBufferSource.stop()
          userBufferSource.disconnect()
          userBufferSource = null
        }
        
        // Create and start noise source if not already running
        if (!bufferSource) {
          const whiteNoiseBuffer = createWhiteNoiseBuffer(audioContext)
          bufferSource = audioContext.createBufferSource()
          bufferSource.buffer = whiteNoiseBuffer
          bufferSource.loop = true
          bufferSource.connect(tiltFilter)
          bufferSource.start()
        }
        
        currentSource = 'noise'
        console.log('Switched to noise source')
        
      } catch (error) {
        console.error('Error switching to noise source:', error)
      }
    },
    
    // Switch to user audio buffer - convert to pink noise with rhythm
    async useUserBuffer(audioBuffer) {
      if (!isRunning || !audioContext) {
        console.warn('Audio engine not running, cannot switch sources')
        return
      }
      
      try {
        // Stop and disconnect current source
        if (currentSource === 'noise' && bufferSource) {
          bufferSource.stop()
          bufferSource.disconnect()
          bufferSource = null
        } else if (currentSource === 'user' && userBufferSource) {
          userBufferSource.stop()
          userBufferSource.disconnect()
          userBufferSource = null
        }
        
        // Analyze user audio for rhythm and dynamics
        console.log('Analyzing user audio for rhythm...')
        const rhythmData = analyzeUserAudio(audioBuffer)
        console.log('Rhythm analysis:', {
          tempo: rhythmData.tempo.toFixed(1) + ' BPM',
          rms: rhythmData.rms.toFixed(3),
          beats: rhythmData.beats.length
        })
        
        // Create pink noise generator with rhythm
        const pinkNoiseBuffer = createPinkNoiseGenerator(audioContext, rhythmData)
        
        // Create new pink noise source
        userBufferSource = audioContext.createBufferSource()
        userBufferSource.buffer = pinkNoiseBuffer
        userBufferSource.loop = true
        userBufferSource.connect(tiltFilter)
        userBufferSource.start()
        
        // Set up rhythm modulation
        const rhythmOscillator = audioContext.createOscillator()
        rhythmOscillator.type = 'sine'
        rhythmOscillator.frequency.setValueAtTime(rhythmData.tempo / 60, audioContext.currentTime)
        
        const rhythmGain = audioContext.createGain()
        rhythmGain.gain.setValueAtTime(0.2, audioContext.currentTime) // Moderate rhythm modulation
        
        rhythmOscillator.connect(rhythmGain)
        rhythmGain.connect(rhythmModGain)
        rhythmOscillator.start()
        
        // Store references for cleanup
        rhythmAnalyzer = rhythmOscillator
        
        currentSource = 'user'
        console.log('Switched to pink noise with rhythm from user audio')
        
      } catch (error) {
        console.error('Error switching to user buffer:', error)
        // Fallback to noise source
        await this.useNoiseSource()
      }
    }
  }
}
