// Shared types for calm-flow application

// Application configuration
export interface AppConfig {
  name: string
  version: string
}

// Audio related types
export interface AudioConfig {
  sampleRate: number
  channels: number
  bufferSize: number
}

// Input related types
export interface InputConfig {
  type: 'keyboard' | 'mouse' | 'touch' | 'gamepad'
  sensitivity: number
}

// Mapping related types
export interface MappingConfig {
  source: string
  target: string
  transform: (value: number) => number
}

// Visual related types
export interface VisualConfig {
  width: number
  height: number
  backgroundColor: string
  frameRate: number
}

// UI related types
export interface UIConfig {
  theme: 'light' | 'dark'
  fontSize: number
  showDebug: boolean
}

// Event types
export interface AppEvent {
  type: string
  data: any
  timestamp: number
}

// State types
export interface AppState {
  isRunning: boolean
  currentMode: string
  config: AppConfig
}

// Cadence analyzer types
export interface CadenceMetrics {
  lastIkiMs: number | null     // raw last interval
  emaIkiMs: number | null      // smoothed IKI
  wpm10s: number               // rough WPM
  lastKeyAt: number | null     // performance.now()
}

export type CadenceUnsubscribe = () => void
