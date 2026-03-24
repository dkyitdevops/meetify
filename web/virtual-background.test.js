/**
 * Virtual Background Tests for Meetify
 * Run with: node virtual-background.test.js
 */

const fs = require('fs');
const path = require('path');

// Simple test runner
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log('🧪 Running Virtual Background Tests...\n');
        
        for (const { name, fn } of this.tests) {
            try {
                await fn();
                console.log(`✅ ${name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${name}`);
                console.log(`   Error: ${error.message}`);
                this.failed++;
            }
        }

        console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEquals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }
}

const runner = new TestRunner();

// ==================== FILE STRUCTURE TESTS ====================

runner.test('Virtual background module file exists', () => {
    const filePath = path.join(__dirname, 'virtual-background.js');
    runner.assert(fs.existsSync(filePath), 'virtual-background.js not found');
});

runner.test('Room.js file exists', () => {
    const filePath = path.join(__dirname, 'room.js');
    runner.assert(fs.existsSync(filePath), 'room.js not found');
});

runner.test('Room.html file exists', () => {
    const filePath = path.join(__dirname, 'room.html');
    runner.assert(fs.existsSync(filePath), 'room.html not found');
});

// ==================== VIRTUAL BACKGROUND MODULE TESTS ====================

runner.test('Virtual background module contains required functions', () => {
    const content = fs.readFileSync(path.join(__dirname, 'virtual-background.js'), 'utf8');
    
    runner.assert(content.includes('MeetifyVirtualBackground'), 'MeetifyVirtualBackground object not found');
    runner.assert(content.includes('init'), 'init function not found');
    runner.assert(content.includes('start'), 'start function not found');
    runner.assert(content.includes('stop'), 'stop function not found');
    runner.assert(content.includes('setMode'), 'setMode function not found');
    runner.assert(content.includes('getProcessedStream'), 'getProcessedStream function not found');
});

runner.test('Virtual background module contains all modes', () => {
    const content = fs.readFileSync(path.join(__dirname, 'virtual-background.js'), 'utf8');
    
    runner.assert(content.includes("'none'"), 'none mode not found');
    runner.assert(content.includes("'blur'"), 'blur mode not found');
    runner.assert(content.includes("'image'"), 'image mode not found');
    runner.assert(content.includes("'color'"), 'color mode not found');
});

runner.test('Virtual background uses MediaPipe Selfie Segmentation', () => {
    const content = fs.readFileSync(path.join(__dirname, 'virtual-background.js'), 'utf8');
    
    runner.assert(content.includes('SelfieSegmentation'), 'SelfieSegmentation not referenced');
    runner.assert(content.includes('segmentationMask'), 'segmentationMask not used');
    runner.assert(content.includes('onResults'), 'onResults callback not found');
});

runner.test('Virtual background has proper canvas handling', () => {
    const content = fs.readFileSync(path.join(__dirname, 'virtual-background.js'), 'utf8');
    
    runner.assert(content.includes('createElement(\'canvas\')'), 'Canvas creation not found');
    runner.assert(content.includes('getContext(\'2d\')'), '2D context not found');
    runner.assert(content.includes('captureStream'), 'captureStream not found');
    runner.assert(content.includes('globalCompositeOperation'), 'globalCompositeOperation not used');
});

runner.test('Virtual background has blur implementation', () => {
    const content = fs.readFileSync(path.join(__dirname, 'virtual-background.js'), 'utf8');
    
    runner.assert(content.includes('drawBlurredBackground'), 'drawBlurredBackground function not found');
    runner.assert(content.includes('filter'), 'CSS filter not found');
    runner.assert(content.includes('blur('), 'blur filter not found');
});

runner.test('Virtual background has image background implementation', () => {
    const content = fs.readFileSync(path.join(__dirname, 'virtual-background.js'), 'utf8');
    
    runner.assert(content.includes('drawImageBackground'), 'drawImageBackground function not found');
    runner.assert(content.includes('drawCoverImage'), 'drawCoverImage helper not found');
    runner.assert(content.includes('backgroundImage'), 'backgroundImage property not found');
});

runner.test('Virtual background has color background implementation', () => {
    const content = fs.readFileSync(path.join(__dirname, 'virtual-background.js'), 'utf8');
    
    runner.assert(content.includes('drawColorBackground'), 'drawColorBackground function not found');
    runner.assert(content.includes('backgroundColor'), 'backgroundColor property not found');
    runner.assert(content.includes('fillStyle'), 'fillStyle not used');
});

// ==================== ROOM.JS INTEGRATION TESTS ====================

runner.test('Room.js imports virtual background module', () => {
    const htmlContent = fs.readFileSync(path.join(__dirname, 'room.html'), 'utf8');
    
    runner.assert(htmlContent.includes('virtual-background.js'), 'virtual-background.js not included in HTML');
});

runner.test('Room.js has applyVirtualBackground function', () => {
    const content = fs.readFileSync(path.join(__dirname, 'room.js'), 'utf8');
    
    runner.assert(content.includes('async function applyVirtualBackground'), 'applyVirtualBackground function not found');
});

runner.test('Room.js uses MeetifyVirtualBackground', () => {
    const content = fs.readFileSync(path.join(__dirname, 'room.js'), 'utf8');
    
    runner.assert(content.includes('MeetifyVirtualBackground'), 'MeetifyVirtualBackground not referenced');
    runner.assert(content.includes('VirtualBackgroundUI'), 'VirtualBackgroundUI not referenced');
});

runner.test('Room.js handles all background types', () => {
    const content = fs.readFileSync(path.join(__dirname, 'room.js'), 'utf8');
    
    runner.assert(content.includes("type === 'none'"), 'none type handling not found');
    runner.assert(content.includes("type === 'blur'"), 'blur type handling not found');
    runner.assert(content.includes("type === 'custom'"), 'custom type handling not found');
    runner.assert(content.includes('presetImages'), 'preset images not found');
});

runner.test('Room.js has loading state management', () => {
    const content = fs.readFileSync(path.join(__dirname, 'room.js'), 'utf8');
    
    runner.assert(content.includes('isVirtualBgLoading'), 'isVirtualBgLoading not found');
    runner.assert(content.includes('Загрузка модели'), 'loading message not found');
});

runner.test('Room.js has getBgName helper', () => {
    const content = fs.readFileSync(path.join(__dirname, 'room.js'), 'utf8');
    
    runner.assert(content.includes('function getBgName'), 'getBgName function not found');
    runner.assert(content.includes('names[type]'), 'background name mapping not found');
});

// ==================== HTML UI TESTS ====================

runner.test('HTML has virtual background selector', () => {
    const content = fs.readFileSync(path.join(__dirname, 'room.html'), 'utf8');
    
    runner.assert(content.includes('virtualBackground'), 'virtualBackground select not found');
    runner.assert(content.includes('value="blur"'), 'blur option not found');
    runner.assert(content.includes('value="custom"'), 'custom option not found');
});

runner.test('HTML has custom background file input', () => {
    const content = fs.readFileSync(path.join(__dirname, 'room.html'), 'utf8');
    
    runner.assert(content.includes('customBgFile'), 'customBgFile input not found');
    runner.assert(content.includes('type="file"'), 'file input type not found');
    runner.assert(content.includes('accept="image/*"'), 'image accept attribute not found');
});

runner.test('HTML includes MediaPipe libraries', () => {
    const content = fs.readFileSync(path.join(__dirname, 'room.html'), 'utf8');
    
    runner.assert(content.includes('selfie_segmentation.js'), 'MediaPipe Selfie Segmentation not included');
    runner.assert(content.includes('camera_utils.js'), 'MediaPipe Camera Utils not included');
});

// ==================== SYNTAX VALIDATION TESTS ====================

runner.test('Virtual background module has valid JavaScript syntax', () => {
    const content = fs.readFileSync(path.join(__dirname, 'virtual-background.js'), 'utf8');
    
    // Check for balanced braces
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    runner.assertEquals(openBraces, closeBraces, 'Unbalanced braces in virtual-background.js');
    
    // Check for balanced parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    runner.assertEquals(openParens, closeParens, 'Unbalanced parentheses in virtual-background.js');
});

runner.test('Room.js has valid JavaScript syntax', () => {
    const content = fs.readFileSync(path.join(__dirname, 'room.js'), 'utf8');
    
    // Check for balanced braces
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    runner.assertEquals(openBraces, closeBraces, 'Unbalanced braces in room.js');
    
    // Check for balanced parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    runner.assertEquals(openParens, closeParens, 'Unbalanced parentheses in room.js');
});

// ==================== WEBRTC INTEGRATION TESTS ====================

runner.test('Virtual background updates peer connections', () => {
    const content = fs.readFileSync(path.join(__dirname, 'virtual-background.js'), 'utf8');
    
    runner.assert(content.includes('updatePeerConnections'), 'updatePeerConnections not found');
    runner.assert(content.includes('replaceTrack'), 'replaceTrack not found');
    runner.assert(content.includes('getSenders'), 'getSenders not found');
});

runner.test('Virtual background preserves audio track', () => {
    const content = fs.readFileSync(path.join(__dirname, 'virtual-background.js'), 'utf8');
    
    runner.assert(content.includes('getAudioTracks'), 'Audio track handling not found');
    runner.assert(content.includes('addTrack'), 'addTrack for audio not found');
});

// ==================== ERROR HANDLING TESTS ====================

runner.test('Virtual background has error handling', () => {
    const content = fs.readFileSync(path.join(__dirname, 'virtual-background.js'), 'utf8');
    
    runner.assert(content.includes('try'), 'try block not found');
    runner.assert(content.includes('catch'), 'catch block not found');
    runner.assert(content.includes('console.error'), 'error logging not found');
});

runner.test('Room.js has error handling for virtual background', () => {
    const content = fs.readFileSync(path.join(__dirname, 'room.js'), 'utf8');
    
    runner.assert(content.includes('try'), 'try block not found');
    runner.assert(content.includes('catch'), 'catch block not found');
    runner.assert(content.includes('error.message'), 'error message handling not found');
});

// ==================== PERFORMANCE TESTS ====================

runner.test('Virtual background uses requestAnimationFrame', () => {
    const content = fs.readFileSync(path.join(__dirname, 'virtual-background.js'), 'utf8');
    
    runner.assert(content.includes('requestAnimationFrame'), 'requestAnimationFrame not found');
    runner.assert(content.includes('cancelAnimationFrame'), 'cancelAnimationFrame not found');
});

runner.test('Virtual background has FPS control', () => {
    const content = fs.readFileSync(path.join(__dirname, 'virtual-background.js'), 'utf8');
    
    runner.assert(content.includes('targetFPS'), 'targetFPS not found');
    runner.assert(content.includes('frameInterval'), 'frameInterval not found');
});

// ==================== MEMORY MANAGEMENT TESTS ====================

runner.test('Virtual background has cleanup on stop', () => {
    const content = fs.readFileSync(path.join(__dirname, 'virtual-background.js'), 'utf8');
    
    runner.assert(content.includes('stop()'), 'stop function not found');
    runner.assert(content.includes('getTracks'), 'track cleanup not found');
    runner.assert(content.includes('forEach'), 'iteration for cleanup not found');
});

// Run all tests
runner.run().then(success => {
    process.exit(success ? 0 : 1);
});