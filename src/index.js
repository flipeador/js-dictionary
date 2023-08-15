/*
    Javascript Map with temporary elements and additional utility methods.
    https://github.com/flipeador/js-dictionary
*/

// import { setTimeout, clearTimeout } from 'node:timers';

function result(fn, ...args) {
    return typeof(fn) === 'function' ? fn(...args) : fn;
}

/**
 * Get the timeout of an item, and adjusts it if necessary.
 * @param {Object} item The item.
 * @param {Boolean} remaining Whether to determine the remaining timeout.
 * @returns {undefined|null|Number}
 * - Returns the timeout if the item has a valid timer.
 * - Returns `undefined` if the item does not have a timer.
 * - Returns `null` if the item's timeout has expired.
 */
function getItemTimeout(item, remaining) {
    if (!item?.timer || !remaining)
        return item?.timer?.timeout;
    const timeout = item.timer.timeout - (Date.now() - item.timer.timestamp);
    return timeout > 0 ? timeout : null;
}

/**
 * A Map with temporary elements and additional utility methods.
 */
export class Dict extends Map
{
    constructor(...entries)
    {
        super();

        for (const entry of entries) {
            if (entry instanceof Dict)
                this.concat(entry);
            else if (entry instanceof Array)
                this.set(...entry);
            else for (const key in entry)
                this.set(key, entry[key]);
        }
    }

    /**
     * Get the element at a given index, allowing for positive and negative integers.
     * @param {Number} index The index of the element to obtain.
     * @return The element at the specified index, or `undefined` if it does not exist.
     */
    at(index, refreshTimeout=true)
    {
        if (index < 0)
            index = super.size + index;
        let i = 0;
        for (const [key, item] of super.entries())
            if (index === i++)
                return refreshTimeout
                    ? [key, this.#refreshItemTimeout(key, item).value]
                    : [key, item.value];
    }

    /**
     * Get the element associated with the specified key.
     * @param key The key of the element.
     * @return The value associated with `key`, or `undefined` if the element does not exist.
     */
    get(key, refreshTimeout=true)
    {
        return this.#getItem(key, refreshTimeout)?.value;
    }

    /**
     * Get an element if it exists, otherwise sets and returns `defval`.
     * @param key The key of the element.
     * @param defval Default value or a `function(key,map)` that generates it.
     * @param {undefined|Number} timeout Timeout, in milliseconds.
     * @return The value associated with `key`, or `defval` if the element does not exist.
     */
    ensure(key, defval, timeout, refreshTimeout=true)
    {
        const item = this.#getItem(key, refreshTimeout);
        if (item) return item.value;
        return this.#setItem(key, result(defval, key, this), timeout);
    }

    /**
     * Add or update an element.
     * @param key The key of the element.
     * @param value The value of the element.
     * @param {undefined|null|Number} timeout
     * Timeout, in milliseconds. Once the time elapses, the element is deleted.
     * The timer of each element can be reset by setting `refreshTimeout` when retrieving.
     * If the element does not exist; `undefined`, `null`, zero or a negative number adds the element without a timer.
     * - If the element already exists:
     *   - Specify zero or a negative number to delete the timer.
     *   - Specify `undefined` to refresh the timer. This is the default.
     *   - Specify `null` to keep the currently assigned timer.
     * @return The specified `value`.
     */
    set(key, value, timeout)
    {
        return this.#setItem(key, value, timeout, super.get(key));
    }

    /**
     * Add a new element.
     * @param key The key of the element.
     * @param value The value or a `function(key,map)` that generates it.
     * @param {Number?} timeout Timeout, in milliseconds.
     * @return The `value` of the new element, or `undefined` if the element already exists.
     */
    add(key, value, timeout)
    {
        const item = super.get(key);
        if (!item)
            return this.#setItem(key, result(value, key, this), timeout);
    }

    /**
     * Update an existing element.
     * @param key The key of the element.
     * @param value The value or a `function(key,map)` that generates it.
     * @param {Number?} timeout Timeout, in milliseconds.
     * @return The new `value` of the element, or `undefined` if the element does not exist.
     */
    update(key, value, timeout)
    {
        const item = super.get(key);
        if (item)
            return this.#setItem(key, result(value, key, this), timeout, item);
    }

    /**
     * Delete an element.
     * @param key The key of the element.
     * @return The value of the deleted element, or `undefined` if the element does not exist.
     */
    delete(key)
    {
        return this.#deleteItem(key, super.get(key))?.value;
    }

    /**
     * Delete elements that satisfy the provided filter function.
     * @param {Function} fn `Function(value,key,map)` used to test.
     * @return The number of deleted elements.
     */
    sweep(fn)
    {
        const size = super.size;
        for (const [key, item] of super.entries())
            if (fn(item.value, key, this))
                this.#deleteItem(key, item);
        return size - super.size;
    }

    /**
     * Delete all the elements.
     * @return The number of deleted elements.
     */
    clear()
    {
        return this.sweep(() => true);
    }

    /**
     * Check if the map shares identical elements with another.
     * @param {Dict} other The other map to compare with.
     * @return Whether the maps have identical contents.
     */
    equals(other)
    {
        if (this === other) return true;
        if (!(other instanceof Dict) || other.size !== super.size)
            return false;
        for (const [key, item] of super.entries()) {
            const otherItem = other.#getItem(key);
            if (!otherItem || !Object.is(otherItem.value, item.value))
                return false;
        }
        return true;
    }

    /**
     * Check if all the elements passes a test function.
     * @param {Function} fn `Function(value,key,map)` used to test.
     * @return Whether all elements passed the test function.
     */
    every(fn)
    {
        for (const [key, item] of super.entries())
            if (!fn(item.value, key, this))
                return false;
        return true;
    }

    /**
     * Check if all of the specified elements exist.
     * @param keys The keys of the elements to check for.
     * @return Whether all of the specified elements exist.
     */
    hasAll(...keys)
    {
        return keys.every(key => this.has(key));
    }

    /**
     * Check if any of the specified elements exist.
     * @param keys The keys of the elements to check for.
     * @return Whether any of the specified elements exist.
     */
    hasAny(...keys)
    {
        return keys.some(key => this.has(key));
    }

    /**
     * Search for a single element that pass the test function.
     * @param {Function} fn `Function(value,key,map)` used to test.
     * @return The key/value pair found, otherwise `undefined`.
     */
    find(fn)
    {
        for (const [key, item] of super.entries())
            if (fn(item.value, key, this))
                return [key, item.value];
    }

    /**
     * Iterate the first element(s) from the map, in insertion order.
     * @param {Number} count The max number of elements to get.
     * @return A list of key/value pair for each element found.
     */
    *first(count=1)
    {
        let index = 0;
        for (const [key, item] of super.entries())
            if (index++ >= count) break;
            else yield [key, item.value];
    }

    /**
     * Iterate the last element(s) from the map, in insertion order.
     * @param {Number} count The max number of elements to get.
     * @return A list of key/value pair for each element found.
     */
    *last(count=1)
    {
        let index = 0;
        for (const [key, item] of super.entries())
            if (index++ >= super.size - count)
                yield [key, item.value];
    }

    /**
     * Create an identical shallow copy.
     */
    clone(refreshTimeout=true)
    {
        const map = new Dict();
        for (const [key, item] of super.entries())
            map.#copyItem(key, item, refreshTimeout);
        return map;
    }

    /**
     * Create a map containing a shallow copy of the elements that pass the test function.
     * @param {Function} fn `Function(value,key,map)` used to test.
     */
    filter(fn, refreshTimeout=true)
    {
        const map = new Dict();
        for (const [key, item] of super.entries())
            if (fn(item.value, key, this))
                map.#copyItem(key, item, refreshTimeout);
        return map;
    }

    /**
     * Maps each element to another value into an array.
     * @param {Function} fn `Function(value,key,map)` that produces an element of the new array.
     */
    map(fn)
    {
        const iter = super.entries();
        return Array.from({ length: super.size }, () => {
            const [key, item] = iter.next().value;
            return fn(item.value, key, this);
        });
    }

    /**
     * Applies a function on each element to produce a single value.
     * @param {Function} fn `Function(acc,pair,index,map)` used to reduce.
     * @param value Starting value for the accumulator.
     * @return The value that results from running `fn` to completion over all elements.
     */
    reduce(fn, value)
    {
        const iter = this.entries();
        let index = value === undefined ? 1 : 0;
        if (index && (value = iter.next().value) === undefined)
            throw new TypeError('Reduce of empty map with no initial value');
        for (const pair of iter)
            value = fn(value, pair, index++, this);
        return value;
    }

    /**
     * Partition the map into two maps given a test function.
     * @param {Function} fn `Function(value,key,map)` used to test.
     * @param {Dict?} first The map that contains the elements that passed.
     * @param {Dict?} second The map that contains the elements that failed.
     * @return {Dict[]} An array with the first and second map.
     */
    partition(fn, first, second, refreshTimeout=true)
    {
        const maps = [first??new Dict(), second??new Dict()];
        for (const [key, item] of super.entries())
            maps[fn(item.value, key, this) ? 0 : 1]
                .#copyItem(key, item, refreshTimeout);
        return maps;
    }

    /**
     * Combine the map with a shallow copy of the elements from another map.
     * @param {Dict} other The other map whose elements are to be combined.
     */
    concat(other, refreshTimeout=true)
    {
        if (this === other) return this;
        for (const [key, item] of other.#iter())
            this.#copyItem(key, item, refreshTimeout, true);
        return this;
    }

    /**
     * Sort the elements in place and returns the map.
     * @param {Function} fn `Function(firstV,secV,firstK,secK)` that defines the sort order.
     */
    sort(fn=Dict.compareSort, refreshTimeout=true)
    {
        const entries = [...super.entries()];
        entries.sort((a, b) => fn(a[1].value, b[1].value, a[0], b[0]));
        super.clear();
        for (const [key, item] of entries)
            this.#copyItem(key, item, refreshTimeout);
        return this;
    }

    /**
     * Executes a provided function once per each element, in insertion order.
     * @param {Function} fn `Function(value,key,map)` to execute for each element.
     * @param self Value to use as `this` when executing `fn`.
     */
    each(fn, self)
    {
        if (self) fn = fn.bind(self);
        for (const [key, item] of super.entries())
            fn(item.value, key, this);
        return this;
    }

    toString(sep=' ', filter=undefined, map=undefined)
    {
        let str = '';
        for (const [key, value] of this.entries())
            if (!filter || filter(value, key, this))
                str += map
                    ? `${map(value, key, this)}${sep}`
                    : `${value}${sep}`;
        return sep.length ? str.slice(0, -sep.length) : str;
    }

    debug()
    {
        console.log(`${this.constructor.name}[${super.size}]:`);
        for (const [key, item] of super.entries())
            console.log('>', key, item);
    }

    /**
     * Returns an iterable of values for every entry in the map, in insertion order.
     */
    *values()
    {
        for (const item of super.values())
            yield item.value;
    }

    /**
     * Returns an iterable of key/value pairs for every entry in the map, in insertion order.
     */
    *entries()
    {
        for (const [key, item] of super.entries())
            yield [key, item.value];
    }

    *[Symbol.iterator]()
    {
        yield * this.entries();
    }

    *[Symbol.asyncIterator]()
    {
        for (const item of this.entries())
            yield Promise.resolve(item);
    }

    *#iter()
    {
        yield * super.entries();
    }

    #getItem(key, refreshTimeout, item)
    {
        return refreshTimeout
            ? this.#refreshItemTimeout(key, item??super.get(key))
            : super.get(key);
    }

    #setItem(key, value, timeout, item)
    {
        if (item) {
            item.value = value;
            if (typeof(timeout) === 'number')
                this.#setItemTimeout(key, item, timeout, true);
            else if (item.timer && timeout === undefined)
                this.#refreshItemTimeout(key, item);
        } else
            super.set(key, this.#setItemTimeout(key, {value}, timeout));
        return value;
    }

    #copyItem(key, item, refreshTimeout, ensure)
    {
        const timeout = getItemTimeout(item, !refreshTimeout);
        return timeout === null ? undefined : ensure
            ? this.ensure(key, () => item.value, timeout)
            : this.set(key, item.value, timeout);
    }

    #deleteItem(key, item)
    {
        if (item && super.delete(key))
            clearTimeout(item.timer?.timer);
        return item;
    }

    #refreshItemTimeout(key, item)
    {
        if (item?.timer) {
            // Node.js
            if (item.timer.timer.refresh)
                item.timer.timer.refresh();
            // Browser
            else {
                clearTimeout(item.timer.timer);
                item.timer.timer = setTimeout(() => super.delete(key), item.timer.timeout);
            }
            item.timer.timestamp = Date.now();
        }
        return item;
    }

    #setItemTimeout(key, item, timeout, clear)
    {
        if (timeout && timeout > 0) {
            clearTimeout(item.timer?.timer);
            item.timer = {
                timer: setTimeout(() => super.delete(key), timeout),
                timeout,
                timestamp: Date.now()
            };
        } else if (clear) {
            clearTimeout(item.timer?.timer);
            delete item.timer;
        }
        return item;
    }

    /**
     * Function that defines the sort order.
     * @param first The first value to compare.
     * @param second The second value to compare.
     * @returns A number indicating the order relationship between the values.
     */
    static compareSort(first, second)
    {
        return Number(first > second) || Number(first === second) - 1;
    }
}

export default { Dict };
