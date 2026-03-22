const TESTS = {
    'Settings button exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="settingsBtn"') && html.includes('openSettings()');
    },
    
    'Settings modal exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="settingsModal"') && html.includes('modal-overlay');
    },
    
    'Download path input exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="downloadPath"') && html.includes('Папка для сохранения');
    },
    
    'Video quality selector exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="videoQuality"') && html.includes('Качество видео');
    },
    
    'Settings functions exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('openSettings') && 
               js.includes('closeSettings') &&
               js.includes('saveSettings') &&
               js.includes('localStorage');
    }
};

async function runTests() {
    console.log('Running Settings Tests...\n');
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