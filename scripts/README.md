# 🚀 Skill Assessment Portal - Professional Build System

This directory contains enhanced build and development scripts with professional terminal styling, timestamps, and comprehensive logging.

## 📁 Scripts Overview

### `build.js` - Professional Build Pipeline

- Enhanced build output with timestamps and technical styling
- Step-by-step progress tracking
- Error handling with detailed diagnostics
- Professional headers and footers

### `dev.js` - Development Environment Manager

- Concurrent frontend and backend development servers
- Color-coded output with service prefixes
- Real-time timestamp logging
- Graceful shutdown handling

### `production.js` - Production Deployment Manager

- Pre-flight checks for build artifacts
- System information display
- Production-ready server management
- Health monitoring capabilities

### `status.js` - System Health Monitor

- Comprehensive system health checks
- Network service availability testing
- Dependency verification
- Environment configuration validation

## 🎨 Features

### Professional Terminal Styling

- **Color-coded output** for different services and log levels
- **Unicode symbols** for visual clarity and modern appearance
- **Timestamped logs** for debugging and monitoring
- **Formatted headers/footers** for clear section separation

### Technical Enhancements

- **Real-time process monitoring** with prefixed output
- **Error handling** with detailed stack traces
- **System diagnostics** including memory usage and platform info
- **Network health checks** for API endpoints

### Visual Elements

- 🚀 Rocket for launches and builds
- ⚙️ Gear for processes and operations
- 💻 Computer for frontend services
- 🗄️ Database for backend services
- ✓ Checkmark for success states
- ❌ Cross for error states
- ⚠️ Warning for attention items
- 🛡️ Shield for security and production

## 🔧 Usage

### Development Mode

```bash
npm run dev
```

Starts both frontend and backend with enhanced logging.

### Production Build

```bash
npm run build
```

Professional build pipeline with progress tracking.

### Production Deployment

```bash
npm run production:start
```

Deploys production servers with pre-flight checks.

### System Health Check

```bash
npm run status
```

Comprehensive system diagnostics and health monitoring.

### Complete Setup

```bash
npm run setup
```

Full environment setup: install dependencies, build, and seed database.

## 📊 Output Examples

### Build Output

```
════════════════════════════════════════════════════════════════════════════════
  🚀 SKILL ASSESSMENT PORTAL - BUILD SYSTEM
     Full-Stack TypeScript Application Build Pipeline
     ⏱ 2025-07-09 14:30:25
════════════════════════════════════════════════════════════════════════════════

⚙ [STEP 1/2] Building Backend Services
     └─ npm run build
✓ Backend TypeScript compilation completed in 3.45s

⚙ [STEP 2/2] Building Frontend Application
     └─ npm run build
✓ Frontend React application build completed in 12.67s

════════════════════════════════════════════════════════════════════════════════
  ✨ BUILD COMPLETED SUCCESSFULLY
     ⏱ Finished at 2025-07-09 14:30:41
════════════════════════════════════════════════════════════════════════════════
```

### Development Output

```
════════════════════════════════════════════════════════════════════════════════
  🚀 SKILL ASSESSMENT PORTAL - DEVELOPMENT MODE
     Full-Stack Development Environment
     ⏱ Started at 14:30:25
════════════════════════════════════════════════════════════════════════════════

💻 Frontend Dev Server: http://localhost:5173
🗄 Backend API Server: http://localhost:5002
⚡ Hot Reload: Enabled

Press Ctrl+C to stop all servers
────────────────────────────────────────────────────────────────────────────────

[14:30:26] [BACKEND] Server running on port 5002
[14:30:27] [FRONTEND] Local: http://localhost:5173/
[14:30:27] [FRONTEND] ready in 1245ms
```

## 🛠️ Customization

You can customize the styling by modifying the color codes and symbols in each script:

```javascript
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  // ... add your preferred colors
};

const symbols = {
  rocket: "🚀",
  gear: "⚙",
  // ... add your preferred symbols
};
```

## 🔍 Troubleshooting

### Colors Not Showing

- Ensure your terminal supports ANSI color codes
- On Windows, use Windows Terminal or PowerShell Core

### Scripts Not Executing

- Verify Node.js is installed and accessible
- Check that scripts have proper permissions
- Ensure all dependencies are installed

---

_Built with ❤️ for the Skill Assessment Portal_
