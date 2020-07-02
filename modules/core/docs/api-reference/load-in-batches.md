# loadInBatches

`loadInBatches` opens `url` as a stream and passed and remaining parameters to `parseInBatches`. See the documentation of `load` and `parseInBatches` for details.

### Usage

```js
const iteratorPromises = await loadInBatches([blob1, blob2], OBJLoader);
for await (const iterator of iteratorPromises) {
  for await (const batch of iterator) {
    // Just the one batch...
    t.equal(batch.mode, 4, 'mode is TRIANGLES (4)');
  }
}
```

### `loadInBatches(url: string | File | ... , loaders: object | object[], options?: object]): Promise<AsyncIrerator<any>>`

### `loadInBatches(files: (string | File | ...)[] | FileList, loaders: object | object[], options?: object]): Promise<AsyncIterator<any>>`

## Options

A loader object, that can contain a mix of options:

- options specific to `loadInBatches`, see below.
- options defined by the `parse` function can be specified.
- options specific to any loaders can also be specified (in loader specific sub-objects).

Please refer to the corresponding documentation page for for `parse` and for each loader for details.

| Option                       | Type      | Default | Description                                           |
| ---------------------------- | --------- | ------- | ----------------------------------------------------- |
| `options.ignoreUnknownFiles` | `boolean` | `true`  | Ignores unknown files if multiple files are provided. |
