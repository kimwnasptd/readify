'use strict';

const fs = require('fs');
const {callbackify} = require('util');

const stub = require('@cloudcmd/stub');
const test = require('supertape');
const {reRequire} = require('mock-require');
const tryToCatch = require('try-to-catch');

const noop = () => {};

test('readdir: empty dir', async (t) => {
    const {readdir} = fs;
    fs.readdir = callbackify(async () => []);
    
    const _readdir = reRequire('../lib/readdir');
    
    const [, result] = await tryToCatch(_readdir, '.');
    
    fs.readdir = readdir;
    
    t.deepEqual(result, [], 'should return empty array');
    t.end();
});

test('readdir: empty stat', async (t) => {
    const {
        lstat,
        readdir,
    } = fs;
    
    fs.lstat = callbackify(async () => {
        throw Error('some');
    });
    
    fs.readdir = callbackify(async () => [
        'hello',
    ]);
    
    const _readdir = reRequire('../lib/readdir');
    
    const [, result] = await tryToCatch(_readdir, '/');
    
    fs.lstat = lstat;
    fs.readdir = readdir;
    
    const expected = [{
        name: 'hello',
        size: 0,
        date: 0,
        owner: 0,
        mode: 0,
        type: 'file',
    }];
    
    t.deepEqual(result, expected, 'should return empty array');
    t.end();
});

test('readdir: result', async (t) => {
    const {
        readdir,
        lstat,
    } = fs;
    
    const name = 'hello.txt';
    const mode = 16893;
    const size = 1024;
    const mtime = new Date();
    const uid = 1000;
    
    fs.readdir = (dir, fn) => {
        fn(null, [name]);
    };
    
    fs.lstat = (name, fn) => {
        fn(null, {
            isDirectory: noop,
            isSymbolicLink: noop,
            name,
            mode,
            size,
            mtime,
            uid
        });
    };
    
    const expected = [{
        name,
        size,
        date: mtime,
        owner: uid,
        mode,
        type: 'file',
    }];
    
    const _readdir = reRequire('../lib/readdir');
    const [, result] = await tryToCatch(_readdir, '.');
    
    fs.lstat = lstat;
    fs.readdir = readdir;
    
    t.deepEqual(result, expected, 'should get raw values');
    t.end();
});

test('readdir: result: no error', async (t) => {
    const {
        readdir,
        lstat,
    } = fs;
    
    const name = 'hello.txt';
    const mode = 16893;
    const size = 1024;
    const mtime = new Date();
    const uid = 1000;
    
    fs.readdir = (dir, fn) => {
        fn(null, [name]);
    };
    
    fs.lstat = (name, fn) => {
        fn(null, {
            isDirectory: noop,
            isSymbolicLink: noop,
            name,
            mode,
            size,
            mtime,
            uid
        });
    };
    
    const _readdir = reRequire('../lib/readdir');
    const [e] = await tryToCatch(_readdir, '.');
    
    fs.lstat = lstat;
    fs.readdir = readdir;
    
    t.notOk(e, e && e.message || 'should not receive error');
    t.end();
});

test('readdir: result: directory link', async (t) => {
    const {
        lstat,
        readdir,
    } = fs;
    
    const name = 'hello';
    const mode = 16893;
    const size = 1024;
    const mtime = new Date();
    const uid = 1000;
    
    fs.readdir = (dir, fn) => {
        fn(null, [name]);
    };
    
    fs.lstat = (name, fn) => {
        fn(null, {
            isDirectory: () => true,
            isSymbolicLink: () => true,
            name,
            mode,
            size,
            mtime,
            uid
        });
    };
    
    const expected = [{
        name,
        size,
        date: mtime,
        owner: uid,
        mode,
        type: 'directory-link',
    }];
    
    const _readdir = reRequire('../lib/readdir');
    const [, result] = await tryToCatch(_readdir, '.');
    
    fs.lstat = lstat;
    fs.readdir = readdir;
    
    t.deepEqual(result, expected, 'should get raw values');
    t.end();
});

test('readdir: result: directory link: no error', async (t) => {
    const {
        lstat,
        readdir,
    } = fs;
    
    const name = 'hello';
    const mode = 16893;
    const size = 1024;
    const mtime = new Date();
    const uid = 1000;
    
    fs.readdir = (dir, fn) => {
        fn(null, [name]);
    };
    
    fs.lstat = (name, fn) => {
        fn(null, {
            isDirectory: stub.returns(true),
            isSymbolicLink: stub.returns(true),
            name,
            mode,
            size,
            mtime,
            uid
        });
    };
    
    const _readdir = reRequire('../lib/readdir');
    const [e] = await tryToCatch(_readdir, '.');
    
    fs.lstat = lstat;
    fs.readdir = readdir;
    
    t.notOk(e, e && e.message || 'should not receive error');
    t.end();
});
