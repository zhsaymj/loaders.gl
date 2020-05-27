import test from 'tape-promise/tape';
import {checkResponse} from '@loaders.gl/core/lib/utils/response-utils';

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
  // @ts-ignore TS2345 - Mock response
  t.rejects(() => checkResponse(response), /404/, 'throws a message that includes status code');
  t.end();
});
