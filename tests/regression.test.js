// ==================== РЕГРЕССИОННЫЕ ТЕСТЫ ====================

const REGRESSION_TESTS = {
    // Главная страница
    'Main page loads': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        return res.status === 200 && res.headers.get('content-type').includes('text/html');
    },
    
    'Main page has logo and buttons': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        const html = await res.text();
        return html.includes('Meetify') && html.includes('Присоединиться') && html.includes('Создать');
    },
    
    // Страница комнаты
    'Room page loads': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test123');
        return res.status === 200;
    },
    
    'Room page has video container': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="videos"');
    },
    
    'Room page has chat': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="chatMessages"') && html.includes('id="chatInput"');
    },
    
    // Контролы
    'All control buttons exist': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="micBtn"') && 
               html.includes('id="camBtn"') && 
               html.includes('id="screenBtn"') &&
               html.includes('id="recordBtn"') &&
               html.includes('id="raiseHandBtn"') &&
               html.includes('id="settingsBtn"');
    },
    
    // API
    'API health endpoint works': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/health');
        const data = await res.json();
        return data.status === 'ok';
    },
    
    'API create room works': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/api/rooms', { method: 'POST' });
        const data = await res.json();
        return data.roomId && data.url;
    },
    
    'Socket.io endpoint accessible': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/socket.io/?EIO=4');
        return res.status !== 404;
    },
    
    // JavaScript файлы
    'Room.js loads without errors': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.js');
        const js = await res.text();
        // Проверяем что нет синтаксических ошибок
        return js.includes('function') && js.includes('socket') && !js.includes('undefined');
    },
    
    // Настройки
    'Settings modal exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="settingsModal"') && html.includes('openSettings');
    },
    
    // Виртуальный фон
    'Virtual background selector exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="virtualBackground"');
    },
    
    // Поднятие руки
    'Raise hand button exists': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/room.html?id=test');
        const html = await res.text();
        return html.includes('id="raiseHandBtn"') && html.includes('✋');
    }
};

// ==================== ЗАПУСК ТЕСТОВ ====================

async function runRegressionTests() {
    console.log('🧪 Running Regression Tests...\n');
    let passed = 0;
    let failed = 0;
    const failures = [];
    
    for (const [name, test] of Object.entries(REGRESSION_TESTS)) {
        try {
            const result = await test();
            if (result) {
                console.log('✅', name);
                passed++;
            } else {
                console.log('❌', name, '- returned false');
                failed++;
                failures.push(name);
            }
        } catch (err) {
            console.log('❌', name, '-', err.message);
            failed++;
            failures.push(name + ': ' + err.message);
        }
    }
    
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
    
    if (failures.length > 0) {
        console.log('\n❌ Failures:');
        failures.forEach(f => console.log('  -', f));
    }
    
    process.exit(failed > 0 ? 1 : 0);
}

runRegressionTests();