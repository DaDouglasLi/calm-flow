// Preload script for Electron security
const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any Electron-specific APIs here if needed in the future
  platform: process.platform,
  
  // Listen for reset-to-noise events from main process
  onResetToNoise: (callback) => {
    ipcRenderer.on('reset-to-noise', callback)
  },
  
  // Listen for global keystroke events from main process
  onGlobalKeystroke: (callback) => {
    ipcRenderer.on('global-keystroke', callback)
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  }
})
