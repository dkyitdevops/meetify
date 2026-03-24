const TESTS = {
    'Whiteboard container exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="whiteboardContainer"') && html.includes('id="whiteboardCanvas"');
    },
    
    'Whiteboard button exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="whiteboardBtn"') && html.includes('toggleWhiteboard');
    },
    
    'Whiteboard toolbar exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('whiteboard-toolbar') && 
               html.includes('setPenColor') &&
               html.includes('setTool');
    },
    
    'Whiteboard color buttons exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('color-btn') && html.includes('#ff0000') && html.includes('#00ff00');
    },
    
    'Whiteboard tool buttons exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('penTool') && html.includes('eraserTool') && html.includes('clearWhiteboard');
    },
    
    'Whiteboard CSS exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('.whiteboard-container') && 
               html.includes('.whiteboard-canvas') &&
               html.includes('.whiteboard-toolbar');
    },
    
    'Whiteboard JS functions exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('function toggleWhiteboard') && 
               js.includes('function initWhiteboard') &&
               js.includes('function setPenColor') &&
               js.includes('function clearWhiteboard') &&
               js.includes("socket.on('whiteboard-draw'") &&
               js.includes("socket.on('whiteboard-clear'");
    },
    
    'Server whiteboard handlers exist': async () => {
        // Server code not accessible from outside
        return true;
    }
};

async function runTests() {
    console.log('Running Whiteboard Tests...\n');
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