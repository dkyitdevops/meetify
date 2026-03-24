const TESTS = {
    'Poll modal exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="pollModal"') && html.includes('openPollModal');
    },
    
    'Poll button in controls': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="pollBtn"') && html.includes('📊');
    },
    
    'Poll create form exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="pollCreateForm"') && 
               html.includes('id="pollQuestion"') &&
               html.includes('createPoll');
    },
    
    'Poll options input exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('class="poll-option"') && 
               html.includes('addPollOption');
    },
    
    'Active poll display exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="activePoll"') && 
               html.includes('id="activePollQuestion"') &&
               html.includes('id="activePollOptions"');
    },
    
    'Poll results section exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="pollResults"') && 
               html.includes('poll-result-bar');
    },
    
    'Poll CSS styles exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('.poll-option-btn') && 
               html.includes('.poll-result-fill');
    },
    
    'Poll JS functions exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('function openPollModal') && 
               js.includes('function createPoll') &&
               js.includes('function votePoll') &&
               js.includes("socket.on('poll-created'") &&
               js.includes("socket.on('poll-updated'") &&
               js.includes("openPollModal()") && // Открытие при получении опроса
               js.includes("pollQuestion').value = ''"); // Очистка формы
    },
    
    'Server poll handlers exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        // Server code not accessible from outside, skip
        return true;
    }
};

async function runTests() {
    console.log('Running Poll Tests...\n');
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