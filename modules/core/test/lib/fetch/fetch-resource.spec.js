/* global Blob */
import test from 'tape-promise/tape';

import {isBrowser, fetchResource, readFileSync, resolvePath} from '@loaders.gl/core';

const DATA_URL = 'data:,important content!';
const BINARY_URL = '@loaders.gl/core/test/data/files/binary-data.bin';
const TEXT_URL = '@loaders.gl/core/test/data/files/hello-world.txt';
const JSON_URL = '@loaders.gl/core/test/data/files/basic.json';

const JSON_DATA = [{col1: 22, col2: 'abc'}];

test('fetchResource#imports', t => {
  t.ok(fetchResource, 'fetchResource defined');
  t.ok(readFileSync, 'readFileSync defined');
  t.end();
});

test('fetchResource#url (BINARY)', async t => {
  const response = await fetchResource(BINARY_URL);
  const data = await response.arrayBuffer();
  t.ok(data instanceof ArrayBuffer, 'fetchResource loaded local file into ArrayBuffer');
  t.equals(data.byteLength, 4, 'fetchResource loaded local file length correctly');
  t.end();
});

test('fetchResource#url (TEXT)', async t => {
  const response = await fetchResource(TEXT_URL);
  const data = await response.text();
  t.equals(typeof data, 'string', 'fetchResource loaded local file into string');
  t.equals(data, 'Hello world!', 'fetchResource loaded local file data correctly');
  t.end();
});

test('fetchResource#dataUrl', async t => {
  const response = await fetchResource(DATA_URL);
  const data = await response.arrayBuffer();
  t.ok(data, 'readFileSync loaded data url');
  t.equals(data, 'important content!', 'fetchResource loaded data url');
  t.end();
});

test('fetchResource#stream', async t => {
  const response = await fetchResource(JSON_URL);
  const stream = response.body;
  const response2 = await fetchResource(stream);
  t.ok(response2, 'fetchResource(stream) returned response');
  t.end();
});

test('fetchResource#Blob(text) - BROWSER ONLY', async t => {
  if (isBrowser) {
    const TEXT_DATA = JSON.stringify(JSON_DATA);
    const blob = new Blob([TEXT_DATA]);
    const data = await fetchResource(blob);
    t.deepEquals(data, JSON_DATA, 'fetchResource(Blob) returned data');
  }
  t.end();
});

test('fetchResource#Node stream - NODE ONLY', async t => {
  if (!isBrowser) {
    const fs = require('fs');
    const stream = fs.createReadStream(resolvePath(JSON_URL));
    const response = await fetchResource(stream);
    const data = await response.json();
    t.equals(typeof data, 'object', 'fetchResource(Node stream) returned data');
  }
  t.end();
});
