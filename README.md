# JavaScript Dictionary

JavaScript Map with temporary elements and additional utility methods.

## Installation

```
npm i flipeador/js-dictionary#semver:^1.0.0
```

## Example

```js
import { Dict } from '@flipeador/js-dictionary';

const map = new Dict();

map.set('key', 'never expires');
map.set('key', 'expires in 1 second', 1000); // set timer
map.set('key', 'expires in less than a second', null); // keep current timer
map.set('key', 'expires in 1 second'); // refresh timer
map.get('key', false); // keep current timer
map.get('key'); // refresh timer
map.set('key', 'never expires', 0); // remove timer

console.log(map); // Dict(1) [Map] { 'key' => 'never expires' }
```

## License

This project is licensed under the **Apache License 2.0**. See the [license file](LICENSE) for details.
