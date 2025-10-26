# Calm Flow

A meditative desktop application that combines background pink-ish noise with slow breathing and a generative abstract visual, both responding to typing cadence. Built with Electron for cross-platform desktop experience.

**HackWashU 2025 Project**

## Features

- **Desktop Application** - Native Electron app with cross-platform support (Windows, macOS, Linux)
- **Desktop Keyboard Detection** - Responds to typing when the app is focused, without interfering with other applications
- **Real-time typing cadence analysis** - Monitors keystroke timing and calculates smoothed inter-key intervals (IKI) to detect typing rhythm
- **Audio-visual synchronization** - Synchronizes breathing frequencies between pink noise audio engine and visual breathing animation for unified meditative experience
- **Dynamic parameter mapping** - Maps typing cadence to audio parameters (gain, cutoff, breath rate) and visual parameters (speed, detail, saturation) with smooth transitions
- **Light intensity control** - Dramatic brightness slider that controls visual elements (stars, ripples, gradients) and applies dark overlay for ambient lighting control
- **Native Menu & Shortcuts** - Desktop menu bar with keyboard shortcuts for full-screen, dev tools, and app control

## Team Members

**Da Li**
- Sophomore, Computer Science & Data Science
- Framework, Audio Generator
- [LinkedIn](https://www.linkedin.com/in/da-li-69572b323/) | da.li@wustl.edu

**Qiyuan Huang**
- Sophomore, Computer Science  
- UI, Visualization
- [LinkedIn](https://www.linkedin.com/in/qiyuan-huang-453394390/) | h.qiyuan@wustl.edu

## Quick Start

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)

### Installation & Running

```bash
# 1. Clone the repository
git clone https://github.com/DaDouglasLi/calm-flow.git
cd calm-flow

# 2. Install dependencies
npm install

# 3. Build and run the desktop app
npm run build
npm run electron
```

### Alternative: One-Command Start
```bash
# Double-click this file in Windows Explorer, or run:
start-app.bat
```

## How to Use

1. **Launch the app** - The meditative background and pink noise will start automatically
2. **Focus the app** - Click on the app window to make it active
3. **Start typing** - The breathing effect will respond to your typing rhythm
4. **Adjust light** - Use the Light slider to control brightness (0.00 = very dark, 1.00 = full brightness)
5. **Switch apps** - You can minimize or switch to other apps without interference

## Desktop Features

### Keyboard Shortcuts
- **F11**: Toggle full screen
- **Ctrl/Cmd + Shift + I**: Toggle developer tools
- **Ctrl/Cmd + R**: Reset to pink noise
- **Ctrl/Cmd + M**: Minimize window
- **Ctrl/Cmd + W**: Close window
- **Ctrl/Cmd + Q**: Quit application

### Menu Options
- **File → Reset to Pink Noise**: Switch back to built-in pink noise
- **View → Toggle Full Screen**: Enter/exit full screen mode
- **View → Toggle Developer Tools**: Open/close developer console

## How It Works

### Signal Path
```
White Noise Loop → Pink Tilt Filter → Lowpass Filter → Master Gain → Breath LFO → Output
```

### Parameter Mapping
**Typing Speed Detection:** [80, 500] ms inter-key intervals (80=fast, 500=slow)

**Audio Parameters:**
- **Gain:** 0.18 (fast) ↔ 0.28 (slow)
- **Cutoff:** 800Hz (fast) ↔ 2200Hz (slow)  
- **Breath Rate:** 0.07Hz (fast) ↔ 0.12Hz (slow)

**Visual Parameters:**
- **Speed:** 0.14 (fast) ↔ 0.06 (slow)
- **Detail:** 0.6 (fast) ↔ 1.0 (slow)
- **Saturation:** 0.6 (fast) ↔ 0.8 (slow)

### Light Intensity Control
The **Light** slider provides dramatic brightness control:
- **1.00**: Full brightness - all visual elements visible
- **0.50**: Half brightness - moderate visibility with darkening overlay
- **0.00**: Very dark - minimal visibility with heavy dark overlay

## Development

### Development Mode
```bash
# Terminal 1: Start web server
npm run dev

# Terminal 2: Start Electron in development mode
npm run electron-dev
```

### Building for Distribution
```bash
# Build for current platform
npm run dist

# Build for all platforms (requires platform-specific tools)
npm run electron-build
```

### File Structure
```
calm-flow/
├── electron/           # Electron main process
├── src/               # Application source code
├── dist/              # Built web assets
└── dist-electron/     # Built desktop applications
```

## Platform Support

- **Windows**: NSIS installer (.exe)
- **macOS**: DMG package (.dmg)
- **Linux**: AppImage (.AppImage)

## Privacy & Safety

- **Privacy**: Keystrokes are not stored or sent anywhere. All processing is local.
- **Safety**: Master gain capped at ≤ 0.3, all parameters have safety bounds
- **Performance**: Graceful Web Audio fallback, optimized for smooth operation

## Troubleshooting

### App Won't Start
1. Make sure Node.js 18+ is installed
2. Run `npm install` to install dependencies
3. Run `npm run build` before `npm run electron`

### No Audio
1. Check your system audio settings
2. Make sure the app window is focused
3. Try clicking in the app window first

### Typing Not Responding
1. Make sure the app window is focused (click on it)
2. Check that you're typing in the app window, not other applications
3. The breathing effect only responds when the app is active

## License

ISC License - See package.json for details