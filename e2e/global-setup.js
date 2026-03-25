// global-setup.js
const { spawn } = require('child_process');
const path = require('path');

module.exports = async () => {
  console.log('[Global Setup] Starting AI Team Office server in TEST mode...');
  
  // Запускаем сервер с тестовыми данными
  const serverPath = path.join(__dirname, '..', 'ai-team-office', 'server', 'server.js');
  const server = spawn('node', [serverPath], {
    env: { 
      ...process.env, 
      NODE_ENV: 'test', 
      PORT: '3001',
      TEST_MODE: 'true'  // Включаем тестовый режим
    },
    stdio: 'pipe'
  });
  
  // Сохраняем PID для последующего завершения
  global.__SERVER_PID__ = server.pid;
  global.__SERVER__ = server;
  
  // Ждем запуска сервера
  await new Promise((resolve, reject) => {
    let output = '';
    server.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`[Server] ${data.toString().trim()}`);
      if (output.includes('server running')) {
        console.log('[Global Setup] Server is ready');
        resolve();
      }
    });
    
    server.stderr.on('data', (data) => {
      console.error(`[Server Error] ${data}`);
    });
    
    setTimeout(() => {
      reject(new Error('Server failed to start within 30 seconds'));
    }, 30000);
  });
  
  // Даем серверу время на инициализацию
  await new Promise(r => setTimeout(r, 2000));
};
