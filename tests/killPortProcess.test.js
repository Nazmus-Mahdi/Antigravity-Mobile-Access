import { test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import cp from 'child_process';
import { killPortProcess } from '../utils.js';

let originalPlatform;

beforeEach(() => {
    originalPlatform = process.platform;
});

afterEach(() => {
    Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true
    });
    mock.restoreAll();
});

test('Windows: should find and kill processes on port', async () => {
    Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
    });

    let execCalls = [];
    mock.method(cp, 'execSync', (cmd) => {
        execCalls.push(cmd);
        if (cmd.includes('netstat')) {
            return `
  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       1234
  TCP    [::]:3000              [::]:0                 LISTENING       5678
            `;
        }
        return '';
    });

    await killPortProcess(3000);

    assert.strictEqual(execCalls.length, 3);
    assert.ok(execCalls[0].includes('netstat -ano | findstr :3000 | findstr LISTENING'));
    assert.ok(execCalls[1].includes('taskkill /PID 1234 /F') || execCalls[2].includes('taskkill /PID 1234 /F'));
    assert.ok(execCalls[1].includes('taskkill /PID 5678 /F') || execCalls[2].includes('taskkill /PID 5678 /F'));
});

test('Windows: gracefully handles taskkill error', async () => {
    Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
    });

    mock.method(cp, 'execSync', (cmd) => {
        if (cmd.includes('netstat')) {
            return `  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       1234`;
        }
        throw new Error('Taskkill failed');
    });

    // Should not throw
    await killPortProcess(3000);
});

test('Linux/macOS: should find and kill processes on port', async () => {
    Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
    });

    let execCalls = [];
    mock.method(cp, 'execSync', (cmd) => {
        execCalls.push(cmd);
        if (cmd.includes('lsof')) {
            return `1111\n2222\n`;
        }
        return '';
    });

    await killPortProcess(3000);

    assert.strictEqual(execCalls.length, 3);
    assert.strictEqual(execCalls[0], 'lsof -ti:3000');
    assert.strictEqual(execCalls[1], 'kill -9 1111');
    assert.strictEqual(execCalls[2], 'kill -9 2222');
});

test('Linux/macOS: gracefully handles kill error', async () => {
    Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true
    });

    mock.method(cp, 'execSync', (cmd) => {
        if (cmd.includes('lsof')) {
            return `1111`;
        }
        throw new Error('Kill failed');
    });

    // Should not throw
    await killPortProcess(3000);
});

test('returns gracefully when no processes found (error thrown from netstat/lsof)', async () => {
    Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
    });

    mock.method(cp, 'execSync', () => {
        throw new Error('Command failed');
    });

    // Should not throw, returns Promise.resolve
    await killPortProcess(3000);
});
