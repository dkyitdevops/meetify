const { test, expect } = require('@playwright/test');
const fs = require('fs');

test.describe('Meetify Detailed Tests - Issue #49', () => {
  
  test('полный сценарий входа в комнату с детальными проверками', async ({ page }) => {
    const logs = [];
    const networkLogs = [];
    
    // Собирать все логи консоли
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      logs.push(text);
      console.log('📋 Console:', text);
    });
    
    page.on('pageerror', error => {
      const text = `ERROR: ${error.message}`;
      logs.push(text);
      console.log('❌ Page Error:', error.message);
    });
    
    // Собирать сетевые запросы
    page.on('request', request => {
      networkLogs.push(`REQUEST: ${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
      networkLogs.push(`RESPONSE: ${response.status()} ${response.url()}`);
    });
    
    page.on('requestfailed', request => {
      networkLogs.push(`FAILED: ${request.method()} ${request.url()} - ${request.failure().errorText}`);
      console.log('⚠️ Request Failed:', request.url());
    });

    // 1. Открыть главную
    console.log('\n1️⃣ Открываем главную страницу...');
    const response = await page.goto('https://46-149-68-9.nip.io/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    expect(response.status()).toBe(200);
    console.log('   ✅ Страница загружена (HTTP 200)\n');
    
    // 2. Проверить наличие кнопки "Создать комнату"
    console.log('2️⃣ Проверяем наличие кнопки "Создать комнату"...');
    const createButton = page.locator('button:has-text("Создать комнату")');
    await expect(createButton).toBeVisible({ timeout: 10000 });
    console.log('   ✅ Кнопка "Создать комнату" видна\n');
    
    // 3. Кликнуть "Создать комнату"
    console.log('3️⃣ Кликаем "Создать комнату"...');
    await createButton.click();
    console.log('   ✅ Кнопка нажата\n');
    
    // 4. Ждать модальное окно
    console.log('4️⃣ Ждём модальное окно создания комнаты...');
    const modal = page.locator('#createRoomModal');
    await expect(modal).toBeVisible({ timeout: 10000 });
    console.log('   ✅ Модальное окно открылось\n');
    
    // 5. Ввести название комнаты
    console.log('5️⃣ Вводим название комнаты...');
    const roomNameInput = page.locator('#roomName');
    await roomNameInput.fill('Test Room QA ' + Date.now());
    console.log('   ✅ Название введено\n');
    
    // 6. Нажать кнопку "Создать"
    console.log('6️⃣ Нажимаем кнопку "Создать"...');
    const submitButton = page.locator('#createRoomModal button:has-text("Создать")');
    await submitButton.click();
    console.log('   ✅ Кнопка "Создать" нажата\n');
    
    // 7. Ждать перехода на страницу комнаты
    console.log('7️⃣ Ждём перехода на страницу комнаты...');
    await page.waitForURL(/\/room\//, { timeout: 15000 });
    const roomUrl = page.url();
    console.log(`   ✅ Перешли на страницу комнаты: ${roomUrl}\n`);
    
    // 8. Ждать prejoin экран
    console.log('8️⃣ Ждём prejoin экран...');
    const preJoinScreen = page.locator('#preJoinScreen');
    await expect(preJoinScreen).toBeVisible({ timeout: 15000 });
    console.log('   ✅ Prejoin экран виден\n');
    
    // 9. Проверить наличие кнопки "Войти в комнату"
    console.log('9️⃣ Проверяем кнопку "Войти в комнату"...');
    const joinButton = page.locator('button:has-text("Войти в комнату")');
    await expect(joinButton).toBeVisible({ timeout: 10000 });
    await expect(joinButton).toBeEnabled({ timeout: 10000 });
    console.log('   ✅ Кнопка "Войти в комнату" видна и активна\n');
    
    // 10. Проверить что connectingScreen скрыт изначально
    console.log('🔟 Проверяем что connectingScreen скрыт...');
    const connectingScreen = page.locator('#connectingScreen');
    const isConnectingHidden = await connectingScreen.evaluate(el => {
      return el.style.display === 'none' || getComputedStyle(el).display === 'none';
    }).catch(() => true);
    console.log(`   ${isConnectingHidden ? '✅' : '⚠️'} Connecting screen скрыт изначально: ${isConnectingHidden}\n`);
    
    // 11. Нажать "Войти в комнату"
    console.log('1️⃣1️⃣ Нажимаем "Войти в комнату"...');
    await joinButton.click();
    console.log('   ✅ Кнопка "Войти" нажата\n');
    
    // 12. Ждём и проверяем состояние
    console.log('1️⃣2️⃣ Ждём 5 секунд и проверяем состояние...');
    await page.waitForTimeout(5000);
    
    // Проверяем состояние экранов
    const state = await page.evaluate(() => {
      const connecting = document.querySelector('#connectingScreen');
      const roomInterface = document.querySelector('#roomInterface');
      const preJoin = document.querySelector('#preJoinScreen');
      
      return {
        connectingVisible: connecting ? 
          (connecting.style.display !== 'none' && getComputedStyle(connecting).display !== 'none') : false,
        roomVisible: roomInterface ? 
          (roomInterface.style.display !== 'none' && getComputedStyle(roomInterface).display !== 'none') : false,
        preJoinVisible: preJoin ? 
          (preJoin.style.display !== 'none' && getComputedStyle(preJoin).display !== 'none') : false,
        connectingDisplay: connecting ? connecting.style.display : 'not found',
        roomDisplay: roomInterface ? roomInterface.style.display : 'not found',
        preJoinDisplay: preJoin ? preJoin.style.display : 'not found'
      };
    });
    
    console.log('   📊 Состояние экранов:');
    console.log(`      - Connecting screen: ${state.connectingVisible ? 'ВИДЕН ⚠️' : 'скрыт ✅'}`);
    console.log(`      - Room interface: ${state.roomVisible ? 'ВИДЕН ✅' : 'скрыт ❌'}`);
    console.log(`      - Prejoin screen: ${state.preJoinVisible ? 'ВИДЕН' : 'скрыт'}`);
    console.log(`      - (connectingDisplay: ${state.connectingDisplay})`);
    console.log(`      - (roomDisplay: ${state.roomDisplay})`);
    console.log(`      - (preJoinDisplay: ${state.preJoinDisplay})\n`);
    
    // 13. Анализ логов
    console.log('1️⃣3️⃣ Анализ логов консоли...');
    console.log(`   Всего логов: ${logs.length}`);
    
    const hasPrejoinComplete = logs.some(l => l.includes('prejoinComplete'));
    const hasRoomJoined = logs.some(l => 
      l.includes('room:joined') || 
      l.includes('connected') || 
      l.includes('join:success')
    );
    const hasErrors = logs.some(l => 
      l.includes('ERROR') || 
      l.includes('error') || 
      l.includes('failed')
    );
    const hasSocketError = logs.some(l => 
      l.includes('socket') && (l.includes('error') || l.includes('disconnect'))
    );
    
    console.log(`   - prejoinComplete в логах: ${hasPrejoinComplete ? '✅ Да' : '❌ Нет'}`);
    console.log(`   - room:joined в логах: ${hasRoomJoined ? '✅ Да' : '❌ Нет'}`);
    console.log(`   - Ошибки в логах: ${hasErrors ? '⚠️ Есть' : '✅ Нет'}`);
    console.log(`   - Socket ошибки: ${hasSocketError ? '⚠️ Есть' : '✅ Нет'}\n`);
    
    // 14. Сохранить логи
    console.log('1️⃣4️⃣ Сохраняем логи...');
    fs.writeFileSync('/tmp/test-logs.txt', 
      '=== CONSOLE LOGS ===\n' + logs.join('\n') + 
      '\n\n=== NETWORK LOGS ===\n' + networkLogs.join('\n')
    );
    
    // Скриншот
    await page.screenshot({ path: '/tmp/test-screenshot.png', fullPage: true });
    console.log('   ✅ Логи сохранены в /tmp/test-logs.txt');
    console.log('   ✅ Скриншот сохранён в /tmp/test-screenshot.png\n');
    
    // 15. ИТОГОВЫЕ ПРОВЕРКИ (Issue #49)
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 ИТОГОВЫЕ ПРОВЕРКИ (Issue #49):');
    console.log('═══════════════════════════════════════════════════');
    
    // Проверка 1: Не должно быть бесконечного подключения
    console.log('\n1. Проверка на бесконечное подключение:');
    if (state.connectingVisible) {
      console.log('   ❌ FAIL: Connecting screen всё ещё виден через 5 секунд');
      console.log('   🐛 ЭТО ПРОБЛЕМА из Issue #49!');
    } else {
      console.log('   ✅ PASS: Connecting screen скрыт');
    }
    
    // Проверка 2: Room interface должен быть виден ИЛИ должно быть подтверждение в логах
    console.log('\n2. Проверка успешного входа:');
    const successfullyJoined = state.roomVisible || hasPrejoinComplete || hasRoomJoined;
    if (successfullyJoined) {
      console.log('   ✅ PASS: Успешно вошли в комнату');
      console.log(`      - Room visible: ${state.roomVisible}`);
      console.log(`      - prejoinComplete: ${hasPrejoinComplete}`);
      console.log(`      - room:joined: ${hasRoomJoined}`);
    } else {
      console.log('   ❌ FAIL: Room interface не виден и нет подтверждения в логах');
      console.log('   🐛 Возможно событие prejoinComplete не отправляется/не обрабатывается!');
    }
    
    // Проверка 3: Нет критических ошибок
    console.log('\n3. Проверка на ошибки:');
    if (hasErrors) {
      console.log('   ⚠️ WARN: Обнаружены ошибки в консоли');
      const errorLogs = logs.filter(l => l.includes('ERROR') || l.includes('error'));
      console.log('   Логи ошибок:');
      errorLogs.slice(0, 5).forEach(l => console.log(`      ${l}`));
    } else {
      console.log('   ✅ PASS: Ошибок в консоли нет');
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    
    // Финальные assertions
    expect(state.connectingVisible).toBe(false); // Не должно быть бесконечного подключения
    expect(successfullyJoined).toBe(true); // Должны успешно войти
  });
});
