import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('===============================================================');
console.log('🚀 Starting SecureDocs Full-Stack Application (PBL-III Edition)');
console.log('📦 Frontend: Pure React.js (Vite, Port 3000)');
console.log('⚙️ Backend:  Pure Node.js + Express (Port 5001)');
console.log('🗄️ Database: MongoDB (Mongoose)');
console.log('===============================================================\n');

const isWindows = process.platform === 'win32';
const runnerCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Start Backend on Port 5001
const backend = spawn(runnerCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true,
});

// 2. Start Frontend on Port 3000
const frontend = spawn(runnerCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true,
});

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});
