// Generated source (ESM/TS).
// @ts-nocheck — ESM-authored scaffold; proper typing is a later pass.


import * as util from 'node:util';
const TEnc = util.TextEncoder;
const TDec = util.TextDecoder;

const encoder = new TEnc();
const utf8Decoder = new TDec('utf-8');

const K_MAX = 0x7fffffff;

function assertSize(size) {
  if (typeof size !== 'number') {
    throw new TypeError('The "size" argument must be of type number');
  }
  if (!Number.isFinite(size) || size < 0 || size > K_MAX) {
    throw new RangeError('The value of "size" is out of range');
  }
}

class Buffer extends Uint8Array {
  static from(value, encodingOrOffset, length) {
    if (typeof value === 'string') {
      return fromString(value, encodingOrOffset);
    }
    if (value instanceof ArrayBuffer) {
      return fromArrayBuffer(value, encodingOrOffset, length);
    }
    if (ArrayBuffer.isView(value)) {
      return fromArrayBuffer(value.buffer, value.byteOffset, value.byteLength);
    }
    if (Array.isArray(value)) {
      const b = Buffer.alloc(value.length);
      for (let i = 0; i < value.length; i++) b[i] = value[i] & 0xff;
      return b;
    }
    if (value !== null && typeof value === 'object') {
      if (value.type === 'Buffer' && Array.isArray(value.data)) {
        return Buffer.from(value.data);
      }
      if (typeof value.valueOf === 'function' &&
          value.valueOf() !== value) {
        return Buffer.from(value.valueOf(), encodingOrOffset, length);
      }
    }
    throw new TypeError('The "value" argument must be of type string or an ' +
      'instance of Buffer, ArrayBuffer, or Array or an Array-like Object.');
  }

  static alloc(size, fill, encoding) {
    assertSize(size);
    const b = createBuffer(size);
    if (fill !== undefined && fill !== 0) {
      b.fill(fill, 0, size, encoding);
    }
    return b;
  }

  static allocUnsafe(size) {
    assertSize(size);
    return createBuffer(size);
  }

  static allocUnsafeSlow(size) {
    return Buffer.allocUnsafe(size);
  }

  static byteLength(string, encoding) {
    if (typeof string !== 'string') {
      if (ArrayBuffer.isView(string) || string instanceof ArrayBuffer) {
        return string.byteLength;
      }
      throw new TypeError('The "string" argument must be a string, Buffer, ' +
        'or ArrayBuffer');
    }
    switch (normalizeEncoding(encoding)) {
      case 'utf8': case 'utf-8': return encoder.encode(string).length;
      case 'utf16le': case 'ucs2': case 'ucs-2': return string.length * 2;
      case 'latin1': case 'binary': case 'ascii': return string.length;
      case 'hex': return string.length >>> 1;
      case 'base64': case 'base64url':
        return (string.replace(/[^A-Za-z0-9+/=_-]/g, '').length * 3) >>> 2;
      default: return encoder.encode(string).length;
    }
  }

  static isBuffer(obj) { return obj instanceof Buffer; }

  static isEncoding(encoding) {
    try {
      normalizeEncoding(encoding);
      return true;
    } catch (e) {
      return false;
    }
  }

  static concat(list, totalLength) {
    if (!Array.isArray(list)) {
      throw new TypeError('The "list" argument must be an Array of Buffers');
    }
    if (list.length === 0) return Buffer.alloc(0);
    let len = totalLength;
    if (len === undefined) {
      len = 0;
      for (const b of list) len += b.length;
    }
    const out = Buffer.alloc(len);
    let offset = 0;
    for (const b of list) {
      if (!Buffer.isBuffer(b)) {
        throw new TypeError('The "list" argument must be an Array of Buffers');
      }
      out.set(b, offset);
      offset += b.length;
      if (offset >= len) break;
    }
    return out;
  }

  static compare(a, b) {
    if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) {
      throw new TypeError('Arguments must be Buffer or Uint8Array');
    }
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
    }
    return a.length === b.length ? 0 : (a.length < b.length ? -1 : 1);
  }

  static equals(a, b) {
    if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) {
      throw new TypeError('Arguments must be Buffer or Uint8Array');
    }
    return a.length === b.length && Buffer.compare(a, b) === 0;
  }

  compare(target, start, end, thisStart, thisEnd) {
    return Buffer.compare(this.subarray(thisStart, thisEnd),
                          target.subarray(start, end));
  }

  equals(other) { return Buffer.equals(this, other); }

  toString(encoding, start, end) {
    start = start === undefined ? 0 : start;
    end = end === undefined ? this.length : end;
    if (start >= this.length) return '';
    if (end > this.length) end = this.length;
    const slice = this.subarray(start, end);
    switch (normalizeEncoding(encoding)) {
      case 'utf8': case 'utf-8': return utf8Decoder.decode(slice);
      case 'latin1': case 'binary': case 'ascii':
        return latin1ToString(slice);
      case 'utf16le': case 'ucs2': case 'ucs-2':
        return utf16ToString(slice);
      case 'hex': return bytesToHex(slice);
      case 'base64': return bytesToBase64(slice, false);
      case 'base64url': return bytesToBase64(slice, true);
      default: return utf8Decoder.decode(slice);
    }
  }

  toJSON() {
    return { type: 'Buffer', data: Array.prototype.slice.call(this) };
  }

  write(string, offset, length, encoding) {
    if (offset === undefined) { offset = 0; length = this.length; encoding = 'utf8'; }
    else if (length === undefined && typeof offset === 'string') {
      encoding = offset; offset = 0; length = this.length;
    } else if (typeof length === 'string') {
      encoding = length; length = this.length - offset;
    }
    offset = offset >>> 0;
    const bytes = encodeString(string, encoding);
    const n = Math.min(bytes.length, length, this.length - offset);
    this.set(bytes.subarray(0, n), offset);
    return n;
  }

  slice(start, end) {
    const sub = this.subarray(start, end);
    const b = createBuffer(sub.length);
    b.set(sub);
    return b;
  }

  fill(value, offset, end, encoding) {
    offset = offset === undefined ? 0 : offset;
    end = end === undefined ? this.length : end;
    if (typeof value === 'string') {
      if (encoding !== undefined) {
        value = encodeString(value, encoding);
      } else if (value.length === 1) {
        value = value.charCodeAt(0);
      } else {
        value = encodeString(value, 'utf8');
      }
    }
    if (typeof value === 'number') {
      const v = value & 0xff;
      for (let i = offset; i < end; i++) this[i] = v;
    } else if (ArrayBuffer.isView(value)) {
      if (value.length === 0) throw new TypeError('value must not be empty');
      for (let i = offset; i < end; i++) this[i] = value[i % value.length];
    }
    return this;
  }

  copy(target, targetStart, sourceStart, sourceEnd) {
    targetStart = targetStart === undefined ? 0 : targetStart;
    sourceStart = sourceStart === undefined ? 0 : sourceStart;
    sourceEnd = sourceEnd === undefined ? this.length : sourceEnd;
    target.set(this.subarray(sourceStart, sourceEnd), targetStart);
    return Math.min(sourceEnd - sourceStart, this.length - sourceStart);
  }

  indexOf(value, byteOffset, encoding) {
    return indexOf(this, value, byteOffset === undefined ? 0 : byteOffset, encoding, true);
  }
  lastIndexOf(value, byteOffset, encoding) {
    return indexOf(this, value, byteOffset === undefined ? this.length - 1 : byteOffset, encoding, false);
  }
  includes(value, byteOffset, encoding) {
    return this.indexOf(value, byteOffset, encoding) !== -1;
  }

  swap16() {
    for (let i = 0; i + 1 < this.length; i += 2) {
      const t = this[i]; this[i] = this[i + 1]; this[i + 1] = t;
    }
    return this;
  }
  swap32() {
    for (let i = 0; i + 3 < this.length; i += 4) {
      let t = this[i]; this[i] = this[i + 3]; this[i + 3] = t;
      t = this[i + 1]; this[i + 1] = this[i + 2]; this[i + 2] = t;
    }
    return this;
  }
  swap64() {
    for (let i = 0; i + 7 < this.length; i += 8) {
      for (let j = 0; j < 4; j++) {
        const t = this[i + j]; this[i + j] = this[i + 7 - j]; this[i + 7 - j] = t;
      }
    }
    return this;
  }
}

function createBuffer(size) {
  return new Buffer(size);
}

Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
Object.setPrototypeOf(Buffer, Uint8Array);

function normalizeEncoding(enc) {
  if (enc === undefined || enc === null) return 'utf8';
  const e = String(enc).toLowerCase();
  switch (e) {
    case 'utf8': case 'utf-8': return 'utf8';
    case 'utf16le': case 'utf-16le': case 'ucs2': case 'ucs-2': return 'utf16le';
    case 'latin1': case 'binary': return 'latin1';
    case 'ascii': return 'ascii';
    case 'hex': return 'hex';
    case 'base64': return 'base64';
    case 'base64url': return 'base64url';
  }
  throw new TypeError('Unknown encoding: ' + enc);
}

function encodeString(str, enc) {
  switch (normalizeEncoding(enc)) {
    case 'utf8': return encoder.encode(str);
    case 'utf16le': {
      const b = new Uint8Array(str.length * 2);
      for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        b[i * 2] = c & 0xff;
        b[i * 2 + 1] = c >> 8;
      }
      return b;
    }
    case 'latin1': case 'ascii': {
      const b = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) b[i] = str.charCodeAt(i) & 0xff;
      return b;
    }
    case 'hex': return hexToBytes(str);
    case 'base64': return base64ToBytes(str, false);
    case 'base64url': return base64ToBytes(str, true);
  }
}

function fromString(str, enc) {
  const bytes = encodeString(str, enc);
  const b = createBuffer(bytes.length);
  b.set(bytes);
  return b;
}

function fromArrayBuffer(ab, byteOffset, length) {
  byteOffset = byteOffset === undefined ? 0 : byteOffset;
  const len = length === undefined ? ab.byteLength - byteOffset : length;
  const b = createBuffer(len);
  b.set(new Uint8Array(ab, byteOffset, len));
  return b;
}

// ---- encoding helpers ----

const HEX = '0123456789abcdef';
function bytesToHex(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    s += HEX[bytes[i] >> 4] + HEX[bytes[i] & 15];
  }
  return s;
}
function hexToBytes(str) {
  const s = str.toLowerCase().replace(/[^0-9a-f]/g, '');
  const len = s.length >> 1;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(s.substr(i * 2, 2), 16);
  }
  return out;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function bytesToBase64(bytes, urlsafe) {
  const table = urlsafe ? B64URL : B64;
  let s = '';
  for (let i = 0; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    s += table[(n >> 18) & 63] + table[(n >> 12) & 63] +
         table[(n >> 6) & 63] + table[n & 63];
  }
  const rem = bytes.length % 3;
  if (rem === 1) {
    const n = bytes[bytes.length - 1] << 16;
    s += table[(n >> 18) & 63] + table[(n >> 12) & 63] + (urlsafe ? '' : '==');
  } else if (rem === 2) {
    const n = (bytes[bytes.length - 2] << 16) | (bytes[bytes.length - 1] << 8);
    s += table[(n >> 18) & 63] + table[(n >> 12) & 63] +
         table[(n >> 6) & 63] + (urlsafe ? '' : '=');
  }
  return s;
}
function base64ToBytes(str, urlsafe) {
  const table = urlsafe ? B64URL : B64;
  const clean = String(str).replace(/[^A-Za-z0-9+/=_-]/g, '')
    .replace(/=+$/, '');
  const out = [];
  let acc = 0, bits = 0;
  for (let i = 0; i < clean.length; i++) {
    const idx = table.indexOf(clean[i]);
    if (idx === -1) continue;
    acc = (acc << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((acc >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

function latin1ToString(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x2000) {
    s += String.fromCharCode.apply(null,
      Array.prototype.slice.call(bytes, i, i + 0x2000));
  }
  return s;
}
function utf16ToString(bytes) {
  const len = bytes.length >> 1;
  const u16 = new Uint16Array(len);
  for (let i = 0; i < len; i++) {
    u16[i] = bytes[i * 2] | (bytes[i * 2 + 1] << 8);
  }
  return String.fromCharCode.apply(null, u16);
}

function indexOf(buf, val, offset, encoding, dir) {
  let needle;
  if (typeof val === 'string') {
    needle = encodeString(val, encoding || 'utf8');
  } else if (typeof val === 'number') {
    needle = Uint8Array.of(val & 0xff);
  } else if (ArrayBuffer.isView(val)) {
    needle = val;
  } else {
    throw new TypeError('value must be string, number, Buffer, or Uint8Array');
  }
  if (needle.length === 0) return -1;
  const n = needle.length;
  if (dir) {
    for (let i = Math.max(0, offset); i + n <= buf.length; i++) {
      let ok = true;
      for (let j = 0; j < n; j++) {
        if (buf[i + j] !== needle[j]) { ok = false; break; }
      }
      if (ok) return i;
    }
  } else {
    for (let i = Math.min(offset, buf.length - n); i >= 0; i--) {
      let ok = true;
      for (let j = 0; j < n; j++) {
        if (buf[i + j] !== needle[j]) { ok = false; break; }
      }
      if (ok) return i;
    }
  }
  return -1;
}

// ---- numeric read/write via DataView ----

const METHODS = {
  readUInt8: ['getUint8', 1, false],
  readInt8: ['getInt8', 1, false],
  readUInt16LE: ['getUint16', 2, true],
  readUInt16BE: ['getUint16', 2, false],
  readInt16LE: ['getInt16', 2, true],
  readInt16BE: ['getInt16', 2, false],
  readUInt32LE: ['getUint32', 4, true],
  readUInt32BE: ['getUint32', 4, false],
  readInt32LE: ['getInt32', 4, true],
  readInt32BE: ['getInt32', 4, false],
  readFloatLE: ['getFloat32', 4, true],
  readFloatBE: ['getFloat32', 4, false],
  readDoubleLE: ['getFloat64', 8, true],
  readDoubleBE: ['getFloat64', 8, false],
  readBigUInt64LE: ['getBigUint64', 8, true],
  readBigUInt64BE: ['getBigUint64', 8, false],
  readBigInt64LE: ['getBigInt64', 8, true],
  readBigInt64BE: ['getBigInt64', 8, false],
  writeUInt8: ['setUint8', 1, false],
  writeInt8: ['setInt8', 1, false],
  writeUInt16LE: ['setUint16', 2, true],
  writeUInt16BE: ['setUint16', 2, false],
  writeInt16LE: ['setInt16', 2, true],
  writeInt16BE: ['setInt16', 2, false],
  writeUInt32LE: ['setUint32', 4, true],
  writeUInt32BE: ['setUint32', 4, false],
  writeInt32LE: ['setInt32', 4, true],
  writeInt32BE: ['setInt32', 4, false],
  writeFloatLE: ['setFloat32', 4, true],
  writeFloatBE: ['setFloat32', 4, false],
  writeDoubleLE: ['setFloat64', 8, true],
  writeDoubleBE: ['setFloat64', 8, false],
  writeBigUInt64LE: ['setBigUint64', 8, true],
  writeBigUInt64BE: ['setBigUint64', 8, false],
  writeBigInt64LE: ['setBigInt64', 8, true],
  writeBigInt64BE: ['setBigInt64', 8, false],
};

function checkOffset(buf, offset, size) {
  offset = offset === undefined ? 0 : offset;
  if (offset < 0 || offset + size > buf.length) {
    throw new RangeError('The value of "offset" is out of range');
  }
  return offset;
}

for (const [name, [method, size, le]] of Object.entries(METHODS)) {
  Buffer.prototype[name] = name.startsWith('read')
    ? function (offset) {
        offset = checkOffset(this, offset, size);
        const dv = new DataView(this.buffer, this.byteOffset + offset, size);
        return dv[method](0, le);
      }
    : function (value, offset) {
        offset = checkOffset(this, offset, size);
        const dv = new DataView(this.buffer, this.byteOffset + offset, size);
        dv[method](0, value, le);
        return offset + size;
      };
}

// Node also aliases UInt* names without the 'read'/'write' prefix? No — it
// does have readUint* aliases.
const ALIASES = {
  readUint8: 'readUInt8', readUint16LE: 'readUInt16LE',
  readUint16BE: 'readUInt16BE', readUint32LE: 'readUInt32LE',
  readUint32BE: 'readUInt32BE', readBigUint64LE: 'readBigUInt64LE',
  readBigUint64BE: 'readBigUInt64BE',
  writeUint8: 'writeUInt8', writeUint16LE: 'writeUInt16LE',
  writeUint16BE: 'writeUInt16BE', writeUint32LE: 'writeUInt32LE',
  writeUint32BE: 'writeUInt32BE', writeBigUint64LE: 'writeBigUInt64LE',
  writeBigUint64BE: 'writeBigUInt64BE',
};
for (const [alias, orig] of Object.entries(ALIASES)) {
  Buffer.prototype[alias] = Buffer.prototype[orig];
}

Buffer.poolSize = 8192;
Buffer.INSPECT_MAX_BYTES = 50;
Buffer.kMaxLength = K_MAX;
Buffer.kStringMaxLength = 0x1fffffe8;
Buffer.constants = { MAX_LENGTH: K_MAX, MAX_STRING_LENGTH: 0x1fffffe8 };

const _B: any = Buffer;
_B.Buffer = Buffer;
_B.SlowBuffer = function SlowBuffer(size) {
  return Buffer.alloc(+size || 0);
};
_B.kMaxLength = K_MAX;
_B.kStringMaxLength = 0x1fffffe8;
_B.INSPECT_MAX_BYTES = 50;
_B.constants = Buffer.constants;
_B.atob = function atob(data) {
  return base64ToBytes(String(data), false).reduce(
    (s, b) => s + String.fromCharCode(b), '');
};
_B.btoa = function btoa(data) {
  const bytes = typeof data === 'string'
    ? encodeString(data, 'latin1') : new Uint8Array(data);
  return bytesToBase64(bytes, false);
};
_B.isAscii = function isAscii(input) {
  for (let i = 0; i < input.length; i++) {
    if ((input instanceof Uint8Array ? input[i] : input.charCodeAt(i)) > 0x7f) {
      return false;
    }
  }
  return true;
};
_B.isUtf8 = function isUtf8(input) {
  const bytes = input instanceof Uint8Array ? input : encoder.encode(input);
  try {
    new TDec('utf-8', { fatal: true }).decode(bytes);
    return true;
  } catch (e) {
    return false;
  }
};
_B.transcode = function transcode(source, fromEnc, toEnc) {
  const str = Buffer.from(source).toString(fromEnc === 'binary' ? 'latin1' : fromEnc);
  return Buffer.from(str, toEnc === 'binary' ? 'latin1' : toEnc);
};
_B.resolveObjectURL = function resolveObjectURL() {
  return undefined;
};
_B.Blob = typeof Blob !== 'undefined' ? Blob : undefined;
_B.File = undefined;

export = Buffer;
