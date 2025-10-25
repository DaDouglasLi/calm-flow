// Plain JavaScript app entry point
// Demo wiring for cadence analyzer and audio engine - no UI elements

import { startCadence, stopCadence } from './input/cadence.js'
import { createAudioEngine } from './audio/engine.js'
import { mapIkiToAudioParams, resetMapping } from './mapping/audioMapping.js'
import { mapIkiToVisualParams, resetVisualMapping } from './mapping/visualMapping.js'
import { mount as mountVisualScene } from './visual/scene.js'
import { initTabs, updateStatus, hideFileInput, showFileInput } from './ui/tabs.js'
import { initIntensity, getIntensity } from './ui/intensity.js'

// Application configuration
const config = {
  name: 'calm-flow',
  version: '1.0.0'
}

// DEV mode for instrumentation
const DEV = true // Set to false for production

// Audio engine instance
let audioEngine = null
let visualScene = null
let hasStartedAudio = false

// DEV instrumentation
let devCadenceReceived = false
let devAudioStartResult = null
let devMotionTestBuffer = null

// Bootstrap function
function bootstrap() {
  console.log(`Starting ${config.name} v${config.version}`)
  
  // Initialize application components
  initializeApp()
}

// Initialize application components
function initializeApp() {
  // Initialize tabs
  initTabs()
  
  // Initialize intensity slider
  initIntensity()
  
  // Mount visual scene
  const canvas = document.getElementById('scene')
  if (canvas) {
    visualScene = mountVisualScene(canvas)
    console.log('Visual scene mounted')
    
    // Hide start button after successful mount
    const startButton = document.getElementById('start-button')
    if (startButton) {
      startButton.classList.add('hidden')
    }
    
    // DEV: Start motion test
    if (DEV) {
      devMotionTest()
    }
  } else {
    console.warn('Canvas element not found')
  }
  
  // Set up event listeners
  setupEventListeners()
  
  // Start cadence analyzer
  startCadenceAnalyzer()
  
  // Prepare audio engine and try to start immediately
  prepareAudioEngine()
  tryStartAudioImmediately()
  
  // DEV: Start sanity checks
  if (DEV) {
    devSanityChecks()
  }
}

// Set up event listeners
function setupEventListeners() {
  // Listen for cadence update events
  document.addEventListener('cadence:update', handleCadenceUpdate)
  
  // Set up one-time user interaction listeners for audio autoplay
  setupAudioAutoplayListeners()
  
  // Handle visibility changes for tab switching
  setupVisibilityHandling()
  
  // Handle file upload events
  document.addEventListener('ui:file-selected', handleFileSelected)
  document.addEventListener('ui:reset-to-noise', handleResetToNoise)
  
  // Handle intensity slider
  document.addEventListener('ui:intensity', handleIntensityChange)
  
  // Handle start button
  const startButton = document.getElementById('start-button')
  if (startButton) {
    startButton.addEventListener('click', handleStartButton)
  }
  
  // Handle page unload for cleanup (multiple events for safety)
  window.addEventListener('beforeunload', cleanup)
  window.addEventListener('unload', cleanup)
  window.addEventListener('pagehide', cleanup)
}

// Handle cadence update events
function handleCadenceUpdate(event) {
  const { lastIkiMs, emaIkiMs, lastKeyAt } = event.detail
  
  // Log metrics to console
  console.log('Cadence Update:', {
    lastIkiMs: lastIkiMs !== null ? `${lastIkiMs.toFixed(1)}ms` : 'N/A',
    emaIkiMs: emaIkiMs !== null ? `${emaIkiMs.toFixed(1)}ms` : 'N/A',
    lastKeyAt: lastKeyAt !== null ? new Date(lastKeyAt).toLocaleTimeString() : 'N/A'
  })
  
  // DEV: Mark cadence as received
  if (DEV) {
    devCadenceReceived = true
  }
  
  // Map IKI to parameters and blend with intensity
  if (emaIkiMs !== null) {
    const intensity = getIntensity()
    
    // Baseline midpoints for blending
    const baselineAudio = { gain: 0.23, cutoffHz: 1500, breathHz: 0.095 }
    const baselineVisual = { speed: 0.095, detail: 0.8, saturation: 0.7, palette: 'day' }
    
    // Get mapped parameters
    const mappedAudioParams = audioEngine ? mapIkiToAudioParams(emaIkiMs, audioEngine) : null
    const mappedVisualParams = visualScene ? mapIkiToVisualParams(emaIkiMs, visualScene) : null
    
    // Blend with intensity: out = mix(baseline, mapped, intensity)
    if (mappedAudioParams && audioEngine && audioEngine.isRunning()) {
      const blendedAudio = {
        gain: baselineAudio.gain + (mappedAudioParams.gain - baselineAudio.gain) * intensity,
        cutoffHz: baselineAudio.cutoffHz + (mappedAudioParams.cutoffHz - baselineAudio.cutoffHz) * intensity,
        breathHz: baselineAudio.breathHz + (mappedAudioParams.breathHz - baselineAudio.breathHz) * intensity
      }
      audioEngine.setParams(blendedAudio)
      console.log('Audio parameters updated:', blendedAudio)
    }
    
    if (mappedVisualParams && visualScene) {
      const blendedVisual = {
        speed: baselineVisual.speed + (mappedVisualParams.speed - baselineVisual.speed) * intensity,
        detail: baselineVisual.detail + (mappedVisualParams.detail - baselineVisual.detail) * intensity,
        saturation: baselineVisual.saturation + (mappedVisualParams.saturation - baselineVisual.saturation) * intensity,
        palette: mappedVisualParams.palette // Keep palette as-is
      }
      visualScene.setParams(blendedVisual)
      console.log('Visual parameters updated:', blendedVisual)
    }
  }
}

// Start cadence analyzer
function startCadenceAnalyzer() {
  try {
    startCadence()
    console.log('Cadence analyzer started - start typing to see metrics!')
  } catch (error) {
    console.error('Failed to start cadence analyzer:', error)
  }
}

// Prepare audio engine (but don't start)
function prepareAudioEngine() {
  audioEngine = createAudioEngine()
  console.log('Audio engine prepared')
}

// Start audio immediately on page load - no user gesture required
async function tryStartAudioImmediately() {
  if (hasStartedAudio) return
  
  try {
    console.log('Starting audio immediately on page load...')
    await audioEngine.start()
    hasStartedAudio = true
    console.log('Audio started successfully on page load!')
    
    // DEV: Log audio start result
    if (DEV) {
      devAudioStartResult = 'immediate'
      updateStatusChip('calm-flow · visuals running · audio playing')
    }
  } catch (error) {
    console.error('Failed to start audio on page load:', error)
    
    // DEV: Log fallback needed
    if (DEV) {
      devAudioStartResult = 'fallback_needed'
      updateStatusChip('calm-flow · visuals running · audio ready')
    }
    
    // Audio will start on first user interaction as fallback
  }
}

// Set up one-time user interaction listeners for audio autoplay
function setupAudioAutoplayListeners() {
  const startAudioOnInteraction = async (event) => {
    if (hasStartedAudio) return
    
    hasStartedAudio = true
    console.log('First user interaction detected:', event.type, 'starting audio...')
    
    // Start audio engine
    if (audioEngine) {
      try {
        await audioEngine.start()
        console.log('Audio started successfully after user interaction!')
      } catch (error) {
        console.error('Failed to start audio after user interaction:', error)
      }
    } else {
      console.error('Audio engine not available!')
    }
    
    // Remove all listeners after first interaction
    document.removeEventListener('keydown', startAudioOnInteraction)
    document.removeEventListener('pointerdown', startAudioOnInteraction)
    document.removeEventListener('pointermove', startAudioOnInteraction)
    document.removeEventListener('touchstart', startAudioOnInteraction)
  }
  
  // Add one-time listeners for various user interactions
  document.addEventListener('keydown', startAudioOnInteraction, { once: true })
  document.addEventListener('pointerdown', startAudioOnInteraction, { once: true })
  document.addEventListener('pointermove', startAudioOnInteraction, { once: true })
  document.addEventListener('touchstart', startAudioOnInteraction, { once: true })
  
  console.log('Audio autoplay listeners set up')
}

// Set up visibility handling for tab switching
function setupVisibilityHandling() {
  document.addEventListener('visibilitychange', () => {
    if (!audioEngine || !audioEngine.isRunning()) {
      return
    }
    
    if (document.hidden) {
      // Tab is hidden - reduce volume by ~6dB (0.5 scalar)
      audioEngine.setVisibilityGain(0.5)
      console.log('Tab hidden - reducing audio volume')
    } else {
      // Tab is visible - restore full volume
      audioEngine.setVisibilityGain(1.0)
      console.log('Tab visible - restoring audio volume')
    }
  })
  
  console.log('Visibility handling set up')
}

// Handle file selection
async function handleFileSelected(event) {
  const file = event.detail
  
  try {
    updateStatus('Decoding...')
    
    // Ensure audio engine is running
    if (!audioEngine || !audioEngine.isRunning()) {
      await audioEngine.start()
    }
    
    // Decode audio file
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioEngine.audioContext.decodeAudioData(arrayBuffer)
    
    // Switch to user buffer
    await audioEngine.useUserBuffer(audioBuffer)
    
    updateStatus('Playing pink noise with rhythm from your audio')
    hideFileInput()
    
    // Auto-close panel after 3 seconds
    setTimeout(() => {
      const uploadPanel = document.getElementById('upload-panel')
      if (uploadPanel && uploadPanel.classList.contains('active')) {
        uploadPanel.classList.remove('active')
        document.getElementById('upload-tab').classList.remove('active')
      }
    }, 3000)
    
  } catch (error) {
    console.error('Error loading audio file:', error)
    updateStatus('Error: Could not load file')
    showFileInput()
  }
}

// Handle reset to noise
async function handleResetToNoise() {
  try {
    if (audioEngine && audioEngine.isRunning()) {
      await audioEngine.useNoiseSource()
      updateStatus('Playing built-in noise')
      showFileInput()
    }
  } catch (error) {
    console.error('Error resetting to noise:', error)
    updateStatus('Error: Could not reset')
  }
}

// Handle start button click
function handleStartButton() {
  try {
    // Try to start audio if not already running
    if (audioEngine && !audioEngine.isRunning()) {
      audioEngine.start()
      console.log('Audio started via start button')
    }
    
    // Hide the start button
    const startButton = document.getElementById('start-button')
    if (startButton) {
      startButton.classList.add('hidden')
    }
    
    console.log('Application started via start button')
  } catch (error) {
    console.error('Error starting via button:', error)
  }
}

// Handle intensity slider change
function handleIntensityChange(event) {
  const intensity = event.detail.value
  console.log('Intensity changed to:', intensity)
  
  // The intensity is already applied in the cadence update handler
  // This just logs the change for debugging
}

// Update status chip
function updateStatusChip(text) {
  const statusChip = document.getElementById('status-chip')
  if (statusChip) {
    statusChip.textContent = text
  }
}

// DEV: Motion test to verify visual movement
function devMotionTest() {
  if (!DEV || !visualScene) return
  
  setTimeout(() => {
    if (visualScene && visualScene.offscreenCanvas) {
      const ctx = visualScene.offscreenCtx
      const width = visualScene.offscreenCanvas.width
      const height = visualScene.offscreenCanvas.height
      
      // Sample a pixel from the offscreen buffer
      const imageData1 = ctx.getImageData(width/2, height/2, 1, 1)
      const pixel1 = imageData1.data[0] // Red channel
      
      setTimeout(() => {
        const imageData2 = ctx.getImageData(width/2, height/2, 1, 1)
        const pixel2 = imageData2.data[0] // Red channel
        
        const motionDetected = Math.abs(pixel1 - pixel2) > 5
        console.log('DEV Motion Test:', {
          pixel1, pixel2, 
          motionDetected,
          result: motionDetected ? 'PASS' : 'FAIL'
        })
        
        if (!motionDetected) {
          console.warn('DEV: Visual motion not detected - check animation loop')
        }
      }, 1000)
    }
  }, 3000)
}

// DEV: Automated sanity checks
function devSanityChecks() {
  if (!DEV) return
  
  setTimeout(() => {
    console.log('DEV Sanity Checks:', {
      cadenceReceived: devCadenceReceived,
      audioStartResult: devAudioStartResult,
      visualSceneMounted: !!visualScene,
      audioEngineReady: !!audioEngine
    })
    
    // Assertions
    if (!devCadenceReceived) {
      console.warn('DEV: No cadence events received - check keystroke detection')
    }
    
    if (!devAudioStartResult) {
      console.warn('DEV: Audio start not attempted - check initialization')
    }
    
    if (!visualScene) {
      console.warn('DEV: Visual scene not mounted - check canvas element')
    }
    
    if (!audioEngine) {
      console.warn('DEV: Audio engine not created - check initialization')
    }
  }, 5000)
}

// Cleanup function - idempotent and safe
function cleanup() {
  try {
    // Stop cadence analyzer
    stopCadence()
    
    // Stop audio engine safely
    if (audioEngine) {
      audioEngine.stop()
      audioEngine = null
    }
    
    // Dispose visual scene
    if (visualScene) {
      visualScene.dispose()
      visualScene = null
    }
    
    // Reset mapping state
    resetMapping()
    resetVisualMapping()
    
    console.log('Application cleanup completed')
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
}

// Export for use in main.js
export { bootstrap, config }

// Auto-bootstrap when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap)
} else {
  bootstrap()
}
