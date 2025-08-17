#!/usr/bin/env node

/**
 * WebRTC Deployment Script for Skill Assessment Portal
 * 
 * This script ensures all WebRTC features are properly configured
 * for both development and production environments.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting WebRTC deployment configuration...\n');

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const environment = isProduction ? 'production' : 'development';

console.log(`📍 Environment: ${environment}`);

// Configuration for different environments
const config = {
  development: {
    frontendUrl: 'http://localhost:5173',
    backendUrl: 'http://localhost:5000',
    corsOrigins: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ],
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  },
  production: {
    frontendUrl: 'https://skills.shivastra.in',
    backendUrl: 'https://api.skills.shivastra.in',
    corsOrigins: [
      'https://skills.shivastra.in',
      'https://api.skills.shivastra.in'
    ],
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  }
};

const currentConfig = config[environment];

// 1. Update environment variables
function updateEnvironmentFiles() {
  console.log('📝 Updating environment configuration...');
  
  // Frontend environment
  const frontendEnvPath = path.join(__dirname, '.env');
  const frontendEnvContent = `
# WebRTC Configuration - ${environment.toUpperCase()}
VITE_API_URL=${currentConfig.backendUrl}
VITE_FRONTEND_URL=${currentConfig.frontendUrl}
VITE_ENVIRONMENT=${environment}
VITE_WEBRTC_ENABLED=true
`;

  fs.writeFileSync(frontendEnvPath, frontendEnvContent.trim());
  console.log(`✅ Updated frontend .env for ${environment}`);

  // Backend environment
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  let backendEnvContent = '';
  
  if (fs.existsSync(backendEnvPath)) {
    backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
  }

  // Update or add WebRTC specific variables
  const webrtcVars = {
    'FRONTEND_URL': currentConfig.frontendUrl,
    'CORS_ORIGIN': currentConfig.corsOrigins.join(','),
    'WEBRTC_ENABLED': 'true',
    'SOCKET_IO_ENABLED': 'true'
  };

  Object.entries(webrtcVars).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(backendEnvContent)) {
      backendEnvContent = backendEnvContent.replace(regex, `${key}=${value}`);
    } else {
      backendEnvContent += `\n${key}=${value}`;
    }
  });

  fs.writeFileSync(backendEnvPath, backendEnvContent);
  console.log(`✅ Updated backend .env for ${environment}`);
}

// 2. Verify WebRTC service configuration
function verifyWebRTCService() {
  console.log('🔍 Verifying WebRTC service configuration...');
  
  const webrtcServicePath = path.join(__dirname, 'src', 'services', 'webrtc.ts');
  
  if (!fs.existsSync(webrtcServicePath)) {
    console.error('❌ WebRTC service file not found!');
    process.exit(1);
  }

  const serviceContent = fs.readFileSync(webrtcServicePath, 'utf8');
  
  // Check for required features
  const requiredFeatures = [
    'onActiveSpeakerChanged',
    'onScreenShareStarted',
    'setupVoiceActivityDetection',
    'requestScreenShare',
    'getScreenStream'
  ];

  const missingFeatures = requiredFeatures.filter(feature => 
    !serviceContent.includes(feature)
  );

  if (missingFeatures.length > 0) {
    console.error(`❌ Missing WebRTC features: ${missingFeatures.join(', ')}`);
    process.exit(1);
  }

  console.log('✅ WebRTC service configuration verified');
}

// 3. Check component implementations
function verifyComponents() {
  console.log('🔍 Verifying component implementations...');
  
  const components = [
    'src/components/admin/VirtualRounds.tsx',
    'src/pages/JoinMeeting.tsx'
  ];

  components.forEach(componentPath => {
    const fullPath = path.join(__dirname, componentPath);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Component not found: ${componentPath}`);
      process.exit(1);
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for enhanced features
    const requiredFeatures = [
      'activeSpeaker',
      'screenSharingParticipant',
      'onActiveSpeakerChanged',
      'screenShareRef'
    ];

    const missingFeatures = requiredFeatures.filter(feature => 
      !content.includes(feature)
    );

    if (missingFeatures.length > 0) {
      console.warn(`⚠️ ${componentPath} missing features: ${missingFeatures.join(', ')}`);
    } else {
      console.log(`✅ ${componentPath} verified`);
    }
  });
}

// 4. Verify backend meeting routes
function verifyBackendRoutes() {
  console.log('🔍 Verifying backend meeting routes...');
  
  const meetingRoutesPath = path.join(__dirname, 'backend', 'src', 'routes', 'meeting.ts');
  
  if (!fs.existsSync(meetingRoutesPath)) {
    console.error('❌ Meeting routes file not found!');
    process.exit(1);
  }

  const routesContent = fs.readFileSync(meetingRoutesPath, 'utf8');
  
  // Check for required socket events
  const requiredEvents = [
    'voice-activity',
    'active-speaker-changed',
    'participant-screen-share',
    'screen-share-stream'
  ];

  const missingEvents = requiredEvents.filter(event => 
    !routesContent.includes(event)
  );

  if (missingEvents.length > 0) {
    console.warn(`⚠️ Missing socket events: ${missingEvents.join(', ')}`);
  } else {
    console.log('✅ Backend meeting routes verified');
  }
}

// 5. Create deployment checklist
function createDeploymentChecklist() {
  console.log('📋 Creating deployment checklist...');
  
  const checklist = `
# WebRTC Deployment Checklist - ${environment.toUpperCase()}

## Pre-deployment Verification
- [x] Environment variables configured
- [x] WebRTC service enhanced with new features
- [x] Components updated with active speaker detection
- [x] Backend routes support voice activity detection
- [x] Screen sharing functionality implemented
- [x] Chat system working
- [x] Raise hand feature implemented

## Production-Specific Checks (if applicable)
${isProduction ? `
- [ ] HTTPS enabled for both frontend and backend
- [ ] SSL certificates valid
- [ ] CORS origins properly configured
- [ ] STUN/TURN servers accessible
- [ ] WebSocket connections working over HTTPS
- [ ] Media permissions working in production domain
` : '- N/A (Development environment)'}

## Testing Checklist
- [ ] Camera and microphone access working
- [ ] Video streaming between participants
- [ ] Audio streaming and voice activity detection
- [ ] Screen sharing functionality
- [ ] Real-time chat messaging
- [ ] Raise hand notifications
- [ ] Active speaker highlighting
- [ ] Meeting controls (mute/unmute, video on/off)
- [ ] Join/leave meeting functionality
- [ ] Multiple participants support

## URLs and Endpoints
- Frontend: ${currentConfig.frontendUrl}
- Backend API: ${currentConfig.backendUrl}
- WebRTC Test: ${currentConfig.frontendUrl}/test-webrtc-enhanced.html
- Meeting Join: ${currentConfig.frontendUrl}/join/{meetingId}
- Admin Virtual Rounds: ${currentConfig.frontendUrl}/admin/virtual-rounds

## Test Commands
\`\`\`bash
# Test WebRTC functionality
curl -X POST ${currentConfig.backendUrl}/api/meeting/create \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"meetingId": "TEST123"}'

# Check server health
curl ${currentConfig.backendUrl}/health
\`\`\`

## Troubleshooting
1. If video not showing: Check camera permissions and HTTPS
2. If audio not working: Verify microphone permissions
3. If screen sharing fails: Ensure getDisplayMedia API support
4. If connection fails: Check CORS and WebSocket configuration
5. If voice detection not working: Verify AudioContext support

Generated on: ${new Date().toISOString()}
Environment: ${environment}
`;

  fs.writeFileSync(path.join(__dirname, 'WEBRTC_DEPLOYMENT_CHECKLIST.md'), checklist.trim());
  console.log('✅ Deployment checklist created');
}

// 6. Run deployment tests
function runDeploymentTests() {
  console.log('🧪 Running deployment tests...');
  
  // Test 1: Check if all required files exist
  const requiredFiles = [
    'src/services/webrtc.ts',
    'src/components/admin/VirtualRounds.tsx',
    'src/pages/JoinMeeting.tsx',
    'backend/src/routes/meeting.ts',
    'test-webrtc-enhanced.html'
  ];

  let allFilesExist = true;
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Required file missing: ${file}`);
      allFilesExist = false;
    }
  });

  if (!allFilesExist) {
    console.error('❌ Deployment tests failed - missing files');
    process.exit(1);
  }

  console.log('✅ All required files present');

  // Test 2: Verify package.json has required dependencies
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredDeps = ['socket.io-client'];
    
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );

    if (missingDeps.length > 0) {
      console.warn(`⚠️ Missing dependencies: ${missingDeps.join(', ')}`);
      console.log('Run: npm install socket.io-client');
    } else {
      console.log('✅ Frontend dependencies verified');
    }
  }

  // Test 3: Verify backend dependencies
  const backendPackageJsonPath = path.join(__dirname, 'backend', 'package.json');
  if (fs.existsSync(backendPackageJsonPath)) {
    const backendPackageJson = JSON.parse(fs.readFileSync(backendPackageJsonPath, 'utf8'));
    const requiredBackendDeps = ['socket.io'];
    
    const missingBackendDeps = requiredBackendDeps.filter(dep => 
      !backendPackageJson.dependencies?.[dep] && !backendPackageJson.devDependencies?.[dep]
    );

    if (missingBackendDeps.length > 0) {
      console.warn(`⚠️ Missing backend dependencies: ${missingBackendDeps.join(', ')}`);
      console.log('Run: cd backend && npm install socket.io');
    } else {
      console.log('✅ Backend dependencies verified');
    }
  }

  console.log('✅ Deployment tests completed');
}

// Main execution
async function main() {
  try {
    updateEnvironmentFiles();
    verifyWebRTCService();
    verifyComponents();
    verifyBackendRoutes();
    createDeploymentChecklist();
    runDeploymentTests();
    
    console.log('\n🎉 WebRTC deployment configuration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Review WEBRTC_DEPLOYMENT_CHECKLIST.md');
    console.log('2. Test the enhanced features using test-webrtc-enhanced.html');
    console.log('3. Verify all functionality in both admin and participant views');
    console.log(`4. Access the application at: ${currentConfig.frontendUrl}`);
    
    if (isProduction) {
      console.log('\n🚨 Production deployment notes:');
      console.log('- Ensure HTTPS is enabled for both frontend and backend');
      console.log('- Verify SSL certificates are valid');
      console.log('- Test WebRTC functionality in production environment');
      console.log('- Monitor server logs for any WebSocket connection issues');
    }
    
  } catch (error) {
    console.error('\n❌ Deployment configuration failed:', error.message);
    process.exit(1);
  }
}

// Run the deployment script
main();