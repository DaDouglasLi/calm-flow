// Intensity slider controller

let currentIntensity = 1.0

// Initialize intensity slider
export function initIntensity() {
  const intensityInput = document.getElementById('intensity')
  const intensityVal = document.getElementById('intensity-val')
  
  if (!intensityInput || !intensityVal) {
    console.warn('Intensity slider elements not found')
    return
  }
  
  // Set initial value
  intensityInput.value = currentIntensity
  intensityVal.textContent = currentIntensity.toFixed(2)
  
  // Handle input changes
  intensityInput.addEventListener('input', (event) => {
    const value = parseFloat(event.target.value)
    currentIntensity = Math.max(0, Math.min(1, value)) // Clamp to [0,1]
    
    // Update display
    intensityVal.textContent = currentIntensity.toFixed(2)
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('ui:intensity', { 
      detail: { value: currentIntensity } 
    }))
    
    console.log('Intensity changed:', currentIntensity)
  })
  
  console.log('Intensity slider initialized')
}

// Get current intensity value
export function getIntensity() {
  return currentIntensity
}

// Set intensity value programmatically
export function setIntensity(value) {
  const intensityInput = document.getElementById('intensity')
  const intensityVal = document.getElementById('intensity-val')
  
  if (intensityInput && intensityVal) {
    const clampedValue = Math.max(0, Math.min(1, value))
    currentIntensity = clampedValue
    intensityInput.value = clampedValue
    intensityVal.textContent = clampedValue.toFixed(2)
  }
}
