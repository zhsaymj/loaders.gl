import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {ArrowLoader, ArrowWorkerLoader} from '@loaders.gl/arrow';
import {isBrowser, makeStreamIterator, resolvePath} from '@loaders.gl/loader-utils';
import {setLoaderOptions, fetchFile, parse, parseInBatches} from '@loaders.gl/core';

// Small Arrow Sample Files
const ARROW_SIMPLE = '@loaders.gl/arrow/test/data/simple.arrow';
const ARROW_DICTIONARY = '@loaders.gl/arrow/test/data/dictionary.arrow';
const ARROW_STRUCT = '@loaders.gl/arrow/test/data/struct.arrow';

// Bigger, batched sample file
const ARROW_BIOGRID_NODES = '@loaders.gl/arrow/test/data/biogrid-nodes.arrow';

setLoaderOptions({
  arrow: {
    workerUrl: 'modules/arrow/dist/arrow-loader.worker.js'
  }
});

test('ArrowLoader#loader conformance', t => {
  validateLoader(t, ArrowLoader, 'ArrowLoader');
  t.end();
});

test('ArrowLoader#parseSync(simple.arrow)', async t => {
  const columns = await parse(fetchFile(ARROW_SIMPLE), ArrowLoader, {worker: false});
  // Check loader specific results
  t.ok(columns.bar, 'bar column loaded');
  t.ok(columns.baz, 'baz column loaded');
  t.ok(columns.foo, 'foo column loaded');
  t.end();
});

test('ArrowLoader#parseSync(dictionary.arrow)', async t => {
  const columns = await parse(fetchFile(ARROW_DICTIONARY), ArrowLoader);
  // Check loader specific results
  t.ok(columns['example-csv'], 'example-csv loaded');
  t.end();
});

test('ArrowLoader#parse(fetchFile(struct).arrow)', async t => {
  const columns = await parse(fetchFile(ARROW_STRUCT), ArrowLoader);
  // Check loader specific results
  t.ok(columns.struct_nullable, 'struct_nullable loaded');
  t.end();
});

// TODO - Arrow worker seems to not bundle apache arrow lib?
test('ArrowLoader#parse (WORKER)', async t => {
  if (!isBrowser) {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await parse(fetchFile(ARROW_SIMPLE), ArrowWorkerLoader);
  t.ok(data, 'Data returned');
  t.end();
});

test('ArrowLoader#parseInBatches(async input)', async t => {
  // TODO - parseInBatches should accept fetch response directly
  const response = await fetchFile(ARROW_BIOGRID_NODES);
  const data = await response.arrayBuffer();
  const asyncIterator = await parseInBatches(data, ArrowLoader);
  for await (const batch of asyncIterator) {
    t.ok(batch, 'received batch');
  }
  t.end();
});

/*
test('ArrowLoader#parseInBatchesSync(sync input)', async t => {
  const response = await fetchFile(ARROW_BIOGRID_NODES);
  const data = await response.arrayBuffer();

  const iterator = parseInBatchesSync(data, ArrowLoader);
  for (const batch of iterator) {
    t.ok(batch, 'received batch');
    t.end();
  }
});
*/

// TODO - Move node stream test to generic parseInBatches test?
test('ArrowLoader#parseInBatches(Stream)', async t => {
  if (isBrowser) {
    t.comment('Node stream test case only supported in Node');
    t.end();
    return;
  }
  const fs = require('fs');
  const stream = fs.createReadStream(resolvePath(ARROW_BIOGRID_NODES));
  const asyncIterator = await parseInBatches(makeStreamIterator(stream), ArrowLoader);
  for await (const batch of asyncIterator) {
    t.ok(batch, 'received batch');
  }
  t.end();
});
