const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://46-149-68-9.nip.io';

test.describe('Meetify E2E Tests', () => {
  
  test('1. Create room with name', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Enter user name
    await page.fill('#userName', 'Test Host');
    
    // Click create room
    await page.click('text=Create room');
    
    // Fill room details
    await page.fill('#roomName', 'Test Room');
    await page.click('text=Create');
    
    // Verify room loaded
    await page.waitForURL(/room\.html/);
    await expect(page.locator('#videos')).toBeVisible();
    await expect(page.locator('#roomTitle')).toContainText('Test Room');
    
    console.log('✅ Test 1 passed: Create room');
  });

  test('2. Join existing room', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Enter name and room ID
    await page.fill('#userName', 'Test Guest');
    await page.fill('#roomId', 'testroom123');
    await page.click('text=Join');
    
    // Verify navigation
    await page.waitForURL(/room\.html/);
    await expect(page.locator('#videos')).toBeVisible();
    
    console.log('✅ Test 2 passed: Join room');
  });

  test('3. Raise hand functionality', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#userName', 'Hand Tester');
    await page.click('text=Create room');
    await page.fill('#roomName', 'Hand Test');
    await page.click('text=Create');
    
    await page.waitForURL(/room\.html/);
    
    // Click raise hand
    await page.click('#raiseHandBtn');
    
    // Verify hand icon appears
    await expect(page.locator('.hand-raised-icon')).toBeVisible();
    
    // Click again to lower
    await page.click('#raiseHandBtn');
    
    // Verify hand icon removed
    await expect(page.locator('.hand-raised-icon')).not.toBeVisible();
    
    console.log('✅ Test 3 passed: Raise hand');
  });

  test('4. Send emoji reaction', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#userName', 'Emoji Tester');
    await page.click('text=Create room');
    await page.fill('#roomName', 'Emoji Test');
    await page.click('text=Create');
    
    await page.waitForURL(/room\.html/);
    
    // Open reactions panel
    await page.click('#reactionBtn');
    
    // Click thumbs up
    await page.click('button:has-text("👍")');
    
    // Verify reaction appears
    await expect(page.locator('.reaction-float')).toBeVisible();
    
    console.log('✅ Test 4 passed: Emoji reaction');
  });

  test('5. Toggle mic and camera', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#userName', 'Media Tester');
    await page.click('text=Create room');
    await page.fill('#roomName', 'Media Test');
    await page.click('text=Create');
    
    await page.waitForURL(/room\.html/);
    
    // Wait for media to initialize
    await page.waitForTimeout(2000);
    
    // Toggle mic
    await page.click('#micBtn');
    await expect(page.locator('#micBtn')).toHaveClass(/muted/);
    
    // Toggle camera
    await page.click('#camBtn');
    await expect(page.locator('#camBtn')).toHaveClass(/muted/);
    
    console.log('✅ Test 5 passed: Toggle mic/camera');
  });

  test('6. Open and close participants panel', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#userName', 'Panel Tester');
    await page.click('text=Create room');
    await page.fill('#roomName', 'Panel Test');
    await page.click('text=Create');
    
    await page.waitForURL(/room\.html/);
    
    // Open participants
    await page.click('#participantsBtn');
    await expect(page.locator('#participantsSidebar')).toBeVisible();
    
    // Close participants
    await page.click('#participantsBtn');
    await expect(page.locator('#participantsSidebar')).not.toBeVisible();
    
    console.log('✅ Test 6 passed: Participants panel');
  });

  test('7. Open and close chat panel', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#userName', 'Chat Tester');
    await page.click('text=Create room');
    await page.fill('#roomName', 'Chat Test');
    await page.click('text=Create');
    
    await page.waitForURL(/room\.html/);
    
    // Chat should be visible by default
    await expect(page.locator('#chatSection')).toBeVisible();
    
    // Toggle chat off
    await page.click('#chatBtn');
    await expect(page.locator('#chatSection')).not.toBeVisible();
    
    // Toggle chat on
    await page.click('#chatBtn');
    await expect(page.locator('#chatSection')).toBeVisible();
    
    console.log('✅ Test 7 passed: Chat panel');
  });

  test('8. Send chat message', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#userName', 'Message Tester');
    await page.click('text=Create room');
    await page.fill('#roomName', 'Message Test');
    await page.click('text=Create');
    
    await page.waitForURL(/room\.html/);
    
    // Type and send message
    await page.fill('#chatInput', 'Hello from Playwright!');
    await page.press('#chatInput', 'Enter');
    
    // Verify message appears
    await expect(page.locator('.chat-messages')).toContainText('Hello from Playwright!');
    
    console.log('✅ Test 8 passed: Chat message');
  });

  test('9. Open whiteboard', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#userName', 'Whiteboard Tester');
    await page.click('text=Create room');
    await page.fill('#roomName', 'Whiteboard Test');
    await page.click('text=Create');
    
    await page.waitForURL(/room\.html/);
    
    // Open whiteboard
    await page.click('#whiteboardBtn');
    await expect(page.locator('#whiteboardContainer')).toHaveClass(/active/);
    
    // Close whiteboard
    await page.click('text=Close');
    await expect(page.locator('#whiteboardContainer')).not.toHaveClass(/active/);
    
    console.log('✅ Test 9 passed: Whiteboard');
  });

  test('10. Create and vote in poll', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#userName', 'Poll Tester');
    await page.click('text=Create room');
    await page.fill('#roomName', 'Poll Test');
    await page.click('text=Create');
    
    await page.waitForURL(/room\.html/);
    
    // Open poll modal
    await page.click('#pollBtn');
    await expect(page.locator('#pollModal')).toHaveClass(/active/);
    
    // Create poll
    await page.fill('#pollQuestion', 'Test question?');
    await page.fill('.poll-option >> nth=0', 'Option 1');
    await page.fill('.poll-option >> nth=1', 'Option 2');
    await page.click('text=Create poll');
    
    // Vote
    await page.waitForSelector('.poll-option-btn');
    await page.click('.poll-option-btn >> nth=0');
    
    console.log('✅ Test 10 passed: Poll');
  });

});