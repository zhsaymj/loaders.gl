/* global Response */
import {isResponse} from '../../javascript-utils/is-type';
import {getResourceContentLength} from './resource-utils';

const CONTENT_LENGTH = 'content-length';

/**
 *
 * @param {*} resource
 * @todo - check if response constructor sets these fields automatically
 */
export function makeResponse(resource) {
  if (isResponse(resource)) {
    return resource;
  }

  // Add content-length header if possible
  /** @type {Record<string, string>} */
  const headers = {};
  const contentLength = getResourceContentLength(resource);
  if (contentLength > -1) {
    headers[CONTENT_LENGTH] = String(contentLength);
  }

  // Attempt to create a Response from the resource, adding headers if appropriate
  return new Response(resource, {headers});
}

export async function checkResponse(response) {
  if (!response.ok) {
    const errorMessage = await getResponseError(response);
    throw new Error(errorMessage);
  }
}

export async function getResponseError(response) {
  let message = `Failed to fetch resource ${response.url} (${response.status}): `;
  try {
    const contentType = response.headers.get('Content-Type');
    if (contentType.includes('application/json')) {
      message += await response.text();
    } else {
      message += response.statusText;
    }
  } catch (error) {
    // eslint forbids return in a finally statement, so we just catch here
  }
  return message;
}
