import {isResponse, isFileReadable} from '../../javascript-utils/is-type';
import {parseMIMEType, parseMIMETypeFromURL} from './mime-type-utils';

const QUERY_STRING_PATTERN = /\?.*/;

export function getResourceUrlAndType(resource, {isURL = true} = {}) {
  // If resource is a response, it contains the information directly
  if (isResponse(resource)) {
    const contentType = parseMIMEType(resource.headers.get('content-type'));
    const urlType = parseMIMETypeFromURL(resource.url);
    return {
      url: resource.url || '',
      type: contentType || urlType || null
    };
  }

  if (isFileReadable(resource)) {
    return {
      url: resource.name || '',
      type: resource.type || ''
    };
  }

  if (typeof resource === 'string' && isURL) {
    return {
      // Remove query strings, if present
      // TODO this doesn't handle data URLs (but it doesn't matter as it is just used for inference)
      url: resource.replace(QUERY_STRING_PATTERN, ''),
      // extract MIME type if a data url
      type: parseMIMETypeFromURL(resource)
    };
  }

  // Unknown
  return {
    url: '',
    type: ''
  };
}

export function getResourceContentLength(resource) {
  if (isResponse(resource)) {
    return resource.headers['content-length'] || -1;
  }
  if (isFileReadable(resource)) {
    return resource.size;
  }
  if (typeof resource === 'string') {
    // TODO - handle data URL?
    return resource.length;
  }
  if (resource instanceof ArrayBuffer) {
    return resource.byteLength;
  }
  if (ArrayBuffer.isView(resource)) {
    return resource.byteLength;
  }
  return -1;
}
