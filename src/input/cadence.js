// Plain JavaScript keystroke cadence analyzer
// Listens to global keydown events and publishes smoothed cadence metrics

// Constants
const RING_BUFFER_SIZE = 20
const EMA_ALPHA = 0.2
const MAX_PUBLISH_RATE_MS = 1000 / 30 // 30 Hz throttling

// Internal state
let isActive = false
let keydownListener = null
let lastPublishTime = 0

// Ring buffer for timestamps
const timestampBuffer = []
let bufferIndex = 0
let bufferCount = 0

// EMA state
let emaIkiMs = null

// Current metrics
let currentMetrics = {
  lastIkiMs: null,
  emaIkiMs: null,
  lastKeyAt: null
}

// Calculate inter-key interval (IKI)
function calculateIKI(currentTime) {
  if (bufferCount < 2) return null
  
  // Get the previous timestamp
  const prevIndex = (bufferIndex - 2 + RING_BUFFER_SIZE) % RING_BUFFER_SIZE
  const prevTime = timestampBuffer[prevIndex]
  
  return currentTime - prevTime
}

// Update EMA of IKI
function updateEMA(ikiMs) {
  if (emaIkiMs === null) {
    emaIkiMs = ikiMs
  } else {
    emaIkiMs = EMA_ALPHA * ikiMs + (1 - EMA_ALPHA) * emaIkiMs
  }
}

// Publish metrics via CustomEvent (throttled to 30 Hz)
function publishMetrics() {
  const now = performance.now()
  
  // Throttle to max 30 Hz
  if (now - lastPublishTime < MAX_PUBLISH_RATE_MS) {
    return
  }
  
  lastPublishTime = now
  
  // Dispatch custom event
  const event = new CustomEvent('cadence:update', {
    detail: {
      lastIkiMs: currentMetrics.lastIkiMs,
      emaIkiMs: currentMetrics.emaIkiMs,
      lastKeyAt: currentMetrics.lastKeyAt
    }
  })
  
  document.dispatchEvent(event)
}

// Handle keydown events (both local and global)
function handleKeydown(event) {
  if (!isActive) return
  
  const now = performance.now()
  
  // Debug: Log when keystrokes are detected (including when tab is hidden)
  console.log('Keystroke detected:', {
    key: event.key,
    tabHidden: document.hidden,
    timestamp: now
  })
  
  processKeystroke(now)
}

// Handle global keystrokes from Electron main process
function handleGlobalKeystroke(event, data) {
  if (!isActive) return
  
  const now = performance.now()
  
  // Debug: Log when global keystrokes are detected
  console.log('Global keystroke detected:', {
    key: data.key,
    appHidden: data.appHidden,
    timestamp: now
  })
  
  processKeystroke(now)
}

// Process keystroke data (shared by both local and global handlers)
function processKeystroke(timestamp) {
  // Add timestamp to ring buffer
  timestampBuffer[bufferIndex] = timestamp
  bufferIndex = (bufferIndex + 1) % RING_BUFFER_SIZE
  bufferCount = Math.min(bufferCount + 1, RING_BUFFER_SIZE)
  
  // Calculate IKI if we have at least 2 keys
  const ikiMs = calculateIKI(timestamp)
  if (ikiMs !== null) {
    currentMetrics.lastIkiMs = ikiMs
    updateEMA(ikiMs)
    currentMetrics.emaIkiMs = emaIkiMs
  }
  
  currentMetrics.lastKeyAt = timestamp
  
  // Publish metrics (throttled) - works even when tab is hidden
  publishMetrics()
}

// Start cadence analysis
export function startCadence() {
  if (isActive) {
    console.warn('Cadence analyzer is already running')
    return
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
    lastKeyAt: null
  }
  
  // Set up keydown listener with capture mode (works even when tab is hidden)
  keydownListener = handleKeydown
  window.addEventListener('keydown', keydownListener, true)
  
  // Set up global keystroke listener for Electron (works when app is hidden)
  if (window.electronAPI && window.electronAPI.onGlobalKeystroke) {
    window.electronAPI.onGlobalKeystroke(handleGlobalKeystroke)
    console.log('Global keystroke listener registered')
  }
  
  console.log('Cadence analyzer started')
}

// Stop cadence analysis
export function stopCadence() {
  if (!isActive) {
    console.warn('Cadence analyzer is not running')
    return
  }
  
  isActive = false
  
  // Remove event listener
  if (keydownListener) {
    window.removeEventListener('keydown', keydownListener, true)
    keydownListener = null
  }
  
  // Remove global keystroke listener
  if (window.electronAPI && window.electronAPI.removeAllListeners) {
    window.electronAPI.removeAllListeners('global-keystroke')
    console.log('Global keystroke listener removed')
  }
  
  // Reset state
  timestampBuffer.length = 0
  bufferIndex = 0
  bufferCount = 0
  emaIkiMs = null
  lastPublishTime = 0
  
  console.log('Cadence analyzer stopped')
}
