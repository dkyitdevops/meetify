const http = require('http');
const https = require('https');
const fs = require('fs');

// Цвета для вывода
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(step, message, type = 'info') {
  const color = type === 'error' ? colors.red : type === 'success' ? colors.green : type === 'warn' ? colors.yellow : colors.cyan;
  console.log(`${color}${step}${colors.reset} ${message}`);
}

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runDetailedTest() {
  console.log('\n🧪 ДЕТАЛЬНЫЙ ТЕСТ MEETIFY (GitHub Issue #49)\n');
  console.log('═══════════════════════════════════════════════════\n');
  
  const BASE_URL = 'https://46-149-68-9.nip.io';
  const logs = [];
  let roomId = null;
  
  function addLog(message) {
    logs.push(`[${new Date().toISOString()}] ${message}`);
  }
  
  try {
    // 1. Проверка главной страницы
    log('1️⃣', 'Проверка главной страницы...');
    const mainPage = await fetch(BASE_URL + '/');
    addLog(`GET / - Status: ${mainPage.status}`);
    
    if (mainPage.status === 200) {
      log('', '✅ Главная страница доступна', 'success');
      
      // Проверяем наличие ключевых элементов
      const hasCreateButton = mainPage.data.includes('Создать комнату');
      const hasPreJoinScreen = mainPage.data.includes('preJoinScreen');
      const hasConnectingScreen = mainPage.data.includes('connectingScreen');
      
      log('', `   - Кнопка "Создать комнату": ${hasCreateButton ? '✅' : '❌'}`, hasCreateButton ? 'success' : 'error');
      log('', `   - PreJoinScreen элемент: ${hasPreJoinScreen ? '✅' : '❌'}`, hasPreJoinScreen ? 'success' : 'error');
      log('', `   - ConnectingScreen элемент: ${hasConnectingScreen ? '✅' : '❌'}`, hasConnectingScreen ? 'success' : 'error');
    } else {
      log('', `❌ Ошибка: HTTP ${mainPage.status}`, 'error');
    }
    console.log();
    
    // 2. Проверка health endpoint
    log('2️⃣', 'Проверка health endpoint...');
    const health = await fetch(BASE_URL + '/health');
    addLog(`GET /health - Status: ${health.status}`);
    
    if (health.status === 200) {
      try {
        const healthData = JSON.parse(health.data);
        log('', `✅ Health check: ${healthData.status || 'OK'}`, 'success');
        log('', `   - Ответ: ${JSON.stringify(healthData)}`, 'info');
      } catch (e) {
        log('', `⚠️ Health вернул не-JSON: ${health.data.substring(0, 100)}`, 'warn');
      }
    } else {
      log('', `⚠️ Health endpoint вернул: ${health.status}`, 'warn');
    }
    console.log();
    
    // 3. Создание комнаты через API
    log('3️⃣', 'Создание комнаты через API...');
    const createRoom = await fetch(BASE_URL + '/api/rooms', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    addLog(`POST /api/rooms - Status: ${createRoom.status}`);
    
    if (createRoom.status === 200 || createRoom.status === 201) {
      try {
        const roomData = JSON.parse(createRoom.data);
        roomId = roomData.roomId;
        log('', `✅ Комната создана: ${roomId}`, 'success');
        log('', `   - Ответ: ${JSON.stringify(roomData)}`, 'info');
      } catch (e) {
        log('', `⚠️ Некорректный JSON: ${createRoom.data.substring(0, 100)}`, 'warn');
      }
    } else {
      log('', `❌ Ошибка создания комнаты: HTTP ${createRoom.status}`, 'error');
      log('', `   - Ответ: ${createRoom.data.substring(0, 200)}`, 'error');
    }
    console.log();
    
    // 4. Проверка Socket.io endpoint
    log('4️⃣', 'Проверка Socket.io endpoint...');
    const socketCheck = await fetch(BASE_URL + '/socket.io/?EIO=4');
    addLog(`GET /socket.io/?EIO=4 - Status: ${socketCheck.status}`);
    
    if (socketCheck.status !== 404) {
      log('', `✅ Socket.io доступен (HTTP ${socketCheck.status})`, 'success');
      try {
        const socketData = JSON.parse(socketCheck.data.replace(/^\d+/, ''));
        log('', `   - Версия Engine.IO: ${socketData.maxPayload || 'unknown'}`, 'info');
        log('', `   - Транспорты: ${socketData.upgrades?.join(', ') || 'polling'}`, 'info');
      } catch (e) {
        log('', `   - Ответ: ${socketCheck.data.substring(0, 100)}`, 'info');
      }
    } else {
      log('', `❌ Socket.io не найден (404)`, 'error');
    }
    console.log();
    
    // 5. Проверка комнаты
    if (roomId) {
      log('5️⃣', `Проверка комнаты ${roomId}...`);
      const roomCheck = await fetch(`${BASE_URL}/room/${roomId}`);
      addLog(`GET /room/${roomId} - Status: ${roomCheck.status}`);
      
      if (roomCheck.status === 200) {
        log('', '✅ Страница комнаты доступна', 'success');
        
        // Проверяем наличие ключевых элементов
        const hasPreJoin = roomCheck.data.includes('preJoinScreen') || roomCheck.data.includes('pre-join');
        const hasConnecting = roomCheck.data.includes('connectingScreen') || roomCheck.data.includes('connecting');
        const hasRoomInterface = roomCheck.data.includes('roomInterface') || roomCheck.data.includes('room-interface');
        const hasJoinButton = roomCheck.data.includes('Войти в комнату');
        
        log('', `   - PreJoin элемент: ${hasPreJoin ? '✅' : '❌'}`, hasPreJoin ? 'success' : 'warn');
        log('', `   - Connecting элемент: ${hasConnecting ? '✅' : '❌'}`, hasConnecting ? 'success' : 'warn');
        log('', `   - RoomInterface элемент: ${hasRoomInterface ? '✅' : '❌'}`, hasRoomInterface ? 'success' : 'warn');
        log('', `   - Кнопка "Войти": ${hasJoinButton ? '✅' : '❌'}`, hasJoinButton ? 'success' : 'warn');
        
        // Проверка JavaScript на наличие обработчиков
        const hasPrejoinHandler = roomCheck.data.includes('prejoin') || roomCheck.data.includes('preJoin');
        const hasSocketHandler = roomCheck.data.includes('socket.io') || roomCheck.data.includes('io(');
        const hasWebRTC = roomCheck.data.includes('getUserMedia') || roomCheck.data.includes('RTCPeerConnection');
        
        log('', `   - Prejoin обработчики: ${hasPrejoinHandler ? '✅' : '❌'}`, hasPrejoinHandler ? 'success' : 'warn');
        log('', `   - Socket.io клиент: ${hasSocketHandler ? '✅' : '❌'}`, hasSocketHandler ? 'success' : 'warn');
        log('', `   - WebRTC код: ${hasWebRTC ? '✅' : '❌'}`, hasWebRTC ? 'success' : 'warn');
        
      } else {
        log('', `⚠️ Страница комнаты вернула: HTTP ${roomCheck.status}`, 'warn');
      }
    } else {
      log('5️⃣', 'Пропуск проверки комнаты (roomId не получен)', 'warn');
    }
    console.log();
    
    // 6. Проверка статических ресурсов
    log('6️⃣', 'Проверка статических ресурсов...');
    const jsFiles = ['/app.js', '/client.js', '/main.js'];
    for (const js of jsFiles) {
      try {
        const jsCheck = await fetch(BASE_URL + js);
        addLog(`GET ${js} - Status: ${jsCheck.status}`);
        if (jsCheck.status === 200) {
          log('', `✅ ${js} (${Math.round(jsCheck.data.length / 1024)} KB)`, 'success');
          
          // Анализируем JS на наличие ключевых функций
          const hasPrejoinComplete = jsCheck.data.includes('prejoinComplete');
          const hasJoinRoom = jsCheck.data.includes('joinRoom') || jsCheck.data.includes('join-room');
          const hasSocketEvents = jsCheck.data.includes('socket.on') || jsCheck.data.includes('.on(');
          
          if (hasPrejoinComplete || hasJoinRoom || hasSocketEvents) {
            log('', `   - prejoinComplete: ${hasPrejoinComplete ? '✅' : '❌'}`, hasPrejoinComplete ? 'success' : 'warn');
            log('', `   - joinRoom: ${hasJoinRoom ? '✅' : '❌'}`, hasJoinRoom ? 'success' : 'warn');
            log('', `   - socket events: ${hasSocketEvents ? '✅' : '❌'}`, hasSocketEvents ? 'success' : 'warn');
          }
          break; // Нашли основной JS файл
        }
      } catch (e) {
        // Файл не найден, пробуем следующий
      }
    }
    console.log();
    
    // 7. Анализ проблемы из Issue #49
    log('7️⃣', 'АНАЛИЗ ПРОБЛЕМЫ (Issue #49)...', 'warn');
    console.log();
    console.log('   📋 Проблема: Пользователь видит проблему, но тесты её не находят');
    console.log('   🔍 Возможные причины:');
    console.log();
    console.log('   1. Рассинхронизация UI и состояния:');
    console.log('      - UI показывает "подключение", но socket уже отключился');
    console.log('      - connectingScreen не скрывается при ошибке');
    console.log();
    console.log('   2. Ошибка в логике prejoinComplete:');
    console.log('      - Событие не отправляется на сервер');
    console.log('      - Сервер не обрабатывает событие');
    console.log('      - Ответ от сервера не обрабатывается клиентом');
    console.log();
    console.log('   3. WebRTC проблемы:');
    console.log('      - getUserMedia не запрашивается или отклоняется');
    console.log('      - Ошибка до инициализации peer connection');
    console.log();
    
    // Сохраняем логи
    fs.writeFileSync('/tmp/test-logs.txt', logs.join('\n'));
    log('', '💾 Логи сохранены в /tmp/test-logs.txt', 'info');
    
    // Итог
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 РЕЗУЛЬТАТЫ ТЕСТА:');
    console.log('═══════════════════════════════════════════════════');
    
    const checks = [
      { name: 'Главная страница', pass: mainPage.status === 200 },
      { name: 'Health endpoint', pass: health.status === 200 },
      { name: 'Создание комнаты', pass: roomId !== null },
      { name: 'Socket.io доступен', pass: socketCheck.status !== 404 }
    ];
    
    let passed = 0;
    for (const check of checks) {
      if (check.pass) {
        log('', `✅ ${check.name}`, 'success');
        passed++;
      } else {
        log('', `❌ ${check.name}`, 'error');
      }
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log(`Всего: ${passed}/${checks.length} проверок пройдено`);
    
    if (passed === checks.length) {
      console.log('\n🎉 Базовые проверки пройдены');
      console.log('⚠️  Но проблема из Issue #49 требует браузерного тестирования');
      console.log('   (невозможно в данном окружении из-за отсутствия системных библиотек)');
      return 0;
    } else {
      console.log('\n💥 Есть проблемы с базовой функциональностью');
      return 1;
    }
    
  } catch (error) {
    console.error('\n💥 КРИТИЧЕСКАЯ ОШИБКА:', error.message);
    console.error(error.stack);
    fs.writeFileSync('/tmp/test-logs.txt', logs.join('\n') + '\n\nERROR: ' + error.message);
    return 1;
  }
}

runDetailedTest().then(code => process.exit(code));
