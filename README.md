# calm-flow

A meditative web experience that combines background pink-ish noise with slow breathing and a generative abstract visual, both responding to typing cadence. The site has no start/stop UI; visuals auto-run, audio auto-plays or starts on first interaction per browser policy.

This is a project built for HackWashU 2025.

## Features
- Real-time typing cadence analysis - Monitors keystroke timing and calculates smoothed inter-key intervals (IKI) to detect typing rhythm
- Audio-visual synchronization - Synchronizes breathing frequencies between pink noise audio engine and visual breathing animation for unified meditative experience
- Dynamic parameter mapping - Maps typing cadence to audio parameters (gain, cutoff, breath rate) and visual parameters (speed, detail, saturation) with smooth transitions
- Light intensity control - Dramatic brightness slider that controls visual elements (stars, ripples, gradients) and applies dark overlay for ambient lighting control

## Team members
Da Li
- Sophmore
- Major: computer science & data science
- Framework, audio generator
- https://www.linkedin.com/in/da-li-69572b323/
- da.li@wustl.edu

Qiyuan Hunag
- Sophmore
- Major: computer science
- UI, Vsualization
- https://www.linkedin.com/in/qiyuan-huang-453394390/
- h.qiyuan@wustl.edu

## What it does

Auto visual background + pink-ish noise with breathing; both respond to typing cadence; no start buttons; audio auto-plays or starts on first interaction.

## Clone & Run (local)

```bash
# Prereqs: Node.js 18+ and npm
git clone <https://github.com/DaDouglasLi/calm-flow.git>.git
cd <calm-flow>
npm install
npm run dev
# open the shown local URL in your browser
```

## Build & Preview

```bash
npm run build
npm run preview
```

## Behavior Details

### Signal Path

```
White Noise Loop → Pink Tilt Filter → Lowpass Filter → Master Gain → Breath LFO → Visibility Gain → Output
```

### Parameter Mapping

**IKI clamp:** [80, 500] ms (80=fast, 500=slow) | **Attack 300ms / Release 1500ms smoothing**

#### Audio:
- **gain:** 0.18 (fast) ↔ 0.28 (slow)
- **cutoffHz:** 800 (fast) ↔ 2200 (slow)  
- **breathHz:** 0.07 (fast) ↔ 0.12 (slow)

#### Visual:
- **speed:** 0.07 (fast) ↔ 0.12 (slow)
- **detail:** 0.6 (fast) ↔ 1.0 (slow)
- **saturation:** 0.6 (fast) ↔ 0.8 (slow)

### Light Intensity Control

The **Light** slider controls the overall brightness of the visual animation with dramatic effect:

- **1.00**: Full brightness - all visual elements at maximum visibility, no dark overlay
- **0.50**: Half brightness - moderate visibility with significant darkening overlay
- **0.00**: Very dark - minimal visibility with heavy dark overlay, only subtle elements visible

This provides dramatic control over the ambient lighting, allowing you to adjust from bright and vibrant to very dim and subtle, creating different meditative atmospheres.

### Autoplay Policy

The app attempts audio playback on load. If blocked by the browser, it starts automatically on your first natural interaction (keydown/pointer/touch). No buttons or icons are used.

### Safety

- Master gain hard-capped at ≤ 0.3
- All parameters clamped to safe ranges
- Idempotent start/stop; graceful Web Audio fallback
- Visibility attenuation (~−6 dB when hidden)

### Privacy

Keystrokes are not stored or sent anywhere. Cadence metrics are computed in-memory and used only to modulate audio/visual parameters locally.

## Deploy (Vercel/Netlify)

Deploy the dist/ output. Framework preset: Vite. Single-page static hosting is sufficient.