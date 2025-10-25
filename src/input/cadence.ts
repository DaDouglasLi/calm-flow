// Keystroke cadence analyzer
// Listens to global keydown events and publishes smoothed cadence metrics

import type { CadenceMetrics, CadenceUnsubscribe } from '../types.js'

// Constants
const RING_BUFFER_SIZE = 20
const WPM_WINDOW_MS = 10000 // 10 seconds
const CHARS_PER_WORD = 5
const EMA_ALPHA = 0.2
const MAX_PUBLISH_RATE_MS = 1000 / 30 // 30 Hz throttling

// Internal state
let isActive = false
let keydownListener: ((event: KeyboardEvent) => void) | null = null
let subscribers: Array<(metrics: CadenceMetrics) => void> = []
let lastPublishTime = 0

// Ring buffer for timestamps
const timestampBuffer: number[] = []
let bufferIndex = 0
let bufferCount = 0

// EMA state
let emaIkiMs: number | null = null

// Current metrics
let currentMetrics: CadenceMetrics = {
  lastIkiMs: null,
  emaIkiMs: null,
  wpm10s: 0,
  lastKeyAt: null
}

// Calculate WPM over rolling 10-second window
function calculateWPM(): number {
  const now = performance.now()
  const cutoffTime = now - WPM_WINDOW_MS
  
  // Count keys in the last 10 seconds
  let keyCount = 0
  for (let i = 0; i < bufferCount; i++) {
    const index = (bufferIndex - bufferCount + i + RING_BUFFER_SIZE) % RING_BUFFER_SIZE
    if (timestampBuffer[index] >= cutoffTime) {
      keyCount++
    }
  }
  
  // Convert to WPM: (keys / 5) * (60 / 10) = (keys / 5) * 6
  return (keyCount / CHARS_PER_WORD) * 6
}

// Calculate inter-key interval (IKI)
function calculateIKI(currentTime: number): number | null {
  if (bufferCount < 2) return null
  
  // Get the previous timestamp
  const prevIndex = (bufferIndex - 2 + RING_BUFFER_SIZE) % RING_BUFFER_SIZE
  const prevTime = timestampBuffer[prevIndex]
  
  return currentTime - prevTime
}

// Update EMA of IKI
function updateEMA(ikiMs: number): void {
  if (emaIkiMs === null) {
    emaIkiMs = ikiMs
  } else {
    emaIkiMs = EMA_ALPHA * ikiMs + (1 - EMA_ALPHA) * emaIkiMs
  }
}

// Publish metrics to subscribers (throttled to 30 Hz)
function publishMetrics(): void {
  const now = performance.now()
  
  // Throttle to max 30 Hz
  if (now - lastPublishTime < MAX_PUBLISH_RATE_MS) {
    return
  }
  
  lastPublishTime = now
  
  // Update WPM
  currentMetrics.wpm10s = calculateWPM()
  
  // Publish to all subscribers
  subscribers.forEach(handler => {
    try {
      handler(currentMetrics)
    } catch (error) {
      console.error('Error in cadence subscriber:', error)
    }
  })
}

// Handle keydown events
function handleKeydown(_event: KeyboardEvent): void {
  if (!isActive) return
  
  const now = performance.now()
  
  // Add timestamp to ring buffer
  timestampBuffer[bufferIndex] = now
  bufferIndex = (bufferIndex + 1) % RING_BUFFER_SIZE
  bufferCount = Math.min(bufferCount + 1, RING_BUFFER_SIZE)
  
  // Calculate IKI if we have at least 2 keys
  const ikiMs = calculateIKI(now)
  if (ikiMs !== null) {
    currentMetrics.lastIkiMs = ikiMs
    updateEMA(ikiMs)
    currentMetrics.emaIkiMs = emaIkiMs
  }
  
  currentMetrics.lastKeyAt = now
  
  // Publish metrics (throttled)
  publishMetrics()
}

// Start cadence analysis
export function startCadence(): {
  subscribe(handler: (metrics: CadenceMetrics) => void): CadenceUnsubscribe
  stop(): void
  getSnapshot(): CadenceMetrics
} {
  if (isActive) {
    throw new Error('Cadence analyzer is already running')
  }
  
  isActive = true
  
  // Reset state
  timestampBuffer.length = 0
  bufferIndex = 0
  bufferCount = 0
  emaIkiMs = null
  lastPublishTime = 0
  
  currentMetrics = {
    lastIkiMs: null,
    emaIkiMs: null,
    wpm10s: 0,
    lastKeyAt: null
  }
  
  // Set up keydown listener
  keydownListener = handleKeydown
  window.addEventListener('keydown', keydownListener, true)
  
  return {
    subscribe(handler: (metrics: CadenceMetrics) => void): CadenceUnsubscribe {
      subscribers.push(handler)
      
      // Return unsubscribe function
      return () => {
        const index = subscribers.indexOf(handler)
        if (index > -1) {
          subscribers.splice(index, 1)
        }
      }
    },
    
    stop(): void {
      if (!isActive) return
      
      isActive = false
      
      // Remove event listener
      if (keydownListener) {
        window.removeEventListener('keydown', keydownListener, true)
        keydownListener = null
      }
      
      // Clear subscribers
      subscribers.length = 0
      
      // Reset state
      timestampBuffer.length = 0
      bufferIndex = 0
      bufferCount = 0
      emaIkiMs = null
      lastPublishTime = 0
    },
    
    getSnapshot(): CadenceMetrics {
      return { ...currentMetrics }
    }
  }
}
