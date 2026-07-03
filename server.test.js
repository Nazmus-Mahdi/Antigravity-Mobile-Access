import test from 'node:test';
import assert from 'node:assert';
import os from 'os';
import { getLocalIP } from './server.js';

test('getLocalIP', async (t) => {
    await t.test('should prioritize 192.168.x.x over 10.x.x.x', (t) => {
        const mockInterfaces = {
            'eth0': [{ family: 'IPv4', internal: false, address: '10.0.0.5' }],
            'wlan0': [{ family: 'IPv4', internal: false, address: '192.168.1.10' }]
        };
        t.mock.method(os, 'networkInterfaces', () => mockInterfaces);

        const ip = getLocalIP();
        assert.strictEqual(ip, '192.168.1.10');
    });

    await t.test('should prioritize 10.x.x.x over 172.x.x.x', (t) => {
        const mockInterfaces = {
            'docker0': [{ family: 'IPv4', internal: false, address: '172.17.0.1' }],
            'eth0': [{ family: 'IPv4', internal: false, address: '10.0.0.5' }]
        };
        t.mock.method(os, 'networkInterfaces', () => mockInterfaces);

        const ip = getLocalIP();
        assert.strictEqual(ip, '10.0.0.5');
    });

    await t.test('should use 172.x.x.x if it is the only private network available', (t) => {
        const mockInterfaces = {
            'docker0': [{ family: 'IPv4', internal: false, address: '172.17.0.1' }]
        };
        t.mock.method(os, 'networkInterfaces', () => mockInterfaces);

        const ip = getLocalIP();
        assert.strictEqual(ip, '172.17.0.1');
    });

    await t.test('should fallback to priority 4 (public IP) if no private IPs exist', (t) => {
        const mockInterfaces = {
            'eth0': [{ family: 'IPv4', internal: false, address: '203.0.113.1' }]
        };
        t.mock.method(os, 'networkInterfaces', () => mockInterfaces);

        const ip = getLocalIP();
        assert.strictEqual(ip, '203.0.113.1');
    });

    await t.test('should fallback to localhost if only internal or IPv6 addresses are present', (t) => {
        const mockInterfaces = {
            'lo': [
                { family: 'IPv4', internal: true, address: '127.0.0.1' },
                { family: 'IPv6', internal: true, address: '::1' }
            ],
            'eth0': [
                { family: 'IPv6', internal: false, address: '2001:db8::1' }
            ]
        };
        t.mock.method(os, 'networkInterfaces', () => mockInterfaces);

        const ip = getLocalIP();
        assert.strictEqual(ip, 'localhost');
    });
});
