# Calm Flow - Desktop Application

A meditative desktop application that combines background pink-ish noise with slow breathing and a generative abstract visual, both responding to typing cadence.

## Features

- **Auto-starting meditative experience** - Visuals and audio begin immediately on app launch
- **Typing-responsive breathing** - Audio and visual elements sync to your typing rhythm
- **Light intensity control** - Dramatic brightness slider for ambient lighting control
- **Layered visual elements** - Breathing sky gradients, flowing waves, parallax elements, ripples, and blinking stars
- **Pink noise audio engine** - Gentle background noise with breathing modulation
- **Desktop integration** - Native app with menu bar, keyboard shortcuts, and window controls

## Installation

### Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. In another terminal, start Electron:
```bash
npm run electron-dev
```

### Building for Production

1. Build the web assets:
```bash
npm run build
```

2. Build the Electron app:
```bash
npm run dist
```

The built application will be in the `dist-electron` folder.

## Usage

### Keyboard Shortcuts

- **Ctrl/Cmd + R**: Reset to pink noise
- **F11**: Toggle full screen
- **Ctrl/Cmd + Shift + I**: Toggle developer tools
- **Ctrl/Cmd + R**: Reload app
- **Ctrl/Cmd + M**: Minimize window
- **Ctrl/Cmd + W**: Close window
- **Ctrl/Cmd + Q**: Quit application

### Menu Options

- **File → Reset to Pink Noise**: Switch back to built-in pink noise
- **View → Toggle Full Screen**: Enter/exit full screen mode
- **View → Toggle Developer Tools**: Open/close developer console
- **Window → Minimize/Close**: Window management

## Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript with Canvas 2D API
- **Audio**: Web Audio API with pink noise generation
- **Desktop**: Electron for native desktop integration
- **Build**: Vite for fast development and building

### File Structure
```
calm-flow/
├── electron/
│   ├── main.js          # Main Electron process
│   └── preload.js       # Security preload script
├── src/
│   ├── app.js           # Main application logic
│   ├── audio/           # Audio engine
│   ├── input/           # Keystroke detection
│   ├── mapping/         # Parameter mapping
│   ├── ui/              # UI components
│   └── visual/          # Visual scene
├── assets/              # App icons and resources
└── dist/                # Built web assets
```

### Platform Support
- **Windows**: NSIS installer
- **macOS**: DMG package
- **Linux**: AppImage

## Development

### Prerequisites
- Node.js 18+
- npm

### Scripts
- `npm run dev`: Start Vite development server
- `npm run electron-dev`: Start Electron in development mode
- `npm run build`: Build web assets for production
- `npm run electron`: Start Electron with built assets
- `npm run dist`: Build distributable packages

### Debugging
- Use `Ctrl/Cmd + Shift + I` to open developer tools
- Check console for audio and visual parameter updates
- Monitor typing detection and breathing effects

## Privacy

- All keystroke analysis happens locally
- No data is sent to external servers
- Audio processing is done in real-time on your device
- No personal information is collected or stored

## License

ISC License - See package.json for details
