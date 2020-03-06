/* global fetch */
import {resolvePath} from '@loaders.gl/loader-utils';
import {makeResponse} from './response-utils';

/**
 * As fetch but respects pathPrefix and file aliases
 * Also enables reading of data from:
 * data urls
 * http/http urls
 * File/Blob objects
 *
 * @param {*} resource
 * @param {object} options
 *
 *  TODO - could we infer length for `blob:` urls and annotate the Response with content-length?
 */
export async function fetchResource(resource, options = {}) {
  // If resource is not a URL string, try to wrap the resource in a `Response` object
  // (Strings are assumed to be URLs, unless `options.string` is true)
  if (typeof resource !== 'string' || options.string) {
    return makeResponse(resource);
  }

  // Fetch a URL

  // If relative paths, add any registered prefix, and resolve any aliases
  resource = resolvePath(resource);

  // Fetch the resource (load from http: or local urls, or base64 decode dataURLs etc)
  const response = await fetch(resource, options);

  // Anotate `data:` urls with content-length
  if (resource.startsWith('data:')) {
    const contentLength = resource.length - resource.indexOf(',');
    response.headers.set('Content-Length', `${contentLength}`);
  }

  return response;
}
