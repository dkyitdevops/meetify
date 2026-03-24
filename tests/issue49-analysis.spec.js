const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://46-149-68-9.nip.io';

test.describe('Issue #49 - Анализ проблемы входа в комнату', () => {
  
  test('Анализ кода room.html и room.js', async ({ page }) => {
    // Открываем страницу комнаты напрямую
    await page.goto(`${BASE_URL}/room.html?id=test-room-123`);
    
    // Ждём загрузки страницы
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Делаем скриншот начального состояния
    await page.screenshot({ path: '/data/workspace/tests/test-results/issue49-initial-state.png', fullPage: true });
    
    // Собираем информацию о видимых элементах
    const visibleElements = await page.evaluate(() => {
      const elements = [];
      const checkElement = (selector, name) => {
        const el = document.querySelector(selector);
        if (el) {
          const style = window.getComputedStyle(el);
          const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
          elements.push({
            name,
            selector,
            visible: isVisible,
            classList: el.className,
            display: style.display,
            visibility: style.visibility
          });
        } else {
          elements.push({ name, selector, exists: false });
        }
      };
      
      checkElement('#preJoinScreen', 'PreJoin Screen');
      checkElement('#connectingScreen', 'Connecting Screen');
      checkElement('#roomInterface', 'Room Interface');
      checkElement('#videos', 'Videos Container');
      checkElement('#localVideo', 'Local Video');
      
      return elements;
    });
    
    console.log('Видимые элементы:', JSON.stringify(visibleElements, null, 2));
    
    // Проверяем наличие ошибок в консоли
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Ждём немного для сбора ошибок
    await page.waitForTimeout(2000);
    
    console.log('Ошибки консоли:', consoleErrors);
    
    // Проверяем наличие модального окна с требованием включить камеру
    const cameraModal = await page.locator('text=Сначала включите камеру').first();
    const hasCameraModal = await cameraModal.count() > 0 && await cameraModal.isVisible().catch(() => false);
    
    console.log('Модальное окно "Сначала включите камеру":', hasCameraModal);
    
    // Проверяем наличие колесика "Подключение к комнате"
    const connectingText = await page.locator('text=Подключение к комнате').first();
    const hasConnectingText = await connectingText.count() > 0 && await connectingText.isVisible().catch(() => false);
    
    console.log('Текст "Подключение к комнате":', hasConnectingText);
    
    // Делаем финальный скриншот
    await page.screenshot({ path: '/data/workspace/tests/test-results/issue49-final-state.png', fullPage: true });
    
    // Анализируем исходный код страницы
    const pageSource = await page.content();
    
    // Ищем вызов connectToRoom
    const hasConnectToRoom = pageSource.includes('connectToRoom()');
    const hasPrejoinComplete = pageSource.includes('prejoinComplete');
    const hasWindowOnload = pageSource.includes('window.onload');
    
    console.log('\n=== АНАЛИЗ КОДА ===');
    console.log('Найден connectToRoom():', hasConnectToRoom);
    console.log('Найдено событие prejoinComplete:', hasPrejoinComplete);
    console.log('Найден window.onload:', hasWindowOnload);
    
    // Ищем порядок скриптов
    const roomJsIndex = pageSource.indexOf('room.js');
    const roomHtmlScriptIndex = pageSource.indexOf('<script>'); // inline script in room.html
    
    console.log('Позиция room.js в коде:', roomJsIndex);
    console.log('Позиция inline script:', roomHtmlScriptIndex);
    
    // Проверяем, какой скрипт загружается первым
    console.log('\n=== ПОРЯДОК ЗАГРУЗКИ ===');
    if (roomJsIndex < roomHtmlScriptIndex || roomHtmlScriptIndex === -1) {
      console.log('⚠️ room.js загружается ДО inline скриптов room.html!');
    } else {
      console.log('✅ Inline скрипты загружаются до room.js');
    }
  });
  
  test('Проверка главной страницы - создание комнаты', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: '/data/workspace/tests/test-results/issue49-main-page.png', fullPage: true });
    
    // Проверяем наличие кнопки создания комнаты
    const createBtn = await page.locator('text=Создать комнату').first();
    expect(await createBtn.count()).toBeGreaterThan(0);
    
    // Кликаем по кнопке
    await createBtn.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: '/data/workspace/tests/test-results/issue49-create-modal.png', fullPage: true });
    
    // Проверяем, что появилось модальное окно (не окно камеры)
    const modal = await page.locator('#createRoomModal, .modal, [role="dialog"]').first();
    const hasModal = await modal.count() > 0 && await modal.isVisible().catch(() => false);
    
    console.log('Модальное окно создания комнаты:', hasModal);
    
    // Проверяем, что НЕ появилось окно с требованием камеры
    const cameraWarning = await page.locator('text=Сначала включите камеру').first();
    const hasCameraWarning = await cameraWarning.count() > 0 && await cameraWarning.isVisible().catch(() => false);
    
    console.log('Окно "Сначала включите камеру":', hasCameraWarning);
    
    if (hasModal) {
      // Заполняем форму
      const roomNameInput = await page.locator('#roomName, [name="roomName"]').first();
      if (await roomNameInput.count() > 0) {
        await roomNameInput.fill('Test Room Issue 49');
      }
      
      // Нажимаем создать
      const createSubmitBtn = await page.locator('button:has-text("Создать"), button[type="submit"]').first();
      if (await createSubmitBtn.count() > 0) {
        await createSubmitBtn.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: '/data/workspace/tests/test-results/issue49-after-create.png', fullPage: true });
        
        // Проверяем URL
        const url = page.url();
        console.log('URL после создания:', url);
        
        // Проверяем, что мы на странице комнаты
        if (url.includes('room.html')) {
          // Ждём и проверяем состояние
          await page.waitForTimeout(3000);
          await page.screenshot({ path: '/data/workspace/tests/test-results/issue49-room-state.png', fullPage: true });
          
          // Проверяем, что видим
          const state = await page.evaluate(() => {
            const prejoin = document.querySelector('#preJoinScreen');
            const connecting = document.querySelector('#connectingScreen');
            const roomInterface = document.querySelector('#roomInterface');
            
            return {
              prejoinVisible: prejoin ? !prejoin.classList.contains('hidden') : false,
              connectingVisible: connecting ? !connecting.classList.contains('hidden') : false,
              roomInterfaceVisible: roomInterface ? !roomInterface.classList.contains('hidden') : false
            };
          });
          
          console.log('Состояние экранов:', state);
        }
      }
    }
  });
});
