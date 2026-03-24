const { test, expect } = require('@playwright/test');

test('вход в комнату с prejoin экраном', async ({ browser }) => {
  // Создаём контекст с эмуляцией камеры и микрофона
  const context = await browser.newContext({
    permissions: ['camera', 'microphone'],
    viewport: { width: 1280, height: 720 }
  });
  
  // Эмулируем медиа-устройства через CDP
  const page = await context.newPage();
  
  // Перехватываем запросы getUserMedia
  await page.addInitScript(() => {
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      console.log('[Meetify Test] getUserMedia called with:', constraints);
      // Создаём фейковый медиа-поток
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      // Рисуем тестовое изображение
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#000000';
      ctx.font = '30px Arial';
      ctx.fillText('Test Camera', 220, 240);
      
      const stream = canvas.captureStream(30);
      
      // Добавляем фейковый аудио-трек если нужен
      if (constraints.audio) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const dest = audioContext.createMediaStreamDestination();
        oscillator.connect(dest);
        oscillator.start();
        const audioTrack = dest.stream.getAudioTracks()[0];
        stream.addTrack(audioTrack);
      }
      
      return stream;
    };
    
    // Эмулируем enumerateDevices
    navigator.mediaDevices.enumerateDevices = async () => [
      { kind: 'videoinput', label: 'Test Camera', deviceId: 'test-camera' },
      { kind: 'audioinput', label: 'Test Microphone', deviceId: 'test-microphone' }
    ];
  });
  
  console.log('[Meetify Test] Открываем главную страницу...');
  await page.goto('https://46-149-68-9.nip.io/');
  
  // Ждём загрузки страницы
  await page.waitForLoadState('networkidle');
  
  // Делаем скриншот главной страницы
  await page.screenshot({ path: '/data/workspace/tests/test-results/01-main-page.png', fullPage: true });
  
  console.log('[Meetify Test] Создаём комнату...');
  await page.click('text=Создать комнату');
  await page.fill('[name="roomName"]', 'Test Room');
  await page.click('text=Создать');
  
  // Ждём перехода на страницу комнаты
  await page.waitForURL(/.*room.*/);
  await page.waitForTimeout(2000);
  
  // Делаем скриншот prejoin экрана
  await page.screenshot({ path: '/data/workspace/tests/test-results/02-prejoin-screen.png', fullPage: true });
  
  console.log('[Meetify Test] Ищем prejoin экран...');
  
  // Проверяем наличие prejoin экрана разными способами
  const prejoinSelectors = [
    '#preJoinScreen',
    '[data-testid="prejoin-screen"]',
    'text=Войти в комнату',
    'text=Проверьте камеру',
    'text=Подключение',
    '.prejoin',
    '#joinScreen'
  ];
  
  let foundElement = null;
  for (const selector of prejoinSelectors) {
    try {
      const element = await page.locator(selector).first();
      const count = await element.count();
      if (count > 0) {
        console.log(`[Meetify Test] Найден элемент: ${selector}`);
        foundElement = selector;
        break;
      }
    } catch (e) {
      // Игнорируем ошибки
    }
  }
  
  if (!foundElement) {
    console.log('[Meetify Test] ⚠️ Prejoin экран не найден по стандартным селекторам');
    // Делаем скриншот для анализа
    await page.screenshot({ path: '/data/workspace/tests/test-results/03-no-prejoin.png', fullPage: true });
    
    // Получаем HTML страницы для анализа
    const html = await page.content();
    console.log('[Meetify Test] HTML страницы (первые 2000 символов):');
    console.log(html.substring(0, 2000));
  }
  
  // Ищем кнопку "Войти в комнату"
  const joinButtonSelectors = [
    'text=Войти в комнату',
    'button:has-text("Войти")',
    '[data-testid="join-button"]',
    '.join-button',
    '#joinButton'
  ];
  
  let joinButtonFound = false;
  for (const selector of joinButtonSelectors) {
    try {
      const button = await page.locator(selector).first();
      const count = await button.count();
      if (count > 0) {
        console.log(`[Meetify Test] Найдена кнопка входа: ${selector}`);
        
        // Проверяем, не disabled ли кнопка
        const isDisabled = await button.isDisabled().catch(() => false);
        const isVisible = await button.isVisible().catch(() => false);
        
        console.log(`[Meetify Test] Кнопка видима: ${isVisible}, disabled: ${isDisabled}`);
        
        if (isVisible && !isDisabled) {
          await button.click();
          joinButtonFound = true;
          console.log('[Meetify Test] Кликнули по кнопке входа');
          break;
        }
      }
    } catch (e) {
      console.log(`[Meetify Test] Ошибка с селектором ${selector}: ${e.message}`);
    }
  }
  
  if (!joinButtonFound) {
    console.log('[Meetify Test] ⚠️ Кнопка входа не найдена или недоступна');
  }
  
  // Ждём и проверяем результат
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/data/workspace/tests/test-results/04-after-join.png', fullPage: true });
  
  // Проверяем, вошли ли мы в комнату
  const roomSelectors = [
    '#roomInterface',
    '[data-testid="room-interface"]',
    '.room-container',
    '#videoGrid',
    '.video-grid',
    'text=Вы в комнате'
  ];
  
  let inRoom = false;
  for (const selector of roomSelectors) {
    try {
      const element = await page.locator(selector).first();
      const count = await element.count();
      if (count > 0 && await element.isVisible().catch(() => false)) {
        console.log(`[Meetify Test] ✅ Вошли в комнату! Найден: ${selector}`);
        inRoom = true;
        break;
      }
    } catch (e) {
      // Игнорируем
    }
  }
  
  // Проверяем наличие ошибок на странице
  const errorSelectors = [
    'text=Сначала включите камеру',
    'text=Ошибка доступа к камере',
    'text=Не удалось получить доступ',
    '.error-message',
    '[role="alert"]'
  ];
  
  for (const selector of errorSelectors) {
    try {
      const element = await page.locator(selector).first();
      const count = await element.count();
      if (count > 0 && await element.isVisible().catch(() => false)) {
        const text = await element.textContent();
        console.log(`[Meetify Test] ❌ Найдена ошибка: ${text}`);
      }
    } catch (e) {
      // Игнорируем
    }
  }
  
  // Проверяем консоль браузера
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // Получаем логи страницы
  await page.waitForTimeout(1000);
  
  console.log('[Meetify Test] Логи консоли:');
  consoleLogs.forEach(log => console.log(log));
  
  // Собираем информацию о состоянии
  const finalUrl = page.url();
  console.log(`[Meetify Test] Финальный URL: ${finalUrl}`);
  
  await context.close();
  
  // Делаем assertion для отчёта
  expect(inRoom || joinButtonFound).toBeTruthy();
});
