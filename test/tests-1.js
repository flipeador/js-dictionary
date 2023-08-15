import test from 'node:test';
import assert from 'node:assert/strict';

import { Dict } from '@flipeador/js-dictionary';

await test('basic operations', () => {
    const map = new Dict({A: 1}, ['B', 2]);
    assert.equal(map.set('C', 3), 3);
    assert.equal(map.size, 3);
    assert.equal(map.has('C'), true);
    assert.equal(map.get('C'), 3);
    assert.equal(map.delete('C'), 3);
    assert.equal(map.has('C'), false);
    assert.equal(map.get('C'), undefined);
    assert.equal(map.clear(), 2);
    assert.equal(map.size, 0);
});

await test('at()', async ctx => {
    const map = new Dict({A: 1, B: 2, C: 3});

    await ctx.test('positive index', () => {
        assert.deepEqual(map.at(0), ['A', 1]);
    });

    await ctx.test('negative index', () => {
        assert.deepEqual(map.at(-1), ['C', 3]);
    });

    await ctx.test('invalid positive index', () => {
        assert.equal(map.at(3), undefined);
    });

    await ctx.test('invalid negative index', () => {
        assert.equal(map.at(-4), undefined);
    });
});

await test('ensure()', async ctx => {
    const map = new Dict();

    await ctx.test('set new value if key does not exist', () => {
        assert.equal(map.ensure('A', 2), 2);
        assert.equal(map.get('A'), 2);
    });

    await ctx.test('return existing value if key exists', () => {
        assert.equal(map.ensure('A', 4), 2);
        assert.equal(map.get('A'), 2);
    });
});

await test('sweep()', () => {
    const map = new Dict({A: 1, B: 2, C: 3});
    const count = map.sweep(value => value & 1); // odd
    assert.equal(count, 2);
    assert.deepEqual([...map], [['B', 2]]);
});

await test('equals()', () => {
    const m1 = new Dict();
    const m2 = new Dict({A: 2});
    const m3 = new Dict({A: 4});
    const m4 = new Dict({B: 2});
    const m5 = new Dict({A: 2});

    assert.equal(m2.equals(), false);
    assert.equal(m2.equals(m2), true);
    assert.equal(m2.equals(m1), false);
    assert.equal(m2.equals(m3), false);
    assert.equal(m2.equals(m4), false);
    assert.equal(m2.equals(m5), true);
});

await test('first() / last()', () => {
    const map = new Dict({A: 1, B: 2, C: 3});
    assert.deepEqual([...map.first()], [['A', 1]]);
    assert.deepEqual([...map.last(2)], [['B', 2], ['C', 3]]);
});

await test('clone()', () => {
    const map = new Dict({A: 1, B: 2, C: 3});
    const clone = map.clone();
    assert(clone instanceof Dict);
    assert.notEqual(clone, map);
    assert.deepEqual([...map], [...clone]);
});

await test('filter()', () => {
    const map = new Dict({A: 1, B: 2, C: 3});
    const filtered = map.filter(value => value & 1); // odd
    assert(filtered instanceof Dict);
    assert.deepEqual([...filtered], [['A', 1], ['C', 3]]);
});

await test('reduce()', async ctx => {
    const emptyMap = new Dict();
    const map = new Dict({A: 1, B: 2, C: 3});

    await ctx.test('with initial value', () => {
        const sum = map.reduce((a, [_, v]) => a + v, 0);
        assert.equal(sum, 6);
    });

    await ctx.test('without initial value', () => {
        const val = map.reduce((a, [k, v]) => [k, a[1] + v]);
        assert.deepEqual(val, ['C', 6]);
    });

    await ctx.test('empty with initial value', () => {
        const sum = emptyMap.reduce((a, [_, v]) => a + v, 0);
        assert.equal(sum, 0);
    });

    await ctx.test('empty without initial value', () => {
        assert.throws(
            () => emptyMap.reduce(() => 0),
            new TypeError('Reduce of empty map with no initial value')
        );
    });
});

await test('partition()', () => {
    const map = new Dict({A: 1, B: 2});
    const maps = map.partition(value => value & 1); // odd
    assert(maps instanceof Array);
    assert.equal(maps.length, 2);
    assert.deepEqual([...maps[0]], [['A', 1]]);
    assert.deepEqual([...maps[1]], [['B', 2]]);
});

await test('concat()', () => {
    const m1 = new Dict({A: 1});
    const m2 = new Dict({A: 0, B: 2});

    const m3 = m1.concat(m2);
    assert(m3 instanceof Dict);
    assert.equal(m3, m1);
    assert.deepEqual([...m3], [['A', 1], ['B', 2]]);
});

await test('sort()', () => {
    const m1 = new Dict({B: 2, C: 3, A: 1});
    const m2 = m1.sort();
    assert.equal(m2, m1);
    assert.deepEqual([...m2], [['A', 1], ['B', 2], ['C', 3]]);
});

await test('each()', () => {
    const map = new Dict({A: 1, B: 2});
    const list = [];
    map.each((value, key) => list.push([key, value]));
    assert.deepEqual(list, [['A', 1], ['B', 2]]);
});
