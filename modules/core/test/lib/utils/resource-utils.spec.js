import test from 'tape-promise/tape';
import {
  getResourceUrlAndType,
  getResourceContentLength
} from '@loaders.gl/core/lib/utils/resource-utils';

// import {isBrowser, isIterator} from '@loaders.gl/core';

test('getResourceUrlAndType', t => {
  t.equal(typeof getResourceUrlAndType, 'function');
  t.end();
});

test('getResourceContentLength', t => {
  t.equal(typeof getResourceContentLength, 'function');
  t.end();
});
