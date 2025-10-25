// Plain JavaScript app entry point
// Demo wiring for cadence analyzer and audio engine - no UI elements

import { startCadence, stopCadence } from './input/cadence.js'
import { createAudioEngine } from './audio/engine.js'
import { mapIkiToAudioParams, resetMapping } from './mapping/audioMapping.js'

// Application configuration
const config = {
  name: 'calm-flow',
  version: '1.0.0'
}

// Audio engine instance
let audioEngine = null
let hasStartedAudio = false

// Bootstrap function
function bootstrap() {
  console.log(`Starting ${config.name} v${config.version}`)
  
  // Initialize application components
  initializeApp()
}

// Initialize application components
function initializeApp() {
  // Set up event listeners
  setupEventListeners()
  
  // Start cadence analyzer
  startCadenceAnalyzer()
  
  // Prepare audio engine and try to start immediately
  prepareAudioEngine()
  tryStartAudioImmediately()
}

// Set up event listeners
function setupEventListeners() {
  // Listen for cadence update events
  document.addEventListener('cadence:update', handleCadenceUpdate)
  
  // Set up one-time user interaction listeners for audio autoplay
  setupAudioAutoplayListeners()
  
  // Handle visibility changes for tab switching
  setupVisibilityHandling()
  
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
  
  // Map IKI to audio parameters
  if (emaIkiMs !== null && audioEngine && audioEngine.isRunning()) {
    const mappedParams = mapIkiToAudioParams(emaIkiMs, audioEngine)
    
    if (mappedParams) {
      console.log('Mapping IKI to audio params:', {
        ikiMs: emaIkiMs.toFixed(1),
        gain: mappedParams.gain.toFixed(3),
        cutoffHz: mappedParams.cutoffHz.toFixed(0),
        breathHz: mappedParams.breathHz.toFixed(3)
      })
      
      // Apply mapped parameters to audio engine
      audioEngine.setParams(mappedParams)
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

// Try to start audio immediately on page load
async function tryStartAudioImmediately() {
  if (hasStartedAudio) return
  
  try {
    console.log('Attempting to start audio immediately...')
    await audioEngine.start()
    hasStartedAudio = true
    console.log('Audio started successfully on page load!')
  } catch (error) {
    console.log('Immediate audio start failed, will wait for user interaction:', error.message)
    // Fall back to user interaction if immediate start fails
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
    
    // Reset mapping state
    resetMapping()
    
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
