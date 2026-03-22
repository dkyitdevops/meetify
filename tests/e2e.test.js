const puppeteer = require('puppeteer');
const assert = require('assert');

const BASE_URL = process.env.TEST_URL || 'https://46-149-68-9.nip.io';

describe('Meetify E2E Tests', function() {
    this.timeout(60000);
    let browser;
    let page;

    before(async () => {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    });

    after(async () => {
        if (browser) await browser.close();
    });

    beforeEach(async () => {
        page = await browser.newPage();
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    });

    afterEach(async () => {
        if (page) await page.close();
    });

    it('should load the main page', async () => {
        const title = await page.title();
        assert.ok(title.includes('Meetify'), 'Page title should contain Meetify');
    });

    it('should have room input and buttons', async () => {
        const roomInput = await page.$('#roomId');
        const joinButton = await page.$('button[onclick="joinRoom()"]');
        const createButton = await page.$('button[onclick="createRoom()"]');
        
        assert.ok(roomInput, 'Room input should exist');
        assert.ok(joinButton, 'Join button should exist');
        assert.ok(createButton, 'Create button should exist');
    });

    it('should create room and generate room ID', async () => {
        await page.click('button[onclick="createRoom()"]');
        await page.waitForTimeout(1000);
        
        const roomId = await page.$eval('#roomId', el => el.value);
        assert.ok(roomId && roomId.length > 0, 'Room ID should be generated');
    });

    it('should connect to Socket.io', async () => {
        const socketConnected = await page.evaluate(() => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(typeof socket !== 'undefined' && socket.connected);
                }, 2000);
            });
        });
        
        assert.ok(socketConnected, 'Socket.io should be connected');
    });

    it('should show connecting status when joining room', async () => {
        await page.click('button[onclick="createRoom()"]');
        await page.waitForTimeout(500);
        
        const statusText = await page.$eval('#status', el => el.textContent);
        assert.ok(
            statusText.includes('Подключено') || statusText.includes('Подключение'),
            'Status should show connecting or connected'
        );
    });
});

// API Tests
describe('Meetify API Tests', function() {
    this.timeout(10000);

    it('should return health status', async () => {
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();
        
        assert.equal(data.status, 'ok', 'Health status should be ok');
        assert.equal(data.service, 'meetify-api', 'Service name should match');
    });

    it('should create room via API', async () => {
        const response = await fetch(`${BASE_URL}/api/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        
        assert.ok(data.roomId, 'Response should contain roomId');
        assert.ok(data.url, 'Response should contain url');
    });
});

console.log('Test suite loaded. Run with: npm test');