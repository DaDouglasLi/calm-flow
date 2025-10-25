/**
 * Smooth-noise cloud using Canvas 2D with fBm
 * Creates a gently evolving cloud that responds to typing cadence
 */

// Simple 2D value noise implementation
class ValueNoise {
  constructor(seed = Math.random()) {
    this.permutation = []
    
    // Initialize permutation table
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i
    }
    
    // Shuffle using seed
    for (let i = 255; i > 0; i--) {
      const j = Math.floor((seed * (i + 1)) % (i + 1))
      ;[this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]]
      seed = (seed * 16807) % 2147483647
    }
    
    // Duplicate for overflow
    this.permutation = [...this.permutation, ...this.permutation]
  }

  // Smooth interpolation
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  // Get value at grid point
  getValue(x, y) {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    return this.permutation[this.permutation[X] + Y] / 255
  }

  // 2D value noise
  noise(x, y) {
    const X = Math.floor(x)
    const Y = Math.floor(y)
    
    x -= X
    y -= Y
    
    const u = this.fade(x)
    const v = this.fade(y)
    
    const a = this.getValue(X, Y)
    const b = this.getValue(X + 1, Y)
    const c = this.getValue(X, Y + 1)
    const d = this.getValue(X + 1, Y + 1)
    
    return this.lerp(
      this.lerp(a, b, u),
      this.lerp(c, d, u),
      v
    )
  }

  lerp(a, b, t) {
    return a + (b - a) * t
  }
}

// Utility functions
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function lerp(start, end, t) {
  return start + (end - start) * t
}

// HSL to RGB conversion
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  
  let r, g, b
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ]
}

class CloudScene {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.noise = new ValueNoise()
    
    // Animation state
    this.running = false
    this.animationId = null
    this.startTime = performance.now()
    this.frameCount = 0
    
    // Resize state
    this.inResize = false
    this.lastResize = 0
    
    // Parameters with defaults
    this.params = {
      speed: 0.09,
      detail: 0.8,
      saturation: 0.7,
      palette: 'day'
    }
    
    // Offscreen buffer for performance
    this.offscreenCanvas = null
    this.offscreenCtx = null
    this.resolutionScale = 0.75
    this.imageData = null
    
    // Resize handling
    this.resizeHandler = null
    this.resizeThrottle = false
    
    // Initialize
    this.setupOffscreenBuffer()
    this.resize()
    this.setupResizeListener()
  }

  setupOffscreenBuffer() {
    this.offscreenCanvas = document.createElement('canvas')
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')
  }

  setupResizeListener() {
    this.resizeHandler = () => {
      if (this.resizeThrottle) return
      this.resizeThrottle = true
      requestAnimationFrame(() => {
        this.resize()
        this.resizeThrottle = false
      })
    }
    window.addEventListener('resize', this.resizeHandler)
  }

  resize() {
    if (this.inResize) return
    this.inResize = true
    
    const now = Date.now()
    if (now - this.lastResize < 100) {
      this.inResize = false
      return // Throttle resize calls
    }
    this.lastResize = now
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = this.canvas.getBoundingClientRect()
    
    // Only resize if dimensions actually changed
    const newWidth = rect.width * dpr
    const newHeight = rect.height * dpr
    
    if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {
      this.canvas.width = newWidth
      this.canvas.height = newHeight
      this.ctx.scale(dpr, dpr)
    }
    
    // Set offscreen buffer size (reduced resolution for performance)
    const bufferWidth = Math.max(240, Math.floor(rect.width * this.resolutionScale))
    const bufferHeight = Math.max(160, Math.floor(rect.height * this.resolutionScale))
    
    if (this.offscreenCanvas.width !== bufferWidth || this.offscreenCanvas.height !== bufferHeight) {
      this.offscreenCanvas.width = bufferWidth
      this.offscreenCanvas.height = bufferHeight
      
      // Reallocate ImageData only when size changes
      this.imageData = this.offscreenCtx.createImageData(bufferWidth, bufferHeight)
    }
    
    this.inResize = false
    console.log('Cloud scene resized:', { 
      width: rect.width, 
      height: rect.height, 
      bufferWidth, 
      bufferHeight, 
      dpr 
    })
  }

  // Fractional Brownian Motion with time-based sampling
  fbm(x, y, octaves, time, vx, vy) {
    let value = 0
    let amplitude = 1
    let frequency = 1
    
    // Fixed offsets to avoid integer locking
    const ox = 0.123
    const oy = 0.371
    
    for (let i = 0; i < octaves; i++) {
      // Time evolution: sample at (x*freq + t*vx + ox, y*freq + t*vy + oy)
      const nx = x * frequency + time * vx + ox
      const ny = y * frequency + time * vy + oy
      
      value += this.noise.noise(nx, ny) * amplitude
      amplitude *= 0.5 // Halve each octave
      frequency *= 2.0 // Double each octave
    }
    
    return value
  }

  // Generate cloud data with time-based evolution
  generateCloudData() {
    const { width, height } = this.offscreenCanvas
    const data = this.imageData.data
    
    // Calculate elapsed time in seconds
    const time = (performance.now() - this.startTime) / 1000
    
    // Map speed to drift velocities
    const vx = lerp(0.02, 0.12, this.params.speed)
    const vy = vx * 0.7 // Slightly different for organic movement
    
    // Map detail to octave count
    const octaves = Math.round(lerp(3, 5, this.params.detail))
    const saturation = this.params.saturation
    
    // Color palette
    const isDay = this.params.palette === 'day'
    const baseHue = isDay ? 180 : 200 // Teal/blue
    const baseSaturation = lerp(0.2, 0.6, saturation) // Low saturation for subtlety
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        
        // Sample fBm with time-based drift
        const nx = x * 0.01
        const ny = y * 0.01
        const noiseValue = this.fbm(nx, ny, octaves, time, vx, vy)
        
        // Normalize to [0, 1]
        const normalizedValue = (noiseValue + 1) * 0.5
        
        // Map to color with subtle hue variation
        const hue = baseHue + 3 * (normalizedValue - 0.5) // Small hue shift
        const lightness = isDay 
          ? lerp(0.6, 0.8, normalizedValue) 
          : lerp(0.3, 0.5, normalizedValue)
        
        const [r, g, b] = hslToRgb(hue, baseSaturation, lightness)
        
        data[i] = r     // Red
        data[i + 1] = g // Green
        data[i + 2] = b // Blue
        data[i + 3] = 255 // Alpha
      }
    }
    
    return this.imageData
  }

  // Animation loop
  animate() {
    if (!this.running) return
    
    this.frameCount++
    
    // Throttle when document is hidden
    if (document.visibilityState === 'hidden') {
      if (this.frameCount % 2 !== 0) {
        this.animationId = requestAnimationFrame(() => this.animate())
        return
      }
    }
    
    // Generate cloud data with time-based evolution
    const imageData = this.generateCloudData()
    
    // Draw to offscreen buffer
    this.offscreenCtx.putImageData(imageData, 0, 0)
    
    // Scale up to main canvas with smoothing
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    this.ctx.drawImage(
      this.offscreenCanvas,
      0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height,
      0, 0, this.canvas.width / (window.devicePixelRatio || 1), this.canvas.height / (window.devicePixelRatio || 1)
    )
    
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  start() {
    if (this.running) return
    
    this.running = true
    this.startTime = performance.now()
    this.frameCount = 0
    this.animationId = requestAnimationFrame(() => this.animate())
    
    console.log('Cloud scene started')
  }

  stop() {
    this.running = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    console.log('Cloud scene stopped')
  }

  setParams(params) {
    // Shallow merge with existing params
    this.params = { ...this.params, ...params }
    
    // Clamp all parameters to safe ranges
    this.params.speed = clamp(this.params.speed, 0, 1)
    this.params.detail = clamp(this.params.detail, 0, 1)
    this.params.saturation = clamp(this.params.saturation, 0, 1)
    
    // Validate palette
    if (!['day', 'night'].includes(this.params.palette)) {
      this.params.palette = 'day'
    }
    
    console.log('Cloud parameters updated:', this.params)
  }

  dispose() {
    this.stop()
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
    }
    console.log('Cloud scene disposed')
  }
}

// Export the mount function
export function mount(canvas) {
  console.log('Mounting cloud scene on canvas:', canvas)
  const scene = new CloudScene(canvas)
  scene.start()
  console.log('Cloud scene started')
  
  return {
    setParams(params) {
      scene.setParams(params)
    },
    resize() {
      scene.resize()
    },
    dispose() {
      scene.dispose()
    }
  }
}