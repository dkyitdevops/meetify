const TESTS = {
    'Raise hand button exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="raiseHandBtn"') && html.includes('✋');
    },
    
    'Tooltip CSS exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('.control-btn::after') && html.includes('attr(data-tooltip)');
    },
    
    'Raise hand function exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('toggleRaiseHand') && js.includes('isHandRaised');
    },
    
    'Server handlers exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/api/server.js');
        const js = await res.text();
        return js.includes('raise-hand') && js.includes('hand-raised');
    }
};

async function runTests() {
    console.log('Running Raise Hand Tests...\n');
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