// Plain JavaScript app entry point
// Demo wiring for cadence analyzer - no UI elements

import { startCadence, stopCadence } from './input/cadence.js'

// Application configuration
const config = {
  name: 'calm-flow',
  version: '1.0.0'
}

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
}

// Set up event listeners
function setupEventListeners() {
  // Listen for cadence update events
  document.addEventListener('cadence:update', handleCadenceUpdate)
  
  // Handle page unload for cleanup
  window.addEventListener('beforeunload', cleanup)
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

// Cleanup function
function cleanup() {
  stopCadence()
  console.log('Application cleanup completed')
}

// Export for use in main.js
export { bootstrap, config }

// Auto-bootstrap when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap)
} else {
  bootstrap()
}
