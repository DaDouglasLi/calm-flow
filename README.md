# calm-flow

A meditative web experience that combines background pink-ish noise with slow breathing and a generative abstract visual, both responding to typing cadence. The site has no start/stop UI; visuals auto-run, audio auto-plays or starts on first interaction per browser policy.

## What it does

Auto visual background + pink-ish noise with breathing; both respond to typing cadence; no start buttons; audio auto-plays or starts on first interaction.

## Clone & Run (local)

```bash
# Prereqs: Node.js 18+ and npm
git clone <YOUR_REPO_URL>.git
cd <REPO_NAME>
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

### Autoplay Policy

The app attempts audio playback on load. If blocked by the browser, it starts automatically on your first natural interaction (keydown/pointer/touch). No buttons or icons are used.

### Safety

- Master gain hard-capped at ≤ 0.3
- All parameters clamped to safe ranges
- Idempotent start/stop; graceful Web Audio fallback
- Visibility attenuation (~−6 dB when hidden)

### Privacy

Keystrokes are not stored or sent anywhere. Cadence metrics are computed in-memory and used only to modulate audio/visual parameters locally.

## Success Criteria

- **On page load:** visual background animates immediately; no scrollbars; no console errors
- **Audio:** tries to start immediately; if blocked, starts on first natural interaction (keydown/pointer/touch)
- **Typing faster:** audibly darker & slightly quieter noise, slower breathing; visuals show slightly faster motion / reduced detail per mapping
- **Typing slower/idle:** brighter & slightly louder; breathing slightly faster; visuals ease accordingly
- **UI looks polished:** vignette, typography, optional tiny status chip, no buttons/icons added for start
- **Resize safe:** no stack overflow, performance steady (≤60 fps; throttled when hidden)