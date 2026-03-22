const { AllureRuntime } = require('allure-js-commons');
const MochaAllureReporter = require('allure-mocha');

const allureRuntime = new AllureRuntime({ resultsDir: './allure-results' });

const TESTS = {
    'Page loads': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/');
        return res.status === 200;
    },
    'API health': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/health');
        const data = await res.json();
        return data.status === 'ok';
    },
    'Socket.io endpoint': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/socket.io/?EIO=4');
        return res.status !== 404;
    },
    'Create room API': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/api/rooms', { method: 'POST' });
        const data = await res.json();
        return data.roomId && data.roomId.length > 0;
    },
    'WebSocket upgrade': async () => {
        const res = await fetch('https://46-149-68-9.nip.io/socket.io/?EIO=4&transport=websocket');
        return res.status === 400; // Expected for incomplete handshake
    }
};

async function runTests() {
    console.log('Running Meetify tests with Allure reporting...\n');
    
    for (const [name, testFn] of Object.entries(TESTS)) {
        const test = allureRuntime.startTest({ name, fullName: name });
        test.addLabel('suite', 'Smoke Tests');
        test.addLabel('feature', 'Core Functionality');
        
        try {
            const start = Date.now();
            const result = await testFn();
            const duration = Date.now() - start;
            
            test.addParameter('duration', `${duration}ms`);
            
            if (result) {
                test.status = 'passed';
                console.log('✅', name);
            } else {
                test.status = 'failed';
                test.addAttachment('Error', 'Test returned false', 'text/plain');
                console.log('❌', name, '- returned false');
            }
        } catch (err) {
            test.status = 'broken';
            test.addAttachment('Exception', err.message, 'text/plain');
            console.log('❌', name, '-', err.message);
        }
        
        test.endTest();
        allureRuntime.writeTest(test);
    }
    
    console.log('\nAllure results saved to ./allure-results');
    console.log('Generate report: allure generate ./allure-results -o ./allure-report');
}

runTests();