import GL from '@luma.gl/constants';
import {Vector3, Matrix4} from 'math.gl';
import {Ellipsoid} from '@math.gl/geospatial';

const TYPE_ARRAY_MAP = {
  UInt8: Uint8Array,
  UInt32: Uint32Array,
  Float32: Float32Array,
  UInt64: Float64Array
};

const GL_TYPE_MAP = {
  UInt8: GL.UNSIGNED_BYTE,
  UInt32: GL.UNSIGNED_INT,
  Float32: GL.FLOAT,
  UInt64: GL.FLOAT64
};

const I3S_NAMED_VERTEX_ATTRIBUTES = {
  position: 'position',
  normal: 'normal',
  uv0: 'uv0',
  color: 'color',
  region: 'region'
};

const I3S_NAMED_GEOMETREY_ATTRIBUTES = {
  vertexAttributes: 'vertexAttributes',
  featureAttributeOrder: 'featureAttributeOrder',
  featureAttributes: 'featureAttributes'
};

const I3S_NAMED_HEADER_ATTRIBUTES = {
  header: 'header',
  vertexCount: 'vertexCount',
  featureCount: 'featureCount'
};

const SIZEOF = {
  UInt8 : 1,
  UInt32: 4,
  Float32: 4,
  UInt64: 8
};

const scratchVector = new Vector3([0, 0, 0]);

const useFeatureDataLessTraversal = true;

function constructFeatureDataStruct(tile){
  if (!tile || !tile._tileset.defaultGeometrySchema)
  return {};
  //seed featureData from defaultGeometrySchema
  const defaultGeometrySchema = tile._tileset.defaultGeometrySchema;
  let featureData = defaultGeometrySchema;
  //populate the vertex attributes value types and values per element
  for (const geometryAttribute in I3S_NAMED_GEOMETREY_ATTRIBUTES)
  {
    for (const namedAttribute in I3S_NAMED_VERTEX_ATTRIBUTES)
    {
      //const geomAttribute = defaultGeometrySchema[geometryAttribute];
      const attribute =  defaultGeometrySchema[geometryAttribute][namedAttribute];
      if (attribute){
        const { byteOffset = 0, count = 0, valueType, valuesPerElement } = defaultGeometrySchema[geometryAttribute][namedAttribute];
        featureData[geometryAttribute][namedAttribute] = {
        valueType: valueType,
        valuesPerElement: valuesPerElement,
        byteOffset: 0,
        count:0
      };
    }
  }
}
return featureData;
}

function populateFeatureDataParams(arrayBuffer, tile = {}) {
  if (!tile._content) {
    return {};
  }

  const content = tile._content;
  const mbs = tile._mbs;
  content.featureData = constructFeatureDataStruct(tile);
  //const { featureData } = content.featureData;
  content.attributes = {};

  const buffer = arrayBuffer;
  //construct and populate vertexAttributes

  const vertexAttributes = content.featureData.vertexAttributes;

  let minHeight = Infinity;
  const enuMatrix = new Matrix4();

  //First 8 bytes reserved for header (vertexCount and featurecount)
  let vertexCount = 0;
  let featureCount = 0;
  let currentAttributeOffset = 0;
  const headers = content.featureData[I3S_NAMED_HEADER_ATTRIBUTES.header];
  for (const header in headers) {
    var { property, type } =  headers[header];
    const TypedArrayTypeHeader = TYPE_ARRAY_MAP[type];
    if (property === I3S_NAMED_HEADER_ATTRIBUTES.vertexCount){
      vertexCount = new TypedArrayTypeHeader(buffer, 0, 4)[0];
      currentAttributeOffset += SIZEOF[type];
    }
    if (property === I3S_NAMED_HEADER_ATTRIBUTES.featureCount)
    {
      featureCount  = new TypedArrayTypeHeader(buffer, 4, 4)[0];
      currentAttributeOffset += SIZEOF[type];
    }
  }
  for (const attribute in vertexAttributes) {
    var {valueType, valuesPerElement, byteOffset, count } = vertexAttributes[attribute];
    //update count and byteOffset count by calculating from the from defaultGeometrySchema + binnary content
    count = vertexCount;
    const TypedArrayType = TYPE_ARRAY_MAP[valueType];
    byteOffset = currentAttributeOffset; //vertices byteOffset start at 8 (first 8 bytes reserved for header (vertexCount and featurecount)
    //protect  arrayBuffer read overunns!! avoid reading region info from the arraybuffer assuming node has regions always.
    //In i3s 1.6: client requied to find out if node has regions using ./shared resource.
    //In i3s 1.7 this info has been rolled into the 3d scene layer json/node pages
    if (byteOffset + count * valuesPerElement > arrayBuffer.byteLength) {
      continue;
    }
    let value = new TypedArrayType(buffer, byteOffset, count * valuesPerElement);

    if (attribute === 'position') {
      minHeight = value
        .filter((coordinate, index) => (index + 1) % 3 === 0)
        .reduce((accumulator, currentValue) => Math.min(accumulator, currentValue), Infinity);

      content.vertexCount = count;
      content.cartographicOrigin = new Vector3(mbs[0], mbs[1], -minHeight);
      content.cartesianOrigin = new Vector3();
      Ellipsoid.WGS84.cartographicToCartesian(content.cartographicOrigin, content.cartesianOrigin);
      Ellipsoid.WGS84.eastNorthUpToFixedFrame(content.cartesianOrigin, enuMatrix);
      // cartesian
      value = offsetsToCartesians(value, content.cartographicOrigin);
      tile._mbs[2] = -minHeight;
    }

    if (attribute === 'uv0') {
      flipY(value);
    }

    if (attribute === 'color') {
      //content.attributes[attribute].normalized = true;
    }

    if (attribute === 'normal') {
      //do nothing for now...
    }

    if (attribute === 'region') {
      first4Regions = value;
    }


    content.attributes[attribute] = {
      value,
      type: GL_TYPE_MAP[valueType],
      size: valuesPerElement
    };
    currentAttributeOffset = currentAttributeOffset + count * valuesPerElement * SIZEOF[valueType];
  }

//
  const matrix = new Matrix4(1, 0, 0, 0, 1, 0, 0, 0, 1).multiplyRight(enuMatrix);
  content.matrix = matrix.invert();

  content.byteLength = arrayBuffer.byteLength;
  return tile;
}

/* eslint-disable max-statements */
export function parseI3SNodeGeometry(arrayBuffer, tile = {}) {
  if (!tile._content) {
    return tile;
  }

  const content = tile._content;
  const mbs = tile._mbs;

  if (useFeatureDataLessTraversal){
   populateFeatureDataParams(arrayBuffer, tile);
   return tile;
  }

  const {featureData} = content;
  content.attributes = {};

  const buffer = arrayBuffer;
  const geometryData = featureData.geometryData[0];
  const {
    params: {vertexAttributes}
  } = featureData.geometryData[0];

  let minHeight = Infinity;
  const enuMatrix = new Matrix4();

  for (const attribute in vertexAttributes) {
    const { byteOffset, count, valueType, valuesPerElement } = vertexAttributes[attribute];
    const TypedArrayType = TYPE_ARRAY_MAP[valueType];
    //protect  arrayBuffer read overunns!! avoid reading region info from the arraybuffer assuming node has regions always.
    //In i3s 1.6: client requied to find out if node has regions using ./shared resource.
    //In i3s 1.7 this info has been rolled into the 3d scene layer json/node pages
    if (byteOffset + count * valuesPerElement > arrayBuffer.byteLength) {
      continue;
    }
    let value = new TypedArrayType(buffer, byteOffset, count * valuesPerElement);

    if (attribute === 'position') {
      minHeight = value
        .filter((coordinate, index) => (index + 1) % 3 === 0)
        .reduce((accumulator, currentValue) => Math.min(accumulator, currentValue), Infinity);

      content.vertexCount = count / 3;
      content.cartographicOrigin = new Vector3(mbs[0], mbs[1], mbs[2]);//-minHeight);
      content.cartesianOrigin = new Vector3();
      Ellipsoid.WGS84.cartographicToCartesian(content.cartographicOrigin, content.cartesianOrigin);
      Ellipsoid.WGS84.eastNorthUpToFixedFrame(content.cartesianOrigin, enuMatrix);
      // cartesian
      value = offsetsToCartesians(value, content.cartographicOrigin);
    }

    if (attribute === 'uv0') {
      flipY(value);
    }

    content.attributes[attribute] = {
      value,
      type: GL_TYPE_MAP[valueType],
      size: valuesPerElement
    };

    if (attribute === 'color') {
      content.attributes[attribute].normalized = true;
    }
    if (attribute === 'region') {
      var val = value;
    }

    if (attribute === 'normal') {
        var val2 = value;
    }
  }

  const matrix = new Matrix4(geometryData.transformation).multiplyRight(enuMatrix);
  content.matrix = matrix.invert();

  content.byteLength = arrayBuffer.byteLength;
  return tile;
}
/* eslint-enable max-statements */

function flipY(texCoords) {
  for (let i = 0; i < texCoords.length; i += 2) {
    texCoords[i + 1] = 1 - texCoords[i + 1];
  }
}

function offsetsToCartesians(vertices, cartographicOrigin) {
  const positions = new Float64Array(vertices.length);
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = vertices[i] + cartographicOrigin.x;
    positions[i + 1] = vertices[i + 1] + cartographicOrigin.y;
    positions[i + 2] = vertices[i + 2] + cartographicOrigin.z;
  }

  for (let i = 0; i < positions.length; i += 3) {
    Ellipsoid.WGS84.cartographicToCartesian(positions.subarray(i, i + 3), scratchVector);
    positions[i] = scratchVector.x;
    positions[i + 1] = scratchVector.y;
    positions[i + 2] = scratchVector.z;
  }

  return positions;
}
