const TESTS = {
    'Screen share button exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('toggleScreenShare()') && html.includes('🖥️');
    },
    
    'Screen share JavaScript exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('toggleScreenShare') && 
               js.includes('getDisplayMedia') &&
               js.includes('stopScreenShare');
    },
    
    'Screen stream variable exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('screenStream') && js.includes('isScreenSharing');
    }
};

async function runTests() {
    console.log('Running Screen Share Tests...\n');
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