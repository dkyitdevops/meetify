const TESTS = {
    'More background options available': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('value="space"') && 
               html.includes('value="books"') &&
               html.includes('🚀 Космос');
    },
    
    'BodyPix library loaded': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('body-pix') && html.includes('tensorflow');
    },
    
    'Preset backgrounds defined': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('presetBackgrounds') && 
               js.includes('unsplash.com');
    },
    
    'BodyPix model loading function exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('loadBodyPixModel') && js.includes('bodyPix.load');
    }
};

async function runTests() {
    console.log('Running Enhanced Virtual Background Tests...\n');
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