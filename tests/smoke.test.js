const TESTS = {
    'Page loads': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        return res.status === 200;
    },
    'API health': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/health');
        const data = await res.json();
        return data.status === 'ok';
    },
    'Socket.io endpoint': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/socket.io/?EIO=4');
        // Socket.io returns 400 for incomplete handshake, but should not be 404
        return res.status !== 404;
    },
    'Create room API': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/api/rooms', { method: 'POST' });
        const data = await res.json();
        return data.roomId && data.roomId.length > 0;
    }
};

async function runTests() {
    console.log('Running Meetify tests...\n');
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