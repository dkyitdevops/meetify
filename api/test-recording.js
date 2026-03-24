/**
 * Meetify Recording Feature Tests (Simplified)
 * 
 * Тесты для функционала записи встреч (HTTP API only)
 */

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Конфигурация тестов
const API_PORT = 3000;
const API_HOST = 'localhost';

// Хелперы
function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        body: JSON.parse(body)
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Тесты
async function runTests() {
    console.log('🧪 Запуск тестов Meetify Recording\n');
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Health check
    try {
        console.log('Test 1: Health check API...');
        const response = await makeRequest('/health');
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.status, 'ok');
        assert.strictEqual(response.body.service, 'meetify-api');
        console.log('✅ Health check passed\n');
        passed++;
    } catch (err) {
        console.log('❌ Health check failed:', err.message, '\n');
        failed++;
    }
    
    // Test 2: API recordings endpoint (empty list)
    try {
        console.log('Test 2: Recordings API (empty list)...');
        const testRoomId = 'test-room-' + Date.now();
        const response = await makeRequest('/api/recordings/' + testRoomId);
        assert.strictEqual(response.status, 200);
        assert.ok(Array.isArray(response.body.recordings));
        assert.strictEqual(response.body.recordings.length, 0);
        console.log('✅ Recordings API (empty) passed\n');
        passed++;
    } catch (err) {
        console.log('❌ Recordings API (empty) failed:', err.message, '\n');
        failed++;
    }
    
    // Test 3: Room creation API
    try {
        console.log('Test 3: Room creation API...');
        const response = await makeRequest('/api/rooms', 'POST');
        assert.strictEqual(response.status, 200);
        assert.ok(response.body.roomId);
        assert.ok(response.body.url);
        assert.ok(typeof response.body.roomId === 'string');
        assert.ok(response.body.roomId.length > 0);
        console.log('✅ Room creation API passed\n');
        passed++;
    } catch (err) {
        console.log('❌ Room creation API failed:', err.message, '\n');
        failed++;
    }
    
    // Test 4: Recordings directory exists
    try {
        console.log('Test 4: Recordings directory exists...');
        const recordingsDir = path.join(__dirname, 'recordings');
        assert.ok(fs.existsSync(recordingsDir), 'Recordings directory should exist');
        const stats = fs.statSync(recordingsDir);
        assert.ok(stats.isDirectory(), 'Recordings path should be a directory');
        console.log('✅ Recordings directory exists\n');
        passed++;
    } catch (err) {
        console.log('❌ Recordings directory check failed:', err.message, '\n');
        failed++;
    }
    
    // Test 5: Recording info (not found)
    try {
        console.log('Test 5: Recording info (not found)...');
        const testRoomId = 'test-room-' + Date.now();
        const fakeRecordingId = 'fake-id';
        const response = await makeRequest('/api/recordings/' + testRoomId + '/' + fakeRecordingId + '/info');
        assert.strictEqual(response.status, 404);
        assert.ok(response.body.error);
        console.log('✅ Recording info (not found) passed\n');
        passed++;
    } catch (err) {
        console.log('❌ Recording info (not found) failed:', err.message, '\n');
        failed++;
    }
    
    // Test 6: Recording delete (not found)
    try {
        console.log('Test 6: Recording delete (not found)...');
        const testRoomId = 'test-room-' + Date.now();
        const fakeRecordingId = 'fake-id';
        const response = await makeRequest('/api/recordings/' + testRoomId + '/' + fakeRecordingId, 'DELETE');
        assert.strictEqual(response.status, 404);
        assert.ok(response.body.error);
        console.log('✅ Recording delete (not found) passed\n');
        passed++;
    } catch (err) {
        console.log('❌ Recording delete (not found) failed:', err.message, '\n');
        failed++;
    }
    
    // Test 7: Server.js syntax check
    try {
        console.log('Test 7: Server.js syntax check...');
        const serverPath = path.join(__dirname, 'server.js');
        const content = fs.readFileSync(serverPath, 'utf8');
        assert.ok(content.includes('recording-start'), 'Should contain recording-start handler');
        assert.ok(content.includes('recording-stop'), 'Should contain recording-stop handler');
        assert.ok(content.includes('recording-chunk'), 'Should contain recording-chunk handler');
        assert.ok(content.includes('activeRecordings'), 'Should contain activeRecordings map');
        assert.ok(content.includes('roomRecordings'), 'Should contain roomRecordings map');
        console.log('✅ Server.js syntax check passed\n');
        passed++;
    } catch (err) {
        console.log('❌ Server.js syntax check failed:', err.message, '\n');
        failed++;
    }
    
    // Test 8: Room.js syntax check
    try {
        console.log('Test 8: Room.js syntax check...');
        const roomJsPath = path.join(__dirname, '..', 'web', 'room.js');
        const content = fs.readFileSync(roomJsPath, 'utf8');
        assert.ok(content.includes('toggleRecording'), 'Should contain toggleRecording function');
        assert.ok(content.includes('startRecording'), 'Should contain startRecording function');
        assert.ok(content.includes('stopRecording'), 'Should contain stopRecording function');
        assert.ok(content.includes('recording-started'), 'Should contain recording-started handler');
        assert.ok(content.includes('recording-stopped'), 'Should contain recording-stopped handler');
        assert.ok(content.includes('openRecordingsModal'), 'Should contain openRecordingsModal function');
        console.log('✅ Room.js syntax check passed\n');
        passed++;
    } catch (err) {
        console.log('❌ Room.js syntax check failed:', err.message, '\n');
        failed++;
    }
    
    // Test 9: Room.html contains recordings modal
    try {
        console.log('Test 9: Room.html recordings modal...');
        const roomHtmlPath = path.join(__dirname, '..', 'web', 'room.html');
        const content = fs.readFileSync(roomHtmlPath, 'utf8');
        assert.ok(content.includes('recordingsModal'), 'Should contain recordingsModal');
        assert.ok(content.includes('openRecordingsModal'), 'Should contain openRecordingsModal call');
        assert.ok(content.includes('closeRecordingsModal'), 'Should contain closeRecordingsModal call');
        console.log('✅ Room.html recordings modal passed\n');
        passed++;
    } catch (err) {
        console.log('❌ Room.html recordings modal failed:', err.message, '\n');
        failed++;
    }
    
    // Test 10: UUID module installed
    try {
        console.log('Test 10: UUID module installed...');
        const uuid = require('uuid');
        const id = uuid.v4();
        assert.ok(id);
        assert.ok(typeof id === 'string');
        assert.ok(id.length > 0);
        console.log('✅ UUID module installed\n');
        passed++;
    } catch (err) {
        console.log('❌ UUID module check failed:', err.message, '\n');
        failed++;
    }
    
    // Summary
    console.log('='.repeat(50));
    console.log(`📊 Результаты тестов: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50));
    
    if (failed > 0) {
        process.exit(1);
    }
}

// Run tests if server is running
console.log('⏳ Проверка доступности сервера...');
makeRequest('/health')
    .then(() => {
        console.log('✅ Сервер доступен\n');
        return runTests();
    })
    .catch((err) => {
        console.log('❌ Сервер недоступен. Убедитесь, что сервер запущен на порту 3000');
        console.log('   Запустите: node api/server.js');
        console.log('   Ошибка:', err.message);
        process.exit(1);
    });
