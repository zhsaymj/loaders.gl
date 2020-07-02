/* global File */
import test from 'tape-promise/tape';
import {fetchFile, load, isBrowser} from '@loaders.gl/core';
import {geojsonToBinary} from '@loaders.gl/gis';
import {ShapefileLoader} from '@loaders.gl/shapefile';
import {_BrowserFileSystem as BrowserFileSystem} from '@loaders.gl/shapefile';

const SHAPEFILE_JS_DATA_FOLDER = '@loaders.gl/shapefile/test/data/shapefile-js';
const SHAPEFILE_JS_TEST_FILES = {
  'boolean-property': null,
  'date-property': null,
  empty: null,
  'ignore-properties': null,
  'latin1-property': null,
  'mixed-properties': null,
  multipointm: null,
  multipoints: null,
  null: null,
  'number-null-property': null,
  'number-property': null,
  pointm: null,
  points: null,
  polygonm: null,
  polygons: null,
  polylinem: null,
  polylines: null,
  singleton: null,
  'string-property': null,
  'utf8-property': null
};

test('ShapefileLoader#load (from browser File objects)', async t => {
  if (isBrowser) {
    // test `File` load (browser)
    t.comment('...FILE LOAD STARTING. FAILED FETCHES EXPECTED');
    for (const testFileName in SHAPEFILE_JS_TEST_FILES) {
      const fileList = await getFileList(testFileName);
      SHAPEFILE_JS_TEST_FILES[testFileName] = fileList;
    }
    t.comment('...FILE LOAD COMPLETE');

    for (const testFileName in SHAPEFILE_JS_TEST_FILES) {
      const fileList = SHAPEFILE_JS_TEST_FILES[testFileName];
      const fileSystem = new BrowserFileSystem(fileList);
      const {fetch} = fileSystem;
      const filename = `${testFileName}.shp`;
      const data = await load(filename, ShapefileLoader, {fetch});
      t.comment(`${filename}: ${JSON.stringify(data).slice(0, 70)}`);

      testShapefileData(t, testFileName, data);
    }
  }
  t.end();
});

test('ShapefileLoader#load (from files or URLs)', async t => {
  // test file load (node) or URL load (browser)
  for (const testFileName in SHAPEFILE_JS_TEST_FILES) {
    const filename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`;
    const data = await load(filename, ShapefileLoader);
    t.comment(`${filename}: ${JSON.stringify(data).slice(0, 70)}`);

    await testShapefileData(t, testFileName, data);
  }

  t.end();
});

async function getFileList(testFileName) {
  const EXTENSIONS = ['.shp', '.shx', '.dbf', '.cpg', '.prj'];
  const fileList = [];
  for (const extension of EXTENSIONS) {
    const filename = `${testFileName}${extension}`;
    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${filename}`);
    if (response.ok) {
      fileList.push(new File([await response.blob()], filename));
    }
  }
  return fileList;
}

async function testShapefileData(t, testFileName, data) {
  // Exceptions for files that don't currently pass tests
  // TODO @kylebarron to fix
  const EXCEPTIONS = [
    'multipointm',
    'null',
    'pointm',
    'polygons',
    'polygonm',
    'polylines',
    'polylinem'
  ];
  if (EXCEPTIONS.some(exception => testFileName.includes(exception))) {
    return;
  }

  // Compare with parsed json
  const output = data.shapes;

  const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
  const json = await response.json();

  for (let i = 0; i < json.features.length; i++) {
    const expBinary = geojsonToBinary([json.features[i]]).points.positions;
    t.deepEqual(output.features[i].positions, expBinary);
  }
}
