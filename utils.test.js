import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashString } from './utils.js';

test('hashString', async (t) => {
    await t.test('returns expected hash for empty string', () => {
        assert.equal(hashString(''), '0');
    });

    await t.test('returns expected hash for known strings', () => {
        assert.equal(hashString('test'), '2487m');
        assert.equal(hashString('hello'), '1n1e4y');
        assert.equal(hashString('world'), '1vgtci');
    });

    await t.test('returns different hashes for different strings', () => {
        assert.notEqual(hashString('test1'), hashString('test2'));
        assert.notEqual(hashString('Hello'), hashString('hello')); // Case sensitive
    });

    await t.test('handles long strings', () => {
        const longString = 'a'.repeat(1000);
        const hash1 = hashString(longString);
        assert.equal(typeof hash1, 'string');
        assert.ok(hash1.length > 0);

        // Ensure deterministic
        assert.equal(hash1, hashString(longString));
    });

    await t.test('handles non-ASCII characters', () => {
        const hash1 = hashString('こんにちは');
        const hash2 = hashString('🌟');
        assert.equal(typeof hash1, 'string');
        assert.equal(typeof hash2, 'string');
        assert.notEqual(hash1, hash2);
    });
});
