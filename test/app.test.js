import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import vm from 'vm';

test('app.js connectWebSocket WebSocket error path handling', (t) => {
    const code = fs.readFileSync('public/js/app.js', 'utf8');

    // To avoid regex entirely but still test effectively, we can mock the entire environment safely.
    // We just need to mock the `document.body` and `window` objects sufficiently.

    const mockElement = {
        addEventListener: () => {},
        classList: { remove: () => {}, add: () => {} },
        textContent: '',
        querySelector: () => mockElement,
        style: {}
    };

    const mockWindow = {
        location: {
            protocol: 'http:',
            host: 'localhost:3000',
            href: ''
        },
        addEventListener: () => {},
        visualViewport: { height: 800, addEventListener: () => {} },
        innerHeight: 800,
        matchMedia: () => ({ matches: false }),
        localStorage: { getItem: () => null, setItem: () => {} },
        fetch: () => Promise.resolve({ ok: true, status: 200, json: () => ({}) }),
        navigator: { serviceWorker: { register: () => Promise.resolve() } }
    };

    let wsInstance;
    class MockWebSocket {
        constructor(url) {
            this.url = url;
            wsInstance = this;
        }
    }

    const consoleLogs = [];

    const context = {
        window: mockWindow,
        WebSocket: MockWebSocket,
        console: {
            log: (...args) => consoleLogs.push(...args),
            error: (...args) => consoleLogs.push(...args)
        },
        document: {
            getElementById: () => mockElement,
            querySelector: () => mockElement,
            querySelectorAll: () => [mockElement],
            createElement: () => mockElement,
            head: { appendChild: () => {} },
            body: mockElement,
            addEventListener: () => {}
        },
        setTimeout: () => {},
        setInterval: () => {},
        fetch: mockWindow.fetch,
        localStorage: mockWindow.localStorage,
        matchMedia: mockWindow.matchMedia,
        URLSearchParams: class { get() { return null; } },
        navigator: mockWindow.navigator
    };

    vm.createContext(context);

    // Evaluate the entire app.js file
    vm.runInContext(code, context);

    assert.ok(wsInstance, 'WebSocket instance was not created');

    // Simulate error
    if (wsInstance.onerror) {
        const testError = new Error('Connection failed');
        wsInstance.onerror(testError);
        // Verify what happens on error
        assert.ok(
            consoleLogs.includes('WS Error:') ||
            consoleLogs.some(log => log === 'WS Error:' || (typeof log === 'string' && log.includes('WS Error'))) ||
            consoleLogs.includes(testError)
        );
    } else {
        // Function lacks an onerror handler!
        assert.fail('WebSocket is missing an onerror handler');
    }
});
