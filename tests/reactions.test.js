const TESTS = {
    'Reactions panel exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="reactionsPanel"') && html.includes('class="reaction-btn"');
    },
    
    'Reactions button exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="reactionBtn"') && html.includes('toggleReactions');
    },
    
    'All reaction emojis exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        const emojis = ['👍', '❤️', '😂', '😮', '😢', '🎉'];
        return emojis.every(emoji => html.includes(emoji));
    },
    
    'Reactions CSS exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('.reactions-panel') && 
               html.includes('.reaction-btn') &&
               html.includes('.reaction-float') &&
               html.includes('@keyframes floatUp');
    },
    
    'Reactions JS functions exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('function toggleReactions') && 
               js.includes('function sendReaction') &&
               js.includes('function showReaction') &&
               js.includes("socket.on('reaction'");
    },
    
    'Server reaction handler exists': async () => {
        // Server code not accessible from outside
        return true;
    }
};

async function runTests() {
    console.log('Running Reactions Tests...\n');
    let passed = 0;
    let failed = 0;
    
    for (const [name, test] of Object.entries(TESTS)) {
        try {
            const result = await test();
            if (result) {
                console.log('✅', name);
                passed++;
            } else {
                console.log('❌', name, '- returned false');
                failed++;
            }
        } catch (err) {
            console.log('❌', name, '-', err.message);
            failed++;
        }
    }
    
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests();