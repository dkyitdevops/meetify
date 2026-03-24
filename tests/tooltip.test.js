const TESTS = {
    'Tooltips exist in CSS': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('data-tooltip') && 
               html.includes('.control-btn::after') &&
               html.includes('attr(data-tooltip)');
    },
    
    'All buttons have tooltips': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('data-tooltip="Микрофон"') &&
               html.includes('data-tooltip="Камера"') &&
               html.includes('data-tooltip="Демонстрация экрана"') &&
               html.includes('data-tooltip="Выйти из комнаты"');
    },
    
    'Tooltip styles exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('opacity: 0') && 
               html.includes('visibility: hidden') &&
               html.includes('.control-btn:hover::after');
    }
};

async function runTests() {
    console.log('Running Tooltip Tests...\n');
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