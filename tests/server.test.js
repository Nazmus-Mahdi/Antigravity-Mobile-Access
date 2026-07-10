import { test, describe, mock } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { EventEmitter } from 'events';

// Import the internal function we exposed
import { __test__ } from '../server.js';
const { getJson } = __test__;

describe('getJson', () => {
    test('missing error path: should reject on http error event', async () => {
        // Mock http.get to return a dummy request that immediately emits an 'error' event
        const originalGet = http.get;
        http.get = (url, callback) => {
            const req = new EventEmitter();
            // Defer the error emission slightly to simulate async behavior
            setTimeout(() => {
                req.emit('error', new Error('mock network error'));
            }, 10);
            return req;
        };

        try {
            await assert.rejects(
                getJson('http://example.com'),
                (err) => {
                    assert.strictEqual(err.message, 'mock network error');
                    return true;
                }
            );
        } finally {
            // Restore original method
            http.get = originalGet;
        }
    });

    test('should resolve valid JSON', async () => {
        const server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('{"foo":"bar"}');
        });

        await new Promise(resolve => server.listen(0, resolve));
        const port = server.address().port;

        const result = await getJson(`http://127.0.0.1:${port}`);
        assert.deepStrictEqual(result, { foo: 'bar' });

        server.close();
    });

    test('should reject invalid JSON', async () => {
        const server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('{"foo":"bar"'); // Missing closing brace
        });

        await new Promise(resolve => server.listen(0, resolve));
        const port = server.address().port;

        await assert.rejects(
            getJson(`http://127.0.0.1:${port}`),
            SyntaxError
        );

        server.close();
    });
});
