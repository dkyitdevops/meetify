# UI Testing with Playwright

## Установка

```bash
npm init -y
npm install @playwright/test
npx playwright install
```

## Базовый тест для Meetify

```javascript
// tests/meetify.spec.js
const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://46-149-68-9.nip.io';

test.describe('Meetify UI Tests', () => {
  
  test('Create room and join', async ({ page }) => {
    // Open main page
    await page.goto(BASE_URL);
    
    // Enter user name
    await page.fill('#userName', 'Test User');
    
    // Click create room
    await page.click('text=Create room');
    
    // Enter room name
    await page.fill('#roomName', 'Test Room');
    await page.click('text=Create');
    
    // Wait for room page
    await page.waitForURL(/room\.html/);
    
    // Check room loaded
    await expect(page.locator('#videos')).toBeVisible();
  });

  test('Join existing room', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Enter name
    await page.fill('#userName', 'Joiner');
    
    // Enter room ID
    await page.fill('#roomId', 'test123');
    await page.click('text=Join');
    
    await page.waitForURL(/room\.html/);
  });

  test('Raise hand in room', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#userName', 'Hand Raiser');
    await page.click('text=Create room');
    await page.fill('#roomName', 'Hand Test');
    await page.click('text=Create');
    
    await page.waitForURL(/room\.html/);
    
    // Click raise hand button
    await page.click('#raiseHandBtn');
    
    // Check icon appears
    await expect(page.locator('.hand-raised-icon')).toBeVisible();
  });

  test('Send reaction', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#userName', 'Reactor');
    await page.click('text=Create room');
    await page.fill('#roomName', 'Reaction Test');
    await page.click('text=Create');
    
    await page.waitForURL(/room\.html/);
    
    // Open reactions
    await page.click('#reactionBtn');
    
    // Click emoji
    await page.click('text=👍');
    
    // Check reaction appears
    await expect(page.locator('.reaction-float')).toBeVisible();
  });

  test('Multi-user scenario', async ({ browser }) => {
    // Create two browser contexts
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();
    
    const user1 = await user1Context.newPage();
    const user2 = await user2Context.newPage();
    
    // User 1 creates room
    await user1.goto(BASE_URL);
    await user1.fill('#userName', 'Host');
    await user1.click('text=Create room');
    await user1.fill('#roomName', 'Multi Test');
    await user1.click('text=Create');
    
    await user1.waitForURL(/room\.html/);
    const roomUrl = user1.url();
    const roomId = roomUrl.match(/id=([^&]+)/)[1];
    
    // User 2 joins
    await user2.goto(BASE_URL);
    await user2.fill('#userName', 'Guest');
    await user2.fill('#roomId', roomId);
    await user2.click('text=Join');
    
    await user2.waitForURL(/room\.html/);
    
    // Wait for connection
    await user1.waitForTimeout(3000);
    
    // Check both see each other in participants
    await expect(user1.locator('#participantsList')).toContainText('Guest');
    await expect(user2.locator('#participantsList')).toContainText('Host');
    
    // Cleanup
    await user1Context.close();
    await user2Context.close();
  });
});
```

## Запуск тестов

```bash
# Run all tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run headed (see browser)
npx playwright test --headed

# Run specific test
npx playwright test -g "Multi-user"
```

## CI/CD Integration

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

## Преимущества Playwright

- ✅ **Авто-waiting** — ждёт загрузки элементов
- ✅ **Trace viewer** — отладка упавших тестов
- ✅ **Multi-browser** — Chromium, Firefox, WebKit
- ✅ **Parallel** — параллельный запуск
- ✅ **Screenshots/Videos** — автоматическая запись
