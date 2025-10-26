# calm-flow

A meditative desktop application that combines background pink-ish noise with slow breathing and a generative abstract visual, both responding to typing cadence. Built with Electron for cross-platform desktop experience with global keyboard detection that works even when the app is hidden.

This is a project built for HackWashU 2025.

## Features
- **Desktop Application** - Native Electron app with cross-platform support (Windows, macOS, Linux)
- **Desktop Keyboard Detection** - Responds to typing when the app is focused, without interfering with other applications
- **Real-time typing cadence analysis** - Monitors keystroke timing and calculates smoothed inter-key intervals (IKI) to detect typing rhythm
- **Audio-visual synchronization** - Synchronizes breathing frequencies between pink noise audio engine and visual breathing animation for unified meditative experience
- **Dynamic parameter mapping** - Maps typing cadence to audio parameters (gain, cutoff, breath rate) and visual parameters (speed, detail, saturation) with smooth transitions
- **Light intensity control** - Dramatic brightness slider that controls visual elements (stars, ripples, gradients) and applies dark overlay for ambient lighting control
- **Native Menu & Shortcuts** - Desktop menu bar with keyboard shortcuts for full-screen, dev tools, and app control

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

Auto visual background + pink-ish noise with breathing; both respond to typing cadence; no start buttons; audio auto-plays immediately on app launch. Works as a desktop application with global keyboard detection for continuous meditative experience.

## How to Open the App

### **Quick Start (Recommended)**
```bash
# 1. Clone the repository
git clone https://github.com/DaDouglasLi/calm-flow.git
cd calm-flow

# 2. Install dependencies
npm install

# 3. Start the desktop app
npm run electron
```

### **Development Mode**
```bash
# Terminal 1: Start web server
npm run dev

# Terminal 2: Start Electron in development mode
npm run electron-dev
```

### **Build & Distribute**
```bash
# Build the app
npm run build

# Create distributable packages
npm run dist
```

## Desktop Features

### **Keyboard Shortcuts**
- **Ctrl/Cmd + R**: Reset to pink noise
- **F11**: Toggle full screen
- **Ctrl/Cmd + Shift + I**: Toggle developer tools
- **Ctrl/Cmd + M**: Minimize window
- **Ctrl/Cmd + W**: Close window
- **Ctrl/Cmd + Q**: Quit application

### **Menu Options**
- **File → Reset to Pink Noise**: Switch back to built-in pink noise
- **View → Toggle Full Screen**: Enter/exit full screen mode
- **View → Toggle Developer Tools**: Open/close developer console
- **Window → Minimize/Close**: Window management

### **Desktop Keyboard Detection**
The app responds to your typing when it's focused, providing:
- **Focused Experience** - Breathing effects respond when you type in the app
- **No Interference** - Doesn't interfere with typing in other applications
- **Smooth Integration** - Works seamlessly with your desktop workflow
- **Meditative Focus** - Encourages mindful interaction with the app

**Note:** The app responds to typing when it's the active/focused window. This ensures it doesn't interfere with your normal typing in other applications while still providing the meditative breathing experience when you're using it.

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
- **speed:** 0.14 (fast) ↔ 0.06 (slow) - *doubled sensitivity for more responsive animation*
- **detail:** 0.6 (fast) ↔ 1.0 (slow)
- **saturation:** 0.6 (fast) ↔ 0.8 (slow)

### Light Intensity Control

The **Light** slider controls the overall brightness of the visual animation with dramatic effect:

- **1.00**: Full brightness - all visual elements at maximum visibility, no dark overlay
- **0.50**: Half brightness - moderate visibility with significant darkening overlay
- **0.00**: Very dark - minimal visibility with heavy dark overlay, only subtle elements visible

This provides dramatic control over the ambient lighting, allowing you to adjust from bright and vibrant to very dim and subtle, creating different meditative atmospheres.

### Autoplay Policy

The desktop app starts audio playback immediately on launch. No user interaction required - the meditative experience begins as soon as you open the application.

### Safety

- Master gain hard-capped at ≤ 0.3
- All parameters clamped to safe ranges
- Idempotent start/stop; graceful Web Audio fallback
- Visibility attenuation (~−6 dB when hidden)

### Privacy

Keystrokes are not stored or sent anywhere. Cadence metrics are computed in-memory and used only to modulate audio/visual parameters locally.

## Platform Support

### **Desktop Applications**
- **Windows**: NSIS installer (.exe)
- **macOS**: DMG package (.dmg)
- **Linux**: AppImage (.AppImage)

### **Build Commands**
```bash
# Build for current platform
npm run dist

# Build for all platforms (requires platform-specific tools)
npm run electron-build
```

### **Distribution**
The built applications will be in the `dist-electron` folder and can be distributed as standalone desktop applications.

## Development

### **Prerequisites**
- Node.js 18+
- npm

### **File Structure**
```
calm-flow/
├── electron/           # Electron main process
├── src/               # Application source code
├── dist/              # Built web assets
└── dist-electron/     # Built desktop applications
```