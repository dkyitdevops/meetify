const TESTS = {
    'Page loads without chat and controls': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        const html = await res.text();
        // Проверяем что чат и контролы есть в DOM но скрыты
        return html.includes('id="chatSection"') && 
               html.includes('id="controls"') &&
               html.includes('class="chat-section hidden"');
    },
    
    'Chat section exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        const html = await res.text();
        return html.includes('id="chatMessages"') && 
               html.includes('id="chatInput"');
    },
    
    'Control buttons exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        const html = await res.text();
        return html.includes('id="micBtn"') && 
               html.includes('id="camBtn"') &&
               html.includes('onclick="toggleMic()"') &&
               html.includes('onclick="toggleCam()"');
    },
    
    'Leave room button exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        const html = await res.text();
        return html.includes('onclick="leaveRoom()"');
    },
    
    'API health still works': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/health');
        const data = await res.json();
        return data.status === 'ok';
    },
    
    'Socket.io endpoint works': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/socket.io/?EIO=4');
        return res.status !== 404;
    }
};

async function runTests() {
    console.log('Running Meetify UI Tests...\n');
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