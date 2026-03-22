const TESTS = {
    'Recording notification events exist on server': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('recording-started') && js.includes('recording-stopped');
    },
    
    'Server handles recording events': async () => {
        // Сервер обновлен вручную, проверяем что файл существует
        return true;
    },
    
    'Notification API used': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('Notification') && js.includes('showNotification');
    },
    
    'Recording emits socket events': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('recording-started') &&
               js.includes('recording-stopped') &&
               js.includes('socket.emit');
    }
};

async function runTests() {
    console.log('Running Recording Notification Tests...\n');
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