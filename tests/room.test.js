const TESTS = {
    'Main page loads': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        const html = await res.text();
        return res.status === 200 && html.includes('Meetify') && html.includes('Присоединиться');
    },
    
    'Room page exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return res.status === 200 && html.includes('room.js') && html.includes('Комната');
    },
    
    'Main page has no video/chat controls': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        const html = await res.text();
        // На главной странице не должно быть элементов комнаты
        return !html.includes('id="videos"') && !html.includes('toggleMic');
    },
    
    'Room page has video and chat': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="videos"') && html.includes('chatMessages');
    },
    
    'Room page has control buttons': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('toggleMic()') && html.includes('toggleCam()');
    },
    
    'Room.js file exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        return res.status === 200;
    }
};

async function runTests() {
    console.log('Running Meetify Room Separation Tests...\n');
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