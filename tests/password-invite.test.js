const TESTS = {
    'Password input exists on main page': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        const html = await res.text();
        return html.includes('id="newRoomPassword"') && html.includes('id="roomPassword"');
    },
    
    'Create room with password option exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        const html = await res.text();
        return html.includes('createRoomWithPassword') && html.includes('createOptions');
    },
    
    'Invite button exists in room': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('showInviteModal') && html.includes('Пригласить');
    },
    
    'Invite modal exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="inviteModal"') && html.includes('inviteLink');
    },
    
    'Share buttons exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('shareTelegram') && html.includes('shareEmail') && html.includes('shareWhatsApp');
    },
    
    'Invite functions exist in JS': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        return js.includes('showInviteModal') && js.includes('copyInviteLink');
    }
};

async function runTests() {
    console.log('Running Password & Invite Tests...\n');
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