# fetchResource

loaders.gl offers the helper function `fetchResource` that will wrap a variety of data objects in a `Response` object (adding a `Content-Length` header if possible). The resulting `Response` object that can be used to further process those data objects using the common, standard `Response` class API.

Since the loaders.gl API is designed to accept `Response` objects wherever possible, calling `fetchResource` is often a good first step when preparing to parse data.

Note that while the `fetchResource` function is mainly a wrapper around the standard `fetch` and `Response` APIs, it does provide a few additional capabilities (that may be important to your use case):

- For "local" URLs, adds any registered path prefixes and calls `fetch`.
- For non-URL resources, creates a `Response` object initialized with the supplied resource.
- When possible, populates the `Content-Length` header on the returned response (e.g. improving progress tracking)

## Usage

To load from a URL, use the `fetchResource` function as follows:

```js
import {fetchResource} from '@loaders.gl/core';

const response = await fetchResource(url || data url || blob || file || stream || ...);

// Now use the standard `Response` APIs
const contentLength = response.headers.get('content-length');
const mimeType = response.headers.get('content-type');
const arrayBuffer = await response.arrayBuffer();
```

The `Response` object from `fetchResource` is usually passed to `parse` as follows:

```js
import {fetchResource, parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

const response = await fetchResource(url);
const data = await parse(response, OBJLoader);
```

Again, note that `fetchResource` is an optional helper function. If you are just loading from URLs and you don't use path prefixes, you can use the browsers built-in `fetch` method directly:

```js
import {parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

const response = await fetch(url);
const data = await parse(response, OBJLoader);
```

## Functions

### fetchResource(reource: string | ResourceType, options?: object): Promise<Response>

A wrapper around the platform [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) function with some additions:

- Supports `setPathPrefix`: If path prefix has been set, it will be appended if `url` is relative (e.g. does not start with a `/`).
- Supports `File` and `Blob` objects on the browser (and returns "mock" fetch response objects).

Returns:

- A promise that resolves into a fetch `Response` object,

Options:

Under Node.js, options include (see [fs.createReadStream](https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options)):

- `options.highWaterMark` (Number) Default: 64K (64 \* 1024) - Determines the "chunk size" of data read from the file.

### readFileSync(url : String [, options : Object]) : ArrayBuffer | String

> This function only works on Node.js or using data URLs.

Reads the raw data from a file asynchronously.

Notes:

- Any path prefix set by `setPathPrefix` will be appended to relative urls.

## Remarks

- `fetchResource` will delegate to `fetch` after resolving the URL.
- For some data sources such as node.js and `File`/`Blob` objects a mock `Response` object will be returned, and not all fields/members may be implemented.
- When possible, `Content-Length` and `Content-Type` `headers` are also populated for non-request data sources including `File`, `Blob` and Node.js files.

| Data Type        | Description                                                                            | Comments                                                      |
| ---------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `Response`       | `fetch` response object returned by e.g. `fetchFile` or `fetch`.                       | Data will be streamed from the `response.body` stream.        |
| `ArrayBuffer`    | Parse from binary data in an array buffer                                              |                                                               |
| `String`         | Parse from text data in a string.                                                      | Only works for loaders that support textual input.            |
| `ReadableStream` | A DOM stream or Node stream.                                                           | Streams are converted into async iterators behind the scenes. |
| `Promise`        | A promise that resolves to any of the other supported data types can also be supplied. |

TODO - create a stream that reads from an iterator?

| `Iterator` | Iterator that yeilds binary (`ArrayBuffer`) chunks or string chunks | string chunks only work for loaders that support textual input. |
| `AsyncIterator` | iterator that yeilds promises that resolve to binary (`ArrayBuffer`) chunks or string chunks. |

## Polyfills

`fetchResource` is intended to be a small function (in terms of complexity and bundle size) to help applications work with various resources in a simple portable way. The `Response` object returned on Node.js does not implement all the functionality the browser does.

- In fact, the use of any of the file utilities including `readFile` and `readFileAsync` functions with other loaders.gl functions is entirely optional. loader objects can be used with data loaded via any mechanism the application prefers, e.g. directly using `fetch`, `XMLHttpRequest` etc.

## Response objects

loaders.gl is built to maximize integration with the modern browser API `Response` object (handling of older browsers and Node.js is done via polyfills of those functions.)

[`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) with the following methods/fields:

- `headers`: `Headers` - A [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) object.
- `arrayBuffer()`: Promise.ArrayBuffer`- Loads the file as an`ArrayBuffer`.
- `text()`: Promise.String` - Loads the file and decodes it into text.
- `json()`: Promise.String` - Loads the file and decodes it into JSON.
- `body` : ReadableStream` - A stream that can be used to incrementally read the contents of the file.

## Creating Response objects

`fetch` returns a `Response` object, which provides methods to access the data, either as a stream or atomically. The `Response` object can also be creating directly from a variety of resources.

For the following types, the application can create new `Response` objects directly:

- `string`
- `ArrayBuffer`
- `Uint8Array` etc (typed arrays)
- `Blob`/`File`
- `ReadableStream`
- `FormData` (Note: untested)

To create `Response` objects for the following input types, the application uses `fetch`:

- `http:/https:` urls
- `data:` urls, and on some browsers
- `blob:` urls (returned by `URL.createObjectURL`)

## Headers

### Content-Type

While the `Content-Type` header is normally populated as expected if available in the source object. It is e.g. copied from the data url header, the Blob's `type` field etc).

```js
const response = new Response(arrayBuffer);
response.headers.set('content-length': blob.size());
```

### Content-Length

the `Content-Length` header is not set automatically by `fetch` or the `Response` constructor. This is unfortunate, as having a `Content-Length` header significantly enhances progress tracking functionality in loaders.gl.

In some cases, applications can add content length information manually with out too much effort:

```js
const response = new Response(blob, {headers: {'content-length': blob.size()}})
// or
const response = new Response(blob);
response.headers.set('content-length': blob.size());
```

However in other cases (such as data URLs etc) the effort can become more substantial.

```js
// scheme: `data:[<mediatype>][;base64],<data>`
// Note: the below does not generate correct length for base64 encoded data urls
const response = fetch(dataUrl);
response.headers.set('content-length': dataUrl.length - dataUrl.indexOf(','));
```

## Remarks

- The "path prefix" support is intentended to be a simple mechanism to support certain work-arounds. It is intended to help e.g. in situations like getting test cases to load data from the right place, but was never intended to support general application use cases.
- The stream utilities are intended to be small optional helpers that facilitate writing platform independent code that works with streams. This can be valuable as JavaScript Stream APIs are still maturing and there are still significant differences between platforms. However, streams and iterators created directly using platform specific APIs can be used as parameters to loaders.gl functions whenever a stream is expected, allowing the application to take full control when desired.
