/* global Response */
import {isFileReadable, isReadableStream} from '../../javascript-utils/is-type';

/**
 *
 * @param {*} resource
 * @todo - check if response constructor sets these fields automatically
 */
export function makeResponse(resource) {
  // Types that can be "wrapped" in Response objects with additional header information
  if (typeof resource === 'string') {
    return new Response(resource, {
      headers: {'Content-Length': `${resource.length}`}
    });
  }
  if (resource instanceof ArrayBuffer) {
    return new Response(resource, {
      headers: {'Content-Length': `${resource.byteLength}`}
    });
  }
  if (ArrayBuffer.isView(resource)) {
    return new Response(resource, {
      headers: {'Content-Length': `${resource.byteLength}`}
    });
  }
  if (isFileReadable(resource)) {
    const headers = {'Content-Length': `${resource.size}`};
    // auto-detect 'Content-Type': fileOrBlob.type
    if (resource.type) {
      headers['Content-Type'] = resource.type;
    }
    return new Response(resource, {headers});
  }

  // Types where no further information can be supplied
  if (isReadableStream(resource)) {
    return new Response(resource);
  }

  // Unknown type (e.g. FormData) - attempt to create a Response
  return new Response(resource);
}

export async function checkResponse(response) {
  if (!response.ok) {
    let errorMessage = `fetch failed ${response.status} `;
    try {
      const text = await response.text();
      errorMessage += text;
    } catch (error) {
      // ignore error
    }
    throw new Error(errorMessage);
  }
}

export async function getErrorMessageFromResponse(response) {
  let message = `Failed to fetch resource ${response.url} (${response.status}): `;
  try {
    const contentType = response.headers.get('Content-Type');
    if (contentType.includes('application/json')) {
      message += await response.text();
    } else {
      message += response.statusText;
    }
  } catch (error) {
    // eslint forbids return in finally statement
    return message;
  }
  return message;
}
