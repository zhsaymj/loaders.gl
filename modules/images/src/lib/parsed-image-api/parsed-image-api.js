/* global document, Image, ImageBitmap, OffscreenCanvas */
import {isWorker} from '../utils/globals';

export function isImage(image) {
  return Boolean(getImageTypeOrNull(image));
}

export function deleteImage(image) {
  switch (getImageType(image)) {
    case 'imagebitmap':
      image.close();
      break;
    default:
    // Nothing to do for images and image data objects
  }
}

export function getImageType(image) {
  const format = getImageTypeOrNull(image);
  if (!format) {
    throw new Error('Not an image');
  }
  return format;
}

let canvas;
let context2d;

export function getImageData(image) {
  switch (getImageType(image)) {
    case 'image':
    case 'imagebitmap':
    case 'html':
      if (isWorker) {
        // TODO - can we reuse and resize instead of creating new canvas for each image?
        canvas = new OffscreenCanvas(image.width, image.height);
        // TODO potentially more efficient, but seems to block 2D context creation?
        // const bmContext = canvas.getContext('bitmaprenderer');
        // bmContext.transferFromImageBitmap(image);
      } else {
        canvas = canvas || document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
      }
      context2d = context2d || canvas.getContext('2d');
      context2d.drawImage(image, 0, 0);
      const imageData = context2d.getImageData(0, 0, image.width, image.height);
      if (isWorker) {
        imageData.extractedOnWorker = true; // For testing
      }
      return imageData;

    case 'data':
    default:
      return image;
  }
}

// TODO DEPRECATED - getImageSize is no longer needed (just use getImageData)
export {getImageData as getImageSize};

// PRIVATE

// eslint-disable-next-line complexity
function getImageTypeOrNull(image) {
  if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
    return 'imagebitmap';
  }
  if (typeof Image !== 'undefined' && image instanceof Image) {
    return 'image';
  }
  if (image && typeof image === 'object' && image.data && image.width && image.height) {
    return 'data';
  }
  return null;
}
