const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up production environment...');

try {
  // 1. Build the application
  console.log('📦 Building application...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Run database migrations and optimizations
  console.log('🗄️ Setting up database...');
  execSync('node scripts/optimize-database.js', { stdio: 'inherit' });

  // 3. Seed database with initial data
  console.log('🌱 Seeding database...');
  execSync('npm run seed', { stdio: 'inherit' });

  // 4. Create production directories
  const dirs = ['logs', 'uploads', 'backups'];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created ${dir} directory`);
    }
  });

  // 5. Set up log rotation
  const logConfig = {
    logs: {
      level: 'info',
      filename: 'logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false,
      timestamp: true
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'logs', 'config.json'), 
    JSON.stringify(logConfig, null, 2)
  );

  console.log('✅ Production setup completed successfully!');
  console.log('');
  console.log('🎯 Next steps:');
  console.log('  1. Set environment variables in production');
  console.log('  2. Configure reverse proxy (nginx)');
  console.log('  3. Set up SSL certificates');
  console.log('  4. Configure monitoring');
  console.log('  5. Start application: npm start');

} catch (error) {
  console.error('❌ Production setup failed:', error.message);
  process.exit(1);
}