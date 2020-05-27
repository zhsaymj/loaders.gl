/* global fetch, Response */
import {resolvePath} from '@loaders.gl/loader-utils';
import {isFileReadable} from '../../javascript-utils/is-type';
import {getResponseError} from '../utils/response-utils';

// As fetch but respects pathPrefix and file aliases
// Reads file data from:
// * data urls
// * http/http urls
// * File/Blob objects
export async function fetchFile(url, options = {}) {
  if (isFileReadable(url)) {
    const fileOrBlob = url;
    return new Response(fileOrBlob, {
      // Make sure we have headers so that we can particpate in
      // loader auto-selection and progress tracking!
      headers: {
        'Content-Length': fileOrBlob.size,
        'Content-Type': fileOrBlob.type
      }
    });
  }

  url = resolvePath(url);
  // TODO - SUPPORT reading from `File` objects
  const response = await fetch(url, options);
  if (!response.ok && options.throws) {
    throw new Error(await getResponseError(response));
  }
  return response;
}
