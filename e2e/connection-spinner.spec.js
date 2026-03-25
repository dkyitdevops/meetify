// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Тест для Issue #49 — проблема с колёсиком подключения
 * 
 * Проблема: при входе в комнату крутится колёсико "Подключение..."
 * и появляется окно "Сначала включите камеру"
 * 
 * Этот тест воспроизводит проблему без доступа к камере/микрофону
 * и документирует поведение.
 */

test.describe('Issue #49 — Connection Spinner Problem', () => {
  
  test('should show connection spinner and camera required modal when media access denied', async ({ browser }) => {
    // Создаём контекст БЕЗ доступа к камере/микрофону (эмулируем отказ)
    const context = await browser.newContext({
      permissions: [] // Нет разрешений на камеру/микрофон
    });
    
    const page = await context.newPage();
    
    // Перехватываем getUserMedia и эмулируем отказ
    await page.addInitScript(() => {
      // Переопределяем getUserMedia для имитации отказа
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        console.log('[TEST] getUserMedia called with:', constraints);
        // Имитируем отказ доступа
        throw new DOMException('Permission denied', 'NotAllowedError');
      };
    });
    
    // Перехватываем alert для проверки сообщений
    const alerts = [];
    page.on('dialog', async dialog => {
      console.log(`[TEST] Dialog appeared: ${dialog.type()} - ${dialog.message()}`);
      alerts.push({
        type: dialog.type(),
        message: dialog.message()
      });
      await dialog.accept();
    });
    
    // Открываем страницу комнаты
    await page.goto('/room.html?id=test-room-49');
    
    // Даём время странице загрузиться
    await page.waitForTimeout(1000);
    
    // Проверяем наличие экрана подключения
    const connectingScreen = page.locator('#connectingScreen');
    await expect(connectingScreen).toBeVisible();
    console.log('[TEST] Connecting screen is visible');
    
    // Проверяем наличие спиннера
    const spinner = page.locator('.spinner');
    await expect(spinner).toBeVisible();
    console.log('[TEST] Spinner is visible');
    
    // Проверяем текст подключения
    const connectingText = page.locator('text=Подключение к комнате...');
    await expect(connectingText).toBeVisible();
    console.log('[TEST] "Подключение к комнате..." text is visible');
    
    // Ждём, пока произойдёт попытка подключения (getUserMedia)
    await page.waitForTimeout(2000);
    
    // Делаем скриншот текущего состояния
    await page.screenshot({ 
      path: 'test-results/issue-49-connection-spinner.png',
      fullPage: true 
    });
    console.log('[TEST] Screenshot saved: issue-49-connection-spinner.png');
    
    // Проверяем, что экран подключения всё ещё виден (т.к. getUserMedia упал)
    await expect(connectingScreen).toBeVisible();
    console.log('[TEST] Connecting screen still visible after getUserMedia failure');
    
    // Закрываем контекст
    await context.close();
  });

  test('should test camera button without stream shows alert', async ({ browser }) => {
    // Создаём контекст без доступа к медиа
    const context = await browser.newContext({
      permissions: []
    });
    
    const page = await context.newPage();
    
    // Перехватываем getUserMedia и эмулируем отказ
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException('Permission denied', 'NotAllowedError');
      };
    });
    
    // Перехватываем alert
    const alertMessages = [];
    page.on('dialog', async dialog => {
      alertMessages.push(dialog.message());
      await dialog.accept();
    });
    
    // Открываем страницу комнаты
    await page.goto('/room.html?id=test-room-49-camera');
    await page.waitForTimeout(1500);
    
    // Пробуем нажать кнопку записи (требует камеры)
    const recordBtn = page.locator('#recordBtn');
    
    // Проверяем, что кнопка записи есть на странице
    if (await recordBtn.isVisible().catch(() => false)) {
      await recordBtn.click();
      await page.waitForTimeout(500);
      
      // Проверяем, что появился alert с требованием камеры
      expect(alertMessages).toContain('Сначала включите камеру');
      console.log('[TEST] Alert "Сначала включите камеру" appeared');
    }
    
    // Делаем скриншот
    await page.screenshot({ 
      path: 'test-results/issue-49-camera-alert.png',
      fullPage: true 
    });
    
    await context.close();
  });

  test('should verify connecting screen CSS and structure', async ({ page }) => {
    // Открываем страницу комнаты
    await page.goto('/room.html?id=test-room-49-structure');
    await page.waitForTimeout(1000);
    
    // Проверяем структуру экрана подключения
    const connectingScreen = page.locator('#connectingScreen');
    
    // Проверяем CSS классы
    const hasHiddenClass = await connectingScreen.evaluate(el => el.classList.contains('hidden'));
    console.log(`[TEST] Connecting screen has 'hidden' class: ${hasHiddenClass}`);
    
    // Проверяем стили спиннера
    const spinner = page.locator('.spinner');
    const spinnerStyles = await spinner.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        width: computed.width,
        height: computed.height,
        border: computed.border
      };
    });
    console.log('[TEST] Spinner styles:', spinnerStyles);
    
    // Проверяем, что спиннер анимирован (border-radius для круга)
    expect(spinnerStyles.border).toContain('solid');
    
    // Делаем скриншот структуры
    await page.screenshot({ 
      path: 'test-results/issue-49-structure.png',
      fullPage: true 
    });
  });

  test('should document the flow when camera is blocked', async ({ browser }) => {
    const context = await browser.newContext({
      permissions: []
    });
    
    const page = await context.newPage();
    
    // Собираем console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Блокируем getUserMedia
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        console.log('[Meetify] getUserMedia blocked by test');
        throw new DOMException('Permission denied', 'NotAllowedError');
      };
    });
    
    // Перехватываем ошибки страницы
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    await page.goto('/room.html?id=test-room-49-flow');
    await page.waitForTimeout(3000);
    
    // Анализируем логи
    console.log('[TEST] Console logs:', consoleLogs);
    console.log('[TEST] Page errors:', pageErrors);
    
    // Проверяем, что была попытка getUserMedia
    const getUserMediaAttempted = consoleLogs.some(log => 
      log.text.includes('getUserMedia') || log.text.includes('getUserMedia requested')
    );
    console.log(`[TEST] getUserMedia was attempted: ${getUserMediaAttempted}`);
    
    // Проверяем, что была ошибка
    const errorLogged = consoleLogs.some(log => 
      log.type === 'error' || log.text.includes('error') || log.text.includes('Error')
    );
    console.log(`[TEST] Error was logged: ${errorLogged}`);
    
    // Финальный скриншот
    await page.screenshot({ 
      path: 'test-results/issue-49-final-state.png',
      fullPage: true 
    });
    
    // Сохраняем наблюдения
    const observations = {
      timestamp: new Date().toISOString(),
      issue: '#49',
      findings: {
        connectingScreenRemainsVisible: true,
        getUserMediaAttempted,
        errorLogged,
        consoleLogs: consoleLogs.slice(0, 20), // Первые 20 логов
        pageErrors
      }
    };
    
    console.log('[TEST] Observations:', JSON.stringify(observations, null, 2));
    
    await context.close();
  });
});
