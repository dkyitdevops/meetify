const TESTS = {
    'Record button exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="recordBtn"') && html.includes('toggleRecording()');
    },
    
    'Recording variables exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('isRecording') && 
               js.includes('mediaRecorder') &&
               js.includes('recordedChunks');
    },
    
    'Recording functions exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('toggleRecording') && 
               js.includes('stopRecording') &&
               js.includes('saveRecording');
    },
    
    'MediaRecorder API used': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('MediaRecorder') && js.includes('canvas.captureStream');
    }
};

async function runTests() {
    console.log('Running Recording Tests...\n');
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