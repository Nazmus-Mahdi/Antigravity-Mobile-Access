import { test, describe } from 'node:test';
import assert from 'node:assert';
import { isLocalRequest } from './server.js';

describe('isLocalRequest', () => {
    test('returns false if proxy headers are present', () => {
        const req1 = { headers: { 'x-forwarded-for': '1.2.3.4' }, ip: '127.0.0.1', socket: {} };
        const req2 = { headers: { 'x-forwarded-host': 'example.com' }, ip: '127.0.0.1', socket: {} };
        const req3 = { headers: { 'x-real-ip': '1.2.3.4' }, ip: '127.0.0.1', socket: {} };

        assert.strictEqual(isLocalRequest(req1), false);
        assert.strictEqual(isLocalRequest(req2), false);
        assert.strictEqual(isLocalRequest(req3), false);
    });

    test('returns true for localhost IPv4', () => {
        const req = { headers: {}, ip: '127.0.0.1', socket: {} };
        assert.strictEqual(isLocalRequest(req), true);
    });

    test('returns true for localhost IPv6', () => {
        const req1 = { headers: {}, ip: '::1', socket: {} };
        const req2 = { headers: {}, ip: '::ffff:127.0.0.1', socket: {} };

        assert.strictEqual(isLocalRequest(req1), true);
        assert.strictEqual(isLocalRequest(req2), true);
    });

    test('returns true for standard private network IPv4 ranges', () => {
        const privateIPs = [
            '192.168.1.1',
            '10.0.0.1',
            '172.16.0.1',
            '172.17.255.255',
            '172.18.0.0',
            '172.19.1.1',
            '172.20.0.1',
            '172.31.255.255'
        ];

        for (const ip of privateIPs) {
            const req = { headers: {}, ip, socket: {} };
            assert.strictEqual(isLocalRequest(req), true, `Expected ${ip} to be local`);
        }
    });

    test('returns true for mapped private network IPv6 ranges', () => {
        const mappedIPs = [
            '::ffff:192.168.1.1',
            '::ffff:10.0.0.1'
        ];

        for (const ip of mappedIPs) {
            const req = { headers: {}, ip, socket: {} };
            assert.strictEqual(isLocalRequest(req), true, `Expected ${ip} to be local`);
        }
    });

    test('returns false for external public IPs', () => {
        const publicIPs = [
            '8.8.8.8',
            '1.1.1.1',
            '172.32.0.1', // just outside private range
            '172.15.255.255', // just outside private range
            '192.169.1.1'
        ];

        for (const ip of publicIPs) {
            const req = { headers: {}, ip, socket: {} };
            assert.strictEqual(isLocalRequest(req), false, `Expected ${ip} to be non-local`);
        }
    });

    test('falls back to req.socket.remoteAddress if req.ip is not set', () => {
        const req = { headers: {}, socket: { remoteAddress: '127.0.0.1' } };
        assert.strictEqual(isLocalRequest(req), true);
    });

    test('returns false if both req.ip and req.socket.remoteAddress are empty', () => {
        const req = { headers: {}, socket: {} };
        assert.strictEqual(isLocalRequest(req), false);
    });
});
