/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
import parseImage from './lib/parsers/parse-image';
import {isPng, isGif, isBmp, isJpeg} from './lib/binary-image-api/binary-image-parsers';
import {isImageTypeSupported} from './lib/parsed-image-api/image-type';
// import {getImageData} from './lib/parsed-image-api/parsed-image-api';

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg'];
const MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/vndmicrosofticon',
  'image/svg+xml'
];

// NOTE: No separate ImageWorkerLoader is provided since worker is not always present

const ImageLoader = {
  id: 'image',
  name: 'Image',
  category: 'image',
  version: VERSION,
  mimeTypes: MIME_TYPES,
  extensions: EXTENSIONS,
  test: testImage,
  parse: parseImage,
  // postProcessOnMainThread: postProcessImageOnMainThread,
  useWorker: options => {
    const opts = options.image;
    return opts && (opts.type === 'imagebitmap' || opts.type === 'data');
  },
  options: {
    image: {
      type: 'auto',
      decode: true, // applies only to images of type: 'image' (Image)
      // workerUrl: isImageTypeSupported('imagebitmap')
      //   ? `https://unpkg.com/@loaders.gl/image@${VERSION}/dist/image-loader.worker.js`
      //   : null,
      workerUrl: isImageTypeSupported('imagebitmap')
        ? `modules/images/dist/image-loader.worker.dev.js`
        : null
    }
    // imagebitmap: {} - passes platform dependent parameters to `createImageBitmap`
  }
};

function testImage(arrayBuffer) {
  // , byteOffset, byteLength);
  const dataView = new DataView(arrayBuffer); // , byteOffset, byteLength);
  return isJpeg(dataView) || isBmp(dataView) || isGif(dataView) || isPng(dataView);
}

// We can decode a compressed image on a worker into an ImageBitmap,
// but we must still extract the image data on the main thread :(
// https://bugzilla.mozilla.org/show_bug.cgi?id=801176
// https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/getContext
// TODO - have not tried new OffScreenCanvas().getContext('2d') in Chrome...
/*
function postProcessImageOnMainThread(image, options) {
  if (options.image && options.image.data) {
    const data = getImageData(image, false);
    // imageBitmap has a close method to dispose of graphical resources
    if (image.close) {
      image.close();
    }
    return data;
  }
  return image;
}
*/

export default ImageLoader;
