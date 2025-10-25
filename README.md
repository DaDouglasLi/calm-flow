# calm-flow
a repository for HackWashU 2025

## Audio Pipeline (JS)

A subtle pink-ish noise generator that responds to typing cadence with no UI elements.

### Signal Path
```
White Noise Loop → Pink Tilt Filter → Lowpass Filter → Master Gain → (Optional) Breath LFO → Visibility Gain → Output
```

### Parameter Mapping
| Typing Speed | IKI (ms) | Gain | Cutoff (Hz) | Breath Rate (Hz) |
|--------------|----------|------|-------------|------------------|
| Fast         | 80       | 0.18 | 800         | 0.07 (slower)    |
| Slow         | 500      | 0.28 | 2200        | 0.12 (faster)    |

### Autoplay Policy
Audio starts automatically on page load. No user gesture required - the engine attempts immediate playback and falls back to user interaction if needed. No buttons or icons are used.

### Safety Features
- Master gain capped at ≤ 0.3
- All parameters have safety bounds
- Graceful Web Audio API fallback
- Idempotent start/stop operations