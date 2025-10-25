// Import-safe bootstrap for calm-flow
// This is the main entry point for the application

// Import types
import type { AppConfig, CadenceMetrics } from './types.js'
import { startCadence } from './input/cadence.js'

// Application configuration
const config: AppConfig = {
  name: 'calm-flow',
  version: '1.0.0'
}

// Cadence analyzer instance
let cadenceAnalyzer: ReturnType<typeof startCadence> | null = null

// Bootstrap function
function bootstrap(): void {
  console.log(`Starting ${config.name} v${config.version}`)
  
  // Initialize application components
  initializeApp()
}

// Initialize application components
function initializeApp(): void {
  // Set up event listeners
  setupEventListeners()
  
  // Initialize UI
  initializeUI()
}

// Set up event listeners
function setupEventListeners(): void {
  const startBtn = document.getElementById('startBtn')
  if (startBtn) {
    startBtn.addEventListener('click', handleStart)
  }
}

// Handle start button click
function handleStart(): void {
  console.log('Application started')
  logMessage('Application started successfully')
  
  // Start cadence analyzer
  startCadenceAnalyzer()
}

// Start cadence analyzer
function startCadenceAnalyzer(): void {
  if (cadenceAnalyzer) {
    logMessage('Cadence analyzer already running')
    return
  }
  
  try {
    cadenceAnalyzer = startCadence()
    
    // Subscribe to cadence metrics
    cadenceAnalyzer.subscribe((metrics: CadenceMetrics) => {
      logCadenceMetrics(metrics)
    })
    
    logMessage('Cadence analyzer started - start typing to see metrics!')
  } catch (error) {
    logMessage(`Failed to start cadence analyzer: ${error}`)
  }
}

// Log cadence metrics to the log container
function logCadenceMetrics(metrics: CadenceMetrics): void {
  const logContainer = document.getElementById('log')
  if (logContainer) {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = document.createElement('div')
    
    // Format metrics for display
    const ikiDisplay = metrics.lastIkiMs !== null ? `${metrics.lastIkiMs.toFixed(1)}ms` : 'N/A'
    const emaIkiDisplay = metrics.emaIkiMs !== null ? `${metrics.emaIkiMs.toFixed(1)}ms` : 'N/A'
    const wpmDisplay = metrics.wpm10s.toFixed(1)
    
    logEntry.innerHTML = `
      <strong>[${timestamp}]</strong> 
      IKI: ${ikiDisplay} | 
      EMA IKI: ${emaIkiDisplay} | 
      WPM: ${wpmDisplay}
    `
    logEntry.style.color = '#007bff'
    logContainer.appendChild(logEntry)
    
    // Keep only last 20 log entries
    while (logContainer.children.length > 20) {
      logContainer.removeChild(logContainer.firstChild!)
    }
  }
}

// Initialize UI
function initializeUI(): void {
  logMessage('UI initialized')
}

// Log message to the log container
function logMessage(message: string): void {
  const logContainer = document.getElementById('log')
  if (logContainer) {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = document.createElement('div')
    logEntry.textContent = `[${timestamp}] ${message}`
    logContainer.appendChild(logEntry)
  }
}

// Cleanup function
function cleanup(): void {
  if (cadenceAnalyzer) {
    cadenceAnalyzer.stop()
    cadenceAnalyzer = null
    logMessage('Cadence analyzer stopped')
  }
}

// Handle page unload
window.addEventListener('beforeunload', cleanup)

// Export for use in main.ts
export { bootstrap, config }

// Auto-bootstrap when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap)
} else {
  bootstrap()
}
