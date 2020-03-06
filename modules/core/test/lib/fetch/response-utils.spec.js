import test from 'tape-promise/tape';
import {checkResponse} from '@loaders.gl/core/lib/fetch/response-utils';

class MockResponse {
  get ok() {
    return false;
  }

  get status() {
    return 404;
  }

  async text() {
    return '{message: "server died"}';
  }
}

const response = new MockResponse();

test('checkResponse', async t => {
  t.throws(() => checkResponse(response), /404/, 'throws a message that includes status code');
  t.end();
});
