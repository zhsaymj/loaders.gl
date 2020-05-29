/* global Response, TextEncoder */
import {isResponse} from '../../javascript-utils/is-type';
import {getResourceContentLength, getResourceUrlAndType} from './resource-utils';

export function makeResponse(resource) {
  if (isResponse(resource)) {
    return resource;
  }

  // Add content-length header if possible
  /** @type {Record<string, string>} */
  const headers = {};

  const contentLength = getResourceContentLength(resource);
  if (contentLength >= 0) {
    headers['content-length'] = String(contentLength);
  }

  // new Response(File) do not preserve URL or content-type, so we add headers
  const {url, type} = getResourceUrlAndType(resource);
  if (type) {
    headers['content-type'] = type;
  }
  if (url) {
    headers['content-location'] = url;
  }

  if (typeof resource === 'string') {
    // Convert to ArrayBuffer to avoid treating as URL
    resource = new TextEncoder().encode(resource);
  }

  // Attempt to create a Response from the resource, adding headers if appropriate
  return new Response(resource, {headers});
}

export async function checkResponse(response) {
  if (!response.ok) {
    const message = await getResponseError(response);
    throw new Error(message);
  }
}

export function checkResponseSync(response) {
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    message = message.length > 60 ? `${message.slice(60)}...` : message;
    throw new Error(message);
  }
}

async function getResponseError(response) {
  let message = `Failed to fetch resource ${response.url} (${response.status}): `;
  try {
    const contentType = response.headers.get('Content-Type');
    let text = response.statusText;
    if (contentType.includes('application/json')) {
      text += ` ${await response.text()}`;
    }
    message += text;
    message = message.length > 60 ? `${message.slice(60)}...` : message;
  } catch (error) {
    // eslint forbids return in a finally statement, so we just catch here
  }
  return message;
}
