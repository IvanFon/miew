
class OneColorGeo { // FIXME do base class
  constructor() {
    this.positions = null;
    this.normals = null;
    this.colors = null;
    this.indices = null;
    this.vertsCount = 0;
    this.itemSize = null;
  }

  init(geo) {
    const {
      attributes: {
        position,
        normal,
        color,
      },
      index,
    } = geo;
    // copy vertices attributes
    this.vertsCount = position.count;
    this.positions = position.array;
    this.normals = normal.array;
    // create color array
    this.colors = new Float32Array(this.vertsCount * color.itemSize);
    // indices
    this.indices = index.array;
    // save item size
    this.itemSize = {
      position: position.itemSize,
      normal: normal.itemSize,
      color: color.itemSize,
    };
  }

  setColors(color) {
    let offset = 0;
    for (let i = 0, l = this.colors.length, cl = this.itemSize.color; i < l; i += cl) {
      this.colors[offset++] = color.r;
      this.colors[offset++] = color.g;
      this.colors[offset++] = color.b;
    }
  }
}

class TwoColoredCylinder {
  constructor() { // FIXME make base class
    this.positions = null;
    this.normals = null;
    this.colors = null;
    this.indices = null;
    this.vertsCount = 0;
    this.itemSize = null;
    this._cutRawStart = 0;
    this._cutRawEnd = 0;
    this._facesPerSlice = 0;
  }

  // we know that cylinder consists of 2 height segments and stored:
  // tube, topCap, bottomCap
  init(geo, info) {
    const {
      attributes: {
        position,
        normal,
        color,
      },
      index,
    } = geo;
    // extend vertices arrays
    this.vertsCount = position.count + info.addPerCylinder;
    this._facesPerSlice = info.addPerCylinder;
    this.positions = new Float32Array(this.vertsCount * position.itemSize);
    this.normals = new Float32Array(this.vertsCount * normal.itemSize);
    this.colors = new Float32Array(this.vertsCount * color.itemSize);
    // save item size
    this.itemSize = {
      position: position.itemSize,
      normal: normal.itemSize,
      color: color.itemSize,
    };
    this._extendVertices(geo, info);
    // number of indices stays the same
    this.indices = new Uint32Array(index.count);
    this._extendIndices(geo, info);
  }

  // FIXME add description
  _extendVertices(geo, info) {
    const { position } = geo.attributes;
    const { normal } = geo.attributes;
    const geoParams = geo.getGeoParams();
    const cutRaw = 1; // we expect cylinders of 2 segments in height => so half segment = 1
    this._cutRawStart = cutRaw * geoParams.radialSegments;
    this._cutRawEnd = this._cutRawStart + info.addPerCylinder;
    { // write first half of cylinder
      let temp1 = position.array.slice(0, this._cutRawEnd * position.itemSize);
      this.positions.set(temp1, 0);
      temp1 = normal.array.slice(0, this._cutRawEnd * normal.itemSize);
      this.normals.set(temp1, 0);
    }
    { // write second part of cylinder
      let temp2 = position.array.slice(this._cutRawStart * position.itemSize, position.array.length);
      this.positions.set(temp2, this._cutRawEnd * position.itemSize);
      temp2 = normal.array.slice(this._cutRawStart * normal.itemSize, normal.array.length);
      this.normals.set(temp2, this._cutRawEnd * normal.itemSize);
    }
  }

  // FIXME add description
  _extendIndices(geo, info) {
    const { index } = geo;
    const indicesPerQuad = 6; // quad = 2 triangles => 6 indices
    const startToShift = info.addPerCylinder * indicesPerQuad;
    const shift = info.addPerCylinder;
    let shifted = index.array.slice(startToShift, index.count);
    shifted = shifted.map((x) => x + shift); // shift only the endings
    this.indices.set(index.array, 0);
    this.indices.set(shifted, startToShift);
  }

  setColors(color1, color2) {
    const colorSize = this.itemSize.color;
    const part1End = this._cutRawEnd * colorSize;
    const part2End = part1End * 2;
    const capSize = (this._facesPerSlice + 1) * colorSize;
    let color = null;
    let offset = 0;
    for (let i = 0, l = this.colors.length; i < l; i += colorSize) {
      if (i < part1End) { // first part
        color = color1;
      } else if (i < part2End + capSize) { // second part + top cap
        color = color2;
      } else { // bottom cap
        color = color1;
      }
      this.colors[offset++] = color.r;
      this.colors[offset++] = color.g;
      this.colors[offset++] = color.b;
    }
  }
}

export default {
  OneColorGeo,
  TwoColoredCylinder,
};
