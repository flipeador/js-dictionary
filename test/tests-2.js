import test from 'node:test';
import assert from 'node:assert/strict';

import { Dict } from '@flipeador/js-dictionary';

async function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

await test('temporary elements', async () => {
    const map = new Dict();

    map.set('key', 'val', 500);
    await sleep(300);
    assert(map.has('key'));
    map.set('key', 'val');
    await sleep(300);
    assert(map.get('key'));
    await sleep(300);
    assert(map.has('key'));
    map.set('key', 'val', null);
    await sleep(300);
    assert(!map.has('key'));

    map.set('key', 'val', 100);
    map.set('key', 'val', 0);
    assert(map.has('key'));
    await sleep(150);
    assert(map.has('key'));
});
