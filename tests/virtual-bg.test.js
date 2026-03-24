const TESTS = {
    'Virtual background selector exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="virtualBackground"') && html.includes('Виртуальный фон');
    },
    
    'Background options exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('value="blur"') && 
               html.includes('value="office"') &&
               html.includes('value="custom"');
    },
    
    'Custom file input exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="customBgFile"') && html.includes('accept="image/*"');
    },
    
    'Virtual background functions exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('applyVirtualBackground') && 
               js.includes('loadVirtualBackground') &&
               js.includes('backgroundCanvas');
    },
    
    'Blur effect function exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('applyBlurEffect') && js.includes('applyBackgroundImage');
    }
};

async function runTests() {
    console.log('Running Virtual Background Tests...\n');
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