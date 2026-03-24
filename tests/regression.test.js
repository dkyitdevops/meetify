const https = require('https');

function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ text: () => Promise.resolve(data) }));
        }).on('error', reject);
    });
}

// HTML Validation Helper
function validateHTML(html, filename) {
    const errors = [];
    
    // Check for unclosed tags (basic check)
    const tagPattern = /<([a-zA-Z][a-zA-Z0-9]*)[^>]*?>/g;
    const closeTagPattern = /<\/([a-zA-Z][a-zA-Z0-9]*)>/g;
    
    const openTags = [];
    let match;
    
    // Find all opening tags
    while ((match = tagPattern.exec(html)) !== null) {
        const tag = match[1].toLowerCase();
        // Self-closing tags to ignore
        const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
        if (!selfClosing.includes(tag)) {
            openTags.push({ tag, index: match.index });
        }
    }
    
    // Find all closing tags
    const closeTags = [];
    while ((match = closeTagPattern.exec(html)) !== null) {
        closeTags.push({ tag: match[1].toLowerCase(), index: match.index });
    }
    
    // Simple stack-based check
    const stack = [];
    const allTags = [...openTags.map(t => ({...t, type: 'open'})), ...closeTags.map(t => ({...t, type: 'close'}))];
    allTags.sort((a, b) => a.index - b.index);
    
    for (const tag of allTags) {
        if (tag.type === 'open') {
            stack.push(tag.tag);
        } else {
            if (stack.length === 0 || stack[stack.length - 1] !== tag.tag) {
                errors.push(`Mismatched closing tag: </${tag.tag}>`);
            } else {
                stack.pop();
            }
        }
    }
    
    if (stack.length > 0) {
        errors.push(`Unclosed tags: ${stack.join(', ')}`);
    }
    
    // Check for broken tag syntax (tag name not followed by > or space)
    const brokenTagPattern = /<[a-zA-Z][a-zA-Z0-9]*[^\u003e\s]*[a-zA-Z0-9]$/gm;
    if (brokenTagPattern.test(html)) {
        errors.push('Possible broken tag syntax detected');
    }
    
    return errors;
}

const TESTS = {
    'Main page HTML is valid': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        const html = await res.text();
        const errors = validateHTML(html, 'index.html');
        if (errors.length > 0) {
            console.log('   HTML errors:', errors.slice(0, 3).join('; '));
            return false;
        }
        return true;
    },
    
    'Room page HTML is valid': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        const errors = validateHTML(html, 'room.html');
        if (errors.length > 0) {
            console.log('   HTML errors:', errors.slice(0, 3).join('; '));
            return false;
        }
        return true;
    },
    
    'Main page loads': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        return res.text().then(t => t.includes('Meetify'));
    },
    
    'Main page has logo and buttons': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        const html = await res.text();
        return html.includes('🎥') && html.includes('Присоединиться') && html.includes('Создать комнату');
    },
    
    'Room page loads': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        return res.text().then(t => t.includes('videos'));
    },
    
    'Room page has video container': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="videos"') && html.includes('video-wrapper');
    },
    
    'Room page has chat': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('chatMessages') && html.includes('chatInput');
    },
    
    'All control buttons exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        const buttons = ['micBtn', 'camBtn', 'screenBtn', 'raiseHandBtn', 'participantsBtn', 'chatBtn', 'settingsBtn'];
        return buttons.every(id => html.includes('id="' + id + '"'));
    },
    
    'API health endpoint works': async () => {
        try {
            const res = await fetch('https://46-149-68-9.nip.io/api/health');
            return res.text().then(t => t.includes('ok') || t.includes('healthy'));
        } catch {
            return false;
        }
    },
    
    'Room.js loads without errors': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        // Check for basic syntax issues
        return js.includes('var socket = io()') && js.includes('function connectToRoom');
    },
    
    'Settings modal exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="settingsModal"') && html.includes('openSettings');
    },
    
    'Virtual background selector exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('virtualBackground') && html.includes('applyVirtualBackground');
    },
    
    'Raise hand button exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('raiseHandBtn') && html.includes('toggleRaiseHand');
    }
};

async function runTests() {
    console.log('🧪 Running Regression Tests...\n');
    let passed = 0;
    let failed = 0;
    
    for (const [name, test] of Object.entries(TESTS)) {
        try {
            const result = await test();
            if (result) {
                console.log('✅', name);
                passed++;
            } else {
                console.log('❌', name);
                failed++;
            }
        } catch (err) {
            console.log('❌', name, '-', err.message);
            failed++;
        }
    }
    
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests();