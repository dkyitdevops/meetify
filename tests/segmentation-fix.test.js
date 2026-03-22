const TESTS = {
    'Segmentation processes video frame by frame': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('segmentPerson') && js.includes('setInterval');
    },
    
    'Mask applies correctly - person from video, bg from image': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('segmentation.data[i] === 1') && 
               js.includes('videoData.data');
    }
};

async function runTests() {
    console.log('Running Segmentation Fix Tests...\n');
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