/**
 * Breathing background with layered elements using Canvas 2D
 * Creates a meditative scene with breathing, waves, ripples, and stars
 */

// Utility functions
const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const lerp = (a, b, t) => a + (b - a) * t
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

// Easing functions
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

class BreathingScene {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    
    // Debug: Check if canvas context is created
    if (!this.ctx) {
      console.error('Failed to get 2D context from canvas')
      return
    }
    console.log('Canvas context created successfully')
    
    // Animation state
    this.running = false
    this.animationId = null
    this.lastTime = performance.now()
    this.phase = 0
    
    // Resize state
    this.inResize = false
    this.lastResize = 0
    
    // Parameters with defaults
    this.params = {
      speed: 0.095,
      detail: 0.8,
      saturation: 0.7,
      palette: 'day',
      breathHz: 0.1, // Default breathing frequency
      lightIntensity: 1.0 // Light intensity control (0-1)
    }
    
    // Offscreen buffer for performance
    this.offscreenCanvas = null
    this.offscreenCtx = null
    this.resolutionScale = 0.7
    
    // Layer elements
    this.stars = []
    this.ripples = []
    this.wavePhase = 0
    this.parallaxOffset = 0
    this.targetParallaxOffset = 0
    
    // Brightness control
    this.targetLuma = 0.4
    this.currentLumaScalar = 1.0
    this.lumaEMA = 0.4
    
    // Resize handling
    this.resizeHandler = null
    this.resizeThrottle = false
    
    // Initialize
    this.setupOffscreenBuffer()
    this.initStars()
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
      return
    }
    this.lastResize = now
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = this.canvas.getBoundingClientRect()
    
    // Debug: Log canvas dimensions
    console.log('Canvas dimensions:', { 
      rectWidth: rect.width, 
      rectHeight: rect.height, 
      canvasWidth: this.canvas.width, 
      canvasHeight: this.canvas.height,
      dpr 
    })
    
    // Only resize if dimensions actually changed
    const newWidth = rect.width * dpr
    const newHeight = rect.height * dpr
    
    if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {
      this.canvas.width = newWidth
      this.canvas.height = newHeight
      this.ctx.scale(dpr, dpr)
      console.log('Canvas resized to:', { newWidth, newHeight })
    }
    
    // Set offscreen buffer size
    const bufferWidth = Math.max(240, Math.floor(rect.width * this.resolutionScale))
    const bufferHeight = Math.max(160, Math.floor(rect.height * this.resolutionScale))
    
    if (this.offscreenCanvas.width !== bufferWidth || this.offscreenCanvas.height !== bufferHeight) {
      this.offscreenCanvas.width = bufferWidth
      this.offscreenCanvas.height = bufferHeight
    }
    
    this.inResize = false
    console.log('Breathing scene resized:', { 
      width: rect.width, 
      height: rect.height, 
      bufferWidth, 
      bufferHeight, 
      dpr 
    })
  }

  initStars() {
    this.stars = []
    for (let i = 0; i < 30; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        phase: Math.random() * Math.PI * 2,
        cycle: 1 + Math.random() * 2, // 1-3 second cycles
        size: 1 + Math.random() * 2,
        hue: 180 + Math.random() * 40 // Teal/blue range
      })
    }
  }

  // HSL to RGB conversion
  hslToRgb(h, s, l) {
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

  // Calculate breathing values
  calculateBreathing(time) {
    const phase = (this.phase + 2 * Math.PI * this.params.breathHz * time) % (2 * Math.PI)
    this.phase = phase
    
    const breath = 0.5 + 0.5 * Math.sin(phase)
    const easeBreath = smoothstep(0, 1, breath)
    
    return {
      phase,
      breath,
      easeBreath
    }
  }

  // Draw sky gradient
  drawSkyGradient(ctx, width, height, breathing) {
    const isDay = this.params.palette === 'day'
    const baseHue = isDay ? 200 : 220
    const baseSaturation = lerp(0.3, 0.6, this.params.saturation)
    
    // Global brightness and saturation modulation with light intensity
    const lightMul = lerp(0.1, 1.0, this.params.lightIntensity) // Much more dramatic light control
    const brightnessMul = lerp(0.85, 1.15, breathing.easeBreath) * lightMul
    const saturationMul = lerp(0.9, 1.1, breathing.easeBreath) * lightMul
    
    // Create vertical gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    
    // Top to bottom gradient with breathing modulation
    const topLightness = (isDay ? 0.7 : 0.4) * brightnessMul
    const bottomLightness = (isDay ? 0.5 : 0.3) * brightnessMul
    
    const topColor = this.hslToRgb(baseHue, baseSaturation * saturationMul, topLightness)
    const bottomColor = this.hslToRgb(baseHue, baseSaturation * saturationMul, bottomLightness)
    
    gradient.addColorStop(0, `rgb(${topColor[0]}, ${topColor[1]}, ${topColor[2]})`)
    gradient.addColorStop(1, `rgb(${bottomColor[0]}, ${bottomColor[1]}, ${bottomColor[2]})`)
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  // Draw flowing wave bands
  drawWaveBands(ctx, width, height, breathing) {
    const lightMul = lerp(0.0, 1.0, this.params.lightIntensity) // Light intensity control
    const alpha = lerp(0.15, 0.30, breathing.easeBreath) * lightMul
    ctx.globalAlpha = alpha
    
    // Update wave phase
    this.wavePhase += 0.002 * this.params.speed
    
    // Draw 3-5 wave bands
    for (let i = 0; i < 4; i++) {
      const y0 = (height / 5) * (i + 1)
      const amplitude = 20 + i * 10
      const frequency = 0.01 + i * 0.005
      const phase = this.wavePhase + i * Math.PI / 2
      
      ctx.beginPath()
      ctx.moveTo(0, y0)
      
      for (let x = 0; x < width; x += 2) {
        const y = y0 + amplitude * Math.sin(frequency * x + phase)
        ctx.lineTo(x, y)
      }
      
      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      
      // Soft gradient fill
      const gradient = ctx.createLinearGradient(0, y0 - amplitude, 0, height)
      const isDay = this.params.palette === 'day'
      const hue = isDay ? 180 : 200
      const lightness = isDay ? 0.6 : 0.4
      
      gradient.addColorStop(0, `hsla(${hue}, 40%, ${lightness}%, 0.3)`)
      gradient.addColorStop(1, `hsla(${hue}, 40%, ${lightness}%, 0.1)`)
      
      ctx.fillStyle = `hsla(${hue}, 40}, ${lightness}%, 0.2)`
      ctx.fill()
    }
    
    ctx.globalAlpha = 1
  }

  // Draw parallax elements (forest/sea)
  drawParallax(ctx, width, height, breathing) {
    // Update parallax offset with easing
    this.targetParallaxOffset = lerp(-2, 2, breathing.easeBreath) * height * 0.1
    this.parallaxOffset = lerp(this.parallaxOffset, this.targetParallaxOffset, 0.15)
    
    const lightMul = lerp(0.0, 1.0, this.params.lightIntensity) // Light intensity control
    const isDay = this.params.palette === 'day'
    const hue = isDay ? 160 : 180
    const lightness = isDay ? 0.3 : 0.2
    
    // Draw soft silhouettes
    ctx.globalAlpha = 0.4 * lightMul
    ctx.fillStyle = `hsl(${hue}, 30%, ${lightness}%)`
    
    // Forest/sea silhouette 1
    ctx.beginPath()
    ctx.moveTo(0, height * 0.6 + this.parallaxOffset)
    for (let x = 0; x < width; x += 20) {
      const y = height * 0.6 + this.parallaxOffset + Math.sin(x * 0.01) * 30
      ctx.lineTo(x, y)
    }
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()
    
    // Forest/sea silhouette 2
    ctx.beginPath()
    ctx.moveTo(0, height * 0.8 + this.parallaxOffset * 0.5)
    for (let x = 0; x < width; x += 15) {
      const y = height * 0.8 + this.parallaxOffset * 0.5 + Math.sin(x * 0.008) * 20
      ctx.lineTo(x, y)
    }
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()
    
    ctx.globalAlpha = 1
  }

  // Draw raindrop ripples
  drawRipples(ctx, width, height, time) {
    const lightMul = lerp(0.0, 1.0, this.params.lightIntensity) // Light intensity control
    
    // Spawn new ripples based on speed
    if (Math.random() < 0.001 * (1 - this.params.speed * 0.5)) {
      if (this.ripples.length < 12) {
        this.ripples.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.7 + height * 0.3,
          startTime: time,
          velocity: 20 + Math.random() * 30,
          maxRadius: 50 + Math.random() * 100
        })
      }
    }
    
    // Update and draw ripples
    ctx.globalAlpha = 0.3 * lightMul
    ctx.strokeStyle = `hsl(200, 20%, 60%)`
    ctx.lineWidth = 1
    
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i]
      const age = time - ripple.startTime
      const radius = ripple.velocity * age
      
      if (radius > ripple.maxRadius) {
        this.ripples.splice(i, 1)
        continue
      }
      
      const alpha = smoothstep(0, 1, 1 - radius / ripple.maxRadius)
      ctx.globalAlpha = alpha * 0.3
      
      ctx.beginPath()
      ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2)
      ctx.stroke()
    }
    
    ctx.globalAlpha = 1
  }

  // Draw softly blinking stars
  drawStars(ctx, width, height, time) {
    const lightMul = lerp(0.0, 1.0, this.params.lightIntensity) // Much more dramatic light control
    
    for (const star of this.stars) {
      const blinkPhase = (time * 0.001 + star.phase) % (star.cycle * 2)
      const blink = Math.sin(blinkPhase / star.cycle * Math.PI)
      const alpha = easeInOutCubic(Math.max(0, blink)) * lightMul
      
      if (alpha > 0.05) { // Lower threshold for more visible stars
        ctx.globalAlpha = alpha * 0.8
        ctx.fillStyle = `hsl(${star.hue}, 20%, 90%)`
        
        const size = star.size * (0.5 + alpha * 0.5)
        const x = star.x * width
        const y = star.y * height
        
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    
    ctx.globalAlpha = 1
  }

  // Apply global light intensity overlay
  applyLightIntensityOverlay(ctx, width, height) {
    const lightIntensity = this.params.lightIntensity
    
    // Create a dark overlay that gets more opaque as light intensity decreases
    const overlayAlpha = 1 - lightIntensity // 0 at full light, 1 at no light
    const overlayColor = `rgba(0, 0, 0, ${overlayAlpha * 0.95})` // Much darker overlay (0.95 instead of 0.8)
    
    ctx.globalAlpha = 1
    ctx.fillStyle = overlayColor
    ctx.fillRect(0, 0, width, height)
  }

  // Apply tone mapping for brightness control
  applyToneMapping(ctx, width, height) {
    // Sample average luminance
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    let totalLuma = 0
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255
      const g = data[i + 1] / 255
      const b = data[i + 2] / 255
      totalLuma += 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    
    const avgLuma = totalLuma / (data.length / 4)
    this.lumaEMA = lerp(this.lumaEMA, avgLuma, 0.1)
    
    // Calculate brightness scalar
    const targetLuma = 0.4
    const lumaScalar = targetLuma / Math.max(this.lumaEMA, 0.01)
    this.currentLumaScalar = lerp(this.currentLumaScalar, clamp(lumaScalar, 0.85, 1.2), 0.1)
    
    // Apply brightness adjustment
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = `rgba(${Math.round(this.currentLumaScalar * 255)}, ${Math.round(this.currentLumaScalar * 255)}, ${Math.round(this.currentLumaScalar * 255)}, 1)`
    ctx.fillRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'source-over'
  }

  // Main render function
  render() {
    if (!this.running) return
    
    const currentTime = performance.now()
    const dt = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime
    
    // Debug: Log render calls occasionally
    if (Math.random() < 0.001) {
      console.log('Visual scene rendering, lightIntensity:', this.params.lightIntensity)
    }
    
    // Calculate breathing
    const breathing = this.calculateBreathing(dt)
    
    const { width, height } = this.offscreenCanvas
    
    // Clear offscreen buffer
    this.offscreenCtx.clearRect(0, 0, width, height)
    
    // Draw layers in order
    this.drawSkyGradient(this.offscreenCtx, width, height, breathing)
    this.drawWaveBands(this.offscreenCtx, width, height, breathing)
    this.drawParallax(this.offscreenCtx, width, height, breathing)
    this.drawRipples(this.offscreenCtx, width, height, currentTime)
    this.drawStars(this.offscreenCtx, width, height, currentTime)
    
    // Apply global light intensity overlay
    this.applyLightIntensityOverlay(this.offscreenCtx, width, height)
    
    // Apply tone mapping
    this.applyToneMapping(this.offscreenCtx, width, height)
    
    // Scale up to main canvas with smoothing
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    this.ctx.drawImage(
      this.offscreenCanvas,
      0, 0, width, height,
      0, 0, this.canvas.width / (window.devicePixelRatio || 1), this.canvas.height / (window.devicePixelRatio || 1)
    )
    
    // Debug: Log render completion occasionally
    if (Math.random() < 0.001) {
      console.log('Render completed, canvas size:', { 
        canvasWidth: this.canvas.width, 
        canvasHeight: this.canvas.height,
        offscreenWidth: width,
        offscreenHeight: height
      })
    }
  }

  // Animation loop
  animate() {
    if (!this.running) return
    
    // Throttle when document is hidden
    if (document.visibilityState === 'hidden') {
      this.animationId = requestAnimationFrame(() => this.animate())
      return
    }
    
    this.render()
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  start() {
    if (this.running) return
    
    this.running = true
    this.lastTime = performance.now()
    this.animationId = requestAnimationFrame(() => this.animate())
    
    console.log('Breathing scene started')
  }

  stop() {
    this.running = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    console.log('Breathing scene stopped')
  }

  setParams(params) {
    // Shallow merge with existing params
    this.params = { ...this.params, ...params }
    
    // Clamp all parameters to safe ranges
    this.params.speed = clamp(this.params.speed, 0, 1)
    this.params.detail = clamp(this.params.detail, 0, 1)
    this.params.saturation = clamp(this.params.saturation, 0, 1)
    this.params.breathHz = clamp(this.params.breathHz, 0.05, 0.2)
    this.params.lightIntensity = clamp(this.params.lightIntensity, 0, 1)
    
    // Validate palette
    if (!['day', 'night'].includes(this.params.palette)) {
      this.params.palette = 'day'
    }
    
    console.log('Breathing scene parameters updated:', this.params)
    
    // Debug light intensity specifically
    if (params.lightIntensity !== undefined) {
      console.log('Light intensity set to:', this.params.lightIntensity)
    }
  }

  dispose() {
    this.stop()
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
    }
    console.log('Breathing scene disposed')
  }
}

// Export the mount function
export function mount(canvas) {
  console.log('Mounting breathing scene on canvas:', canvas)
  const scene = new BreathingScene(canvas)
  scene.start()
  console.log('Breathing scene started')
  
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