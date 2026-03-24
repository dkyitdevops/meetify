const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://46-149-68-9.nip.io';

// Simple smoke tests that don't rely on complex selectors
test.describe('Meetify Smoke Tests', () => {
  
  test('Page loads successfully', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response.status()).toBe(200);
    expect(await page.title()).toContain('Meetify');
  });

  test('Main page has required elements', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for user name input
    const userNameInput = page.locator('input#userName');
    await expect(userNameInput).toBeVisible();
    
    // Check for room ID input
    const roomIdInput = page.locator('input#roomId');
    await expect(roomIdInput).toBeVisible();
    
    // Check for buttons (Russian text)
    await expect(page.locator('button:has-text("Присоединиться")')).toBeVisible();
    await expect(page.locator('button:has-text("Создать комнату")')).toBeVisible();
  });

  test('Can enter user name', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const userNameInput = page.locator('input#userName');
    await userNameInput.fill('Test User');
    await expect(userNameInput).toHaveValue('Test User');
  });

  test('Create room modal opens', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Click create room button (Russian text)
    await page.click('button:has-text("Создать комнату")');
    
    // Check modal is visible
    const modal = page.locator('#createModal');
    await expect(modal).toBeVisible();
    
    // Check room name input exists
    await expect(page.locator('input#roomName')).toBeVisible();
  });

  test('Room page loads with correct ID', async ({ page }) => {
    const testRoomId = 'test123';
    await page.goto(`${BASE_URL}/room.html?id=${testRoomId}`);
    
    // Check room ID is displayed
    await expect(page.locator('body')).toContainText(testRoomId);
  });

  test('Room page has video container', async ({ page }) => {
    await page.goto(`${BASE_URL}/room.html?id=testroom`);
    
    const videosContainer = page.locator('#videos');
    await expect(videosContainer).toBeVisible();
  });

  test('Room page has chat', async ({ page }) => {
    await page.goto(`${BASE_URL}/room.html?id=testroom`);
    
    const chatInput = page.locator('#chatInput');
    await expect(chatInput).toBeVisible();
  });

  test('Room page has control buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/room.html?id=testroom`);
    
    // Check for main controls
    await expect(page.locator('#micBtn')).toBeVisible();
    await expect(page.locator('#camBtn')).toBeVisible();
    await expect(page.locator('#raiseHandBtn')).toBeVisible();
  });

  test('Whiteboard button exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/room.html?id=testroom`);
    
    const whiteboardBtn = page.locator('#whiteboardBtn');
    await expect(whiteboardBtn).toBeVisible();
  });

  test('Reactions button exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/room.html?id=testroom`);
    
    const reactionBtn = page.locator('#reactionBtn');
    await expect(reactionBtn).toBeVisible();
  });

});