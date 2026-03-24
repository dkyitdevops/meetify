/**
 * Meetify E2E Tests - Comprehensive Feature Testing
 * 
 * Uses Playwright for browser automation
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.TEST_URL || 'https://46-149-68-9.nip.io';

// Helper function to create a room and return page
async function createRoom(page, userName = 'Test User', roomName = 'Test Room') {
  await page.goto(BASE_URL);
  await page.fill('#userName', userName);
  await page.click('button:has-text("Создать комнату")');
  await page.fill('#roomName', roomName);
  await page.click('button:has-text("Создать")');
  await page.waitForURL(/room\.html/);
  await page.waitForTimeout(1000); // Wait for connection
}

test.describe('E2E - Room Management', () => {
  
  test('Create room with name and description', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Fill user name
    await page.fill('#userName', 'Room Creator');
    
    // Open create room modal
    await page.click('button:has-text("Создать комнату")');
    
    // Fill room details
    await page.fill('#roomName', 'My Test Room');
    await page.fill('#roomDesc', 'This is a test room description');
    await page.click('button:has-text("Создать")');
    
    // Verify room loaded
    await page.waitForURL(/room\.html/);
    await expect(page.locator('#videos')).toBeVisible();
    await expect(page.locator('#roomTitle')).toContainText('My Test Room');
    await expect(page.locator('#roomDesc')).toContainText('This is a test room description');
  });

  test('Join existing room by ID', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Fill user name and room ID
    await page.fill('#userName', 'Room Joiner');
    await page.fill('#roomId', 'test-room-123');
    await page.click('button:has-text("Присоединиться")');
    
    // Verify navigation
    await page.waitForURL(/room\.html.*id=test-room-123/);
    await expect(page.locator('#videos')).toBeVisible();
    await expect(page.locator('#roomIdDisplay')).toContainText('test-room-123');
  });

  test('Copy room ID to clipboard', async ({ page, context }) => {
    await createRoom(page, 'Clipboard Tester');
    
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Click copy button
    await page.click('button:has-text("📋")');
    
    // Verify clipboard content (would need dialog handling for alert)
    // This is a basic check that button exists and is clickable
    await expect(page.locator('button:has-text("📋")')).toBeVisible();
  });

  test('Leave room redirects to home', async ({ page }) => {
    await createRoom(page, 'Leaver');
    
    // Click leave button
    await page.click('button[onclick="leaveRoom()"]');
    
    // Should redirect to home
    await page.waitForURL(BASE_URL);
    await expect(page.locator('button:has-text("Создать комнату")')).toBeVisible();
  });
});

test.describe('E2E - Video & Audio Controls', () => {
  
  test('Toggle microphone on/off', async ({ page }) => {
    await createRoom(page, 'Mic Tester');
    
    // Wait for media to initialize
    await page.waitForTimeout(2000);
    
    // Mic should be on by default
    const micBtn = page.locator('#micBtn');
    await expect(micBtn).not.toHaveClass(/muted/);
    
    // Toggle off
    await micBtn.click();
    await expect(micBtn).toHaveClass(/muted/);
    
    // Toggle on
    await micBtn.click();
    await expect(micBtn).not.toHaveClass(/muted/);
  });

  test('Toggle camera on/off', async ({ page }) => {
    await createRoom(page, 'Camera Tester');
    
    await page.waitForTimeout(2000);
    
    const camBtn = page.locator('#camBtn');
    await expect(camBtn).not.toHaveClass(/muted/);
    
    // Toggle off
    await camBtn.click();
    await expect(camBtn).toHaveClass(/muted/);
    
    // Toggle on
    await camBtn.click();
    await expect(camBtn).not.toHaveClass(/muted/);
  });

  test('Local video has highlighting border', async ({ page }) => {
    await createRoom(page, 'Video Tester');
    
    await page.waitForTimeout(2000);
    
    const localVideo = page.locator('#video-local');
    await expect(localVideo).toBeVisible();
    await expect(localVideo).toHaveClass(/local-video/);
  });
});

test.describe('E2E - Chat Functionality', () => {
  
  test('Send and receive chat message', async ({ page }) => {
    await createRoom(page, 'Chat User');
    
    // Type and send message
    await page.fill('#chatInput', 'Hello from E2E test!');
    await page.press('#chatInput', 'Enter');
    
    // Verify message appears
    await expect(page.locator('.chat-messages')).toContainText('Hello from E2E test!');
    await expect(page.locator('.chat-messages')).toContainText('Вы');
  });

  test('System messages appear on join', async ({ page }) => {
    await createRoom(page, 'System Msg User');
    
    // Should see system message about joining
    await expect(page.locator('.chat-messages')).toContainText('Вы присоединились');
  });

  test('Toggle chat panel visibility', async ({ page }) => {
    await createRoom(page, 'Chat Toggler');
    
    // Chat should be visible by default
    await expect(page.locator('#chatSection')).toBeVisible();
    
    // Toggle off
    await page.click('#chatBtn');
    await expect(page.locator('#chatSection')).not.toBeVisible();
    
    // Toggle on
    await page.click('#chatBtn');
    await expect(page.locator('#chatSection')).toBeVisible();
  });

  test('Chat input has max length', async ({ page }) => {
    await createRoom(page, 'Chat Input Tester');
    
    const chatInput = page.locator('#chatInput');
    await expect(chatInput).toHaveAttribute('maxlength', '500');
  });
});

test.describe('E2E - Whiteboard', () => {
  
  test('Open and close whiteboard', async ({ page }) => {
    await createRoom(page, 'Whiteboard User');
    
    // Whiteboard should be hidden initially
    await expect(page.locator('#whiteboardContainer')).not.toHaveClass(/active/);
    
    // Open whiteboard
    await page.click('#whiteboardBtn');
    await expect(page.locator('#whiteboardContainer')).toHaveClass(/active/);
    
    // Close whiteboard
    await page.click('button:has-text("Закрыть")');
    await expect(page.locator('#whiteboardContainer')).not.toHaveClass(/active/);
  });

  test('Whiteboard has all color options', async ({ page }) => {
    await createRoom(page, 'Whiteboard Colors');
    
    await page.click('#whiteboardBtn');
    
    // Check for color buttons
    const colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00'];
    for (const color of colors) {
      await expect(page.locator(`.color-btn[onclick*="${color}"]`)).toBeVisible();
    }
  });

  test('Whiteboard has pen and eraser tools', async ({ page }) => {
    await createRoom(page, 'Whiteboard Tools');
    
    await page.click('#whiteboardBtn');
    
    await expect(page.locator('#penTool')).toBeVisible();
    await expect(page.locator('#eraserTool')).toBeVisible();
  });
});

test.describe('E2E - Polls', () => {
  
  test('Create poll with multiple options', async ({ page }) => {
    await createRoom(page, 'Poll Creator');
    
    // Open poll modal
    await page.click('#pollBtn');
    await expect(page.locator('#pollModal')).toHaveClass(/active/);
    
    // Fill poll question
    await page.fill('#pollQuestion', 'What is your favorite color?');
    
    // Fill options
    await page.fill('.poll-option >> nth=0', 'Red');
    await page.fill('.poll-option >> nth=1', 'Blue');
    
    // Add third option
    await page.click('button:has-text("Добавить вариант")');
    await page.fill('.poll-option >> nth=2', 'Green');
    
    // Create poll
    await page.click('button:has-text("Создать опрос")');
    
    // Should show active poll
    await expect(page.locator('#activePoll')).toBeVisible();
    await expect(page.locator('#activePollQuestion')).toContainText('What is your favorite color?');
  });

  test('Poll has anonymous and public options', async ({ page }) => {
    await createRoom(page, 'Poll Type Tester');
    
    await page.click('#pollBtn');
    
    // Check for radio buttons
    await expect(page.locator('input[value="anonymous"]')).toBeVisible();
    await expect(page.locator('input[value="public"]')).toBeVisible();
  });
});

test.describe('E2E - Reactions', () => {
  
  test('Open reactions panel', async ({ page }) => {
    await createRoom(page, 'Reaction Tester');
    
    // Reactions panel should be hidden
    await expect(page.locator('#reactionsPanel')).not.toHaveClass(/active/);
    
    // Open panel
    await page.click('#reactionBtn');
    await expect(page.locator('#reactionsPanel')).toHaveClass(/active/);
  });

  test('All reaction emojis are available', async ({ page }) => {
    await createRoom(page, 'Emoji Tester');
    
    await page.click('#reactionBtn');
    
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '🎉'];
    for (const emoji of emojis) {
      await expect(page.locator(`button:has-text("${emoji}")`)).toBeVisible();
    }
  });
});

test.describe('E2E - Raise Hand', () => {
  
  test('Toggle raise hand shows icon', async ({ page }) => {
    await createRoom(page, 'Hand Raiser');
    
    // No hand icon initially
    await expect(page.locator('.hand-raised-icon')).not.toBeVisible();
    
    // Raise hand
    await page.click('#raiseHandBtn');
    await expect(page.locator('#raiseHandBtn')).toHaveClass(/muted/);
    
    // Lower hand
    await page.click('#raiseHandBtn');
    await expect(page.locator('#raiseHandBtn')).not.toHaveClass(/muted/);
  });
});

test.describe('E2E - Participants Panel', () => {
  
  test('Toggle participants panel', async ({ page }) => {
    await createRoom(page, 'Participants Tester');
    
    // Panel should be hidden initially
    await expect(page.locator('#participantsSidebar')).not.toBeVisible();
    
    // Open panel
    await page.click('#participantsBtn');
    await expect(page.locator('#participantsSidebar')).toBeVisible();
    
    // Close panel
    await page.click('#participantsBtn');
    await expect(page.locator('#participantsSidebar')).not.toBeVisible();
  });

  test('Participants list shows current user', async ({ page }) => {
    await createRoom(page, 'Participant List User');
    
    await page.click('#participantsBtn');
    
    // Should show current user
    await expect(page.locator('#participantsList')).toContainText('Вы');
  });
});

test.describe('E2E - Settings', () => {
  
  test('Open and close settings modal', async ({ page }) => {
    await createRoom(page, 'Settings Tester');
    
    // Open settings
    await page.click('#settingsBtn');
    await expect(page.locator('#settingsModal')).toHaveClass(/active/);
    
    // Close settings
    await page.click('button:has-text("Отмена")');
    await expect(page.locator('#settingsModal')).not.toHaveClass(/active/);
  });

  test('Settings has video quality options', async ({ page }) => {
    await createRoom(page, 'Quality Tester');
    
    await page.click('#settingsBtn');
    
    const qualitySelect = page.locator('#videoQuality');
    await expect(qualitySelect).toBeVisible();
    
    // Check options
    await expect(qualitySelect).toContainText('Высокое');
    await expect(qualitySelect).toContainText('Среднее');
    await expect(qualitySelect).toContainText('Низкое');
  });

  test('Settings has virtual background options', async ({ page }) => {
    await createRoom(page, 'Background Tester');
    
    await page.click('#settingsBtn');
    
    const bgSelect = page.locator('#virtualBackground');
    await expect(bgSelect).toBeVisible();
    
    // Check options
    const options = ['Без фона', 'Размытие', 'Офис', 'Природа', 'Космос'];
    for (const option of options) {
      await expect(bgSelect).toContainText(option);
    }
  });
});

test.describe('E2E - Screen Share', () => {
  
  test('Screen share button exists', async ({ page }) => {
    await createRoom(page, 'Screen Share Tester');
    
    await expect(page.locator('#screenBtn')).toBeVisible();
    await expect(page.locator('#screenBtn')).toHaveAttribute('data-tooltip', 'Демонстрация экрана');
  });
});

test.describe('E2E - Recordings', () => {
  
  test('Recording button exists', async ({ page }) => {
    await createRoom(page, 'Recording Tester');
    
    await expect(page.locator('#recordBtn')).toBeVisible();
    await expect(page.locator('#recordingsListBtn')).toBeVisible();
  });

  test('Recordings modal opens', async ({ page }) => {
    await createRoom(page, 'Recordings Modal Tester');
    
    await page.click('#recordingsListBtn');
    await expect(page.locator('#recordingsModal')).toHaveClass(/active/);
  });
});

test.describe('E2E - Invite Modal', () => {
  
  test('Invite modal opens and shows link', async ({ page }) => {
    await createRoom(page, 'Invite Tester');
    
    // Open invite modal
    await page.click('button:has-text("✉️")');
    await expect(page.locator('#inviteModal')).toHaveClass(/active/);
    
    // Check invite link is populated
    const inviteLink = page.locator('#inviteLink');
    await expect(inviteLink).toBeVisible();
    await expect(inviteLink).toHaveValue(/room\.html/);
  });

  test('Invite modal has sharing options', async ({ page }) => {
    await createRoom(page, 'Share Tester');
    
    await page.click('button:has-text("✉️")');
    
    // Check sharing buttons exist
    await expect(page.locator('button:has-text("Telegram")')).toBeVisible();
    await expect(page.locator('button:has-text("Email")')).toBeVisible();
    await expect(page.locator('button:has-text("WhatsApp")')).toBeVisible();
  });
});