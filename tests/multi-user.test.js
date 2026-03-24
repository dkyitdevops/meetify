const TESTS = {
    'Multiple user connections supported': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('existing-users') && js.includes('user-joined');
    },
    
    'User ID generation exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('meetifyUserId') && js.includes('userId');
    },
    
    'User name support exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('userName') && js.includes('meetifyUserName');
    },
    
    'Raise hand with user ID exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('raise-hand') && js.includes('userId');
    },
    
    'Reactions with user ID exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('reaction') && js.includes('userId');
    },
    
    'User leave handling exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('user-left') && js.includes('removeParticipant');
    },
    
    'Name input on main page exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        const html = await res.text();
        return html.includes('id="userName"') && html.includes('Ваше имя');
    }
};

async function runTests() {
    console.log('Running Multi-User Tests...\n');
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