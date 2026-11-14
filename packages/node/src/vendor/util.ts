// Generated source (ESM/TS).
// @ts-nocheck — ESM-authored scaffold; proper typing is a later pass.


import process from 'process/browser.js';

const exportsObj: any = {};

// ---------- inspect ----------

const kMaxLength = 100;
const kIndent = 2;

function formatPrimitive(value) {
  const t = typeof value;
  if (t === 'string') return "'" + value + "'";
  if (t === 'number' || t === 'boolean' || t === 'bigint') return String(value);
  if (t === 'symbol') return String(value);
  if (t === 'function') {
    return '[Function' + (value.name ? ': ' + value.name : ' (anonymous)') + ']';
  }
  if (value === null) return 'null';
  if (t === 'undefined') return 'undefined';
  return undefined;
}

function inspectValue(value, seen, depth) {
  const prim = formatPrimitive(value);
  if (prim !== undefined) return prim;

  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  let out;
  if (value instanceof Date) {
    out = isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
  } else if (value instanceof RegExp) {
    out = String(value);
  } else if (value instanceof Error) {
    out = (value.stack ? String(value.stack).split('\n')[0]
                     : value.name + ': ' + value.message);
  } else if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    const name = value.constructor.name;
    const items = Array.prototype.slice.call(value, 0, kMaxLength)
      .map((v) => String(v)).join(', ');
    out = name + '(' + value.length + ') [' + items +
      (value.length > kMaxLength ? ', ...' : '') + ']';
  } else if (value instanceof ArrayBuffer) {
    out = 'ArrayBuffer { byteLength: ' + value.byteLength + ' }';
  } else if (value instanceof Map) {
    const parts = [];
    for (const [k, v] of value) {
      parts.push(inspectValue(k, seen, depth + 1) + ' => ' +
                 inspectValue(v, seen, depth + 1));
      if (parts.length >= kMaxLength) { parts.push('...'); break; }
    }
    out = 'Map(' + value.size + ') { ' + parts.join(', ') + ' }';
  } else if (value instanceof Set) {
    const parts = [];
    for (const v of value) {
      parts.push(inspectValue(v, seen, depth + 1));
      if (parts.length >= kMaxLength) { parts.push('...'); break; }
    }
    out = 'Set(' + value.size + ') { ' + parts.join(', ') + ' }';
  } else if (value instanceof Promise) {
    out = 'Promise { <pending> }';
  } else if (Array.isArray(value)) {
    const parts = value.slice(0, kMaxLength)
      .map((v) => inspectValue(v, seen, depth + 1));
    if (value.length > kMaxLength) parts.push('... ' + (value.length - kMaxLength) + ' more items');
    out = '[ ' + parts.join(', ') + ' ]';
  } else {
    const keys = Object.keys(value);
    const shown = keys.slice(0, kMaxLength);
    const parts = shown.map((k) => {
      let v;
      try { v = value[k]; } catch (e) { v = '<error>'; }
      return k + ': ' + inspectValue(v, seen, depth + 1);
    });
    if (keys.length > kMaxLength) parts.push('... ' + (keys.length - kMaxLength) + ' more properties');
    if (parts.length === 0) {
      out = '{}';
    } else {
      out = '{ ' + parts.join(', ') + ' }';
    }
  }

  seen.delete(value);
  return out;
}

function inspect(value, options) {
  return inspectValue(value, new Set(), 0);
}
exportsObj.inspect = inspect;
inspect.custom = Symbol.for('nodejs.util.inspect.custom');
inspect.defaultOptions = {
  showHidden: false, depth: 2, colors: false, customInspect: true,
  showProxy: false, maxArrayLength: 100, maxStringLength: 10000,
  breakLength: 80, compact: 3, sorted: false, getters: false,
};

// ---------- format ----------

function format(f) {
  const args = Array.prototype.slice.call(arguments, 1);
  if (typeof f !== 'string') {
    return [inspect(f)].concat(args.map(inspect)).join(' ');
  }
  let i = 0;
  const str = f.replace(/%([sdifjoOc%])/g, (match, code) => {
    if (code === '%') return '%';
    if (i >= args.length) return match;
    const arg = args[i++];
    switch (code) {
      case 's': return String(arg);
      case 'd': return Number(arg).toString();
      case 'i': return parseInt(arg, 10).toString();
      case 'f': return parseFloat(arg).toString();
      case 'j':
        try { return JSON.stringify(arg); } catch (e) { return '[Circular]'; }
      case 'o': case 'O': case 'c': return inspect(arg);
    }
    return match;
  });
  const rest = args.slice(i).map(inspect);
  return rest.length > 0 ? str + ' ' + rest.join(' ') : str;
}
exportsObj.format = format;
exportsObj.formatWithOptions = function formatWithOptions(inspectOptions, f) {
  return format.apply(null, Array.prototype.slice.call(arguments, 1));
};

// ---------- inherits ----------

function inherits(ctor, superCtor) {
  if (typeof ctor !== 'function' || typeof superCtor !== 'function') {
    throw new TypeError('The "ctor" and "superCtor" arguments must be functions');
  }
  ctor.super_ = superCtor;
  Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
}
exportsObj.inherits = inherits;

// ---------- deep strict equal ----------

function isDeepStrictEqual(a, b, seen) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }

  if (seen.has(a) && seen.get(a) === b) return true;
  seen.set(a, b);

  const aIsArr = Array.isArray(a);
  const bIsArr = Array.isArray(b);
  if (aIsArr !== bIsArr) return false;

  if (aIsArr) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepStrictEqual(a[i], b[i], seen)) return false;
    }
    return true;
  }

  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (a instanceof RegExp || b instanceof RegExp) {
    return a instanceof RegExp && b instanceof RegExp &&
      a.source === b.source && a.flags === b.flags;
  }
  if (ArrayBuffer.isView(a) || ArrayBuffer.isView(b)) {
    if (!ArrayBuffer.isView(a) || !ArrayBuffer.isView(b) ||
        a.constructor !== b.constructor || a.length !== b.length) {
      return false;
    }
    if (a instanceof DataView) return false;
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) return false;
    }
    return true;
  }
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map) || !(b instanceof Map) || a.size !== b.size) {
      return false;
    }
    for (const [k, v] of a) {
      if (!b.has(k) || !isDeepStrictEqual(v, b.get(k), seen)) return false;
    }
    return true;
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set) || !(b instanceof Set) || a.size !== b.size) {
      return false;
    }
    for (const v of a) {
      if (!b.has(v)) return false;
    }
    return true;
  }

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!isDeepStrictEqual(a[k], b[k], seen)) return false;
  }
  return true;
}
exportsObj.isDeepStrictEqual = function isDeepEqual(a, b) {
  return isDeepStrictEqual(a, b, new Map());
};

// ---------- types ----------

const types = {
  isDate: (v) => v instanceof Date,
  isRegExp: (v) => v instanceof RegExp,
  isPromise: (v) => v instanceof Promise ||
    (v !== null && typeof v === 'object' && typeof v.then === 'function' &&
     typeof v.catch === 'function'),
  isNativeError: (v) => v instanceof Error,
  isError: (v) => v instanceof Error,
  isMap: (v) => v instanceof Map,
  isSet: (v) => v instanceof Set,
  isWeakMap: (v) => v instanceof WeakMap,
  isWeakSet: (v) => v instanceof WeakSet,
  isMapIterator: (v) => v !== null && typeof v === 'object' &&
    typeof v.next === 'function' && v.toString() === '[object Map Iterator]',
  isSetIterator: (v) => v !== null && typeof v === 'object' &&
    typeof v.next === 'function' && v.toString() === '[object Set Iterator]',
  isArrayBuffer: (v) => v instanceof ArrayBuffer,
  isDataView: (v) => v instanceof DataView,
  isTypedArray: (v) => ArrayBuffer.isView(v) && !(v instanceof DataView),
  isArrayBufferView: (v) => ArrayBuffer.isView(v),
  isUint8Array: (v) => v instanceof Uint8Array,
  isInt8Array: (v) => v instanceof Int8Array,
  isUint16Array: (v) => v instanceof Uint16Array,
  isInt16Array: (v) => v instanceof Int16Array,
  isUint32Array: (v) => v instanceof Uint32Array,
  isInt32Array: (v) => v instanceof Int32Array,
  isFloat32Array: (v) => v instanceof Float32Array,
  isFloat64Array: (v) => v instanceof Float64Array,
  isBigInt64Array: (v) => typeof BigInt64Array !== 'undefined' && v instanceof BigInt64Array,
  isBigUint64Array: (v) => typeof BigUint64Array !== 'undefined' && v instanceof BigUint64Array,
  isProxy: () => false,
  isExternal: () => false,
  isAsyncFunction: (v) => typeof v === 'function' &&
    v.constructor && v.constructor.name === 'AsyncFunction',
  isGeneratorFunction: (v) => typeof v === 'function' &&
    v.constructor && v.constructor.name === 'GeneratorFunction',
  isArgumentsObject: (v) => v !== null && typeof v === 'object' &&
    typeof v.length === 'number' && typeof v.callee === 'function',
  isSymbolObject: (v) => typeof v === 'object' && v !== null &&
    v.constructor === Symbol,
  isNumberObject: (v) => v instanceof Number,
  isStringObject: (v) => v instanceof String,
  isBooleanObject: (v) => v instanceof Boolean,
  isBigIntObject: (v) => typeof v === 'object' && v !== null &&
    typeof v.valueOf() === 'bigint',
  isBoxedPrimitive: (v) => v instanceof Number || v instanceof String ||
    v instanceof Boolean ||
    (typeof v === 'object' && v !== null && v.constructor === Symbol) ||
    (typeof v === 'object' && v !== null && typeof v.valueOf() === 'bigint'),
  isAnyArrayBuffer: (v) => v instanceof ArrayBuffer,
  isSharedArrayBuffer: (v) => typeof SharedArrayBuffer !== 'undefined' &&
    v instanceof SharedArrayBuffer,
  isWeakRef: (v) => typeof WeakRef !== 'undefined' && v instanceof WeakRef,
};
exportsObj.types = types;

// ---------- promisify / callbackify / deprecate ----------

const kCustomPromisifiedSymbol = Symbol.for('nodejs.util.promisify.custom');

function promisify(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('The "fn" argument must be of type Function');
  }
  if (fn[kCustomPromisifiedSymbol]) return fn[kCustomPromisifiedSymbol];
  const promisified = function promisified() {
    const args = Array.prototype.slice.call(arguments);
    const self = this;
    return new Promise((resolve, reject) => {
      args.push((err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
      try {
        fn.apply(self, args);
      } catch (e) {
        reject(e);
      }
    });
  };
  Object.setPrototypeOf(promisified, Object.getPrototypeOf(fn) || Function.prototype);
  Object.defineProperties(promisified, {
    length: { value: fn.length, writable: true, configurable: true },
    name: { value: fn.name + 'Promisified', configurable: true },
  });
  promisified[kCustomPromisifiedSymbol] = promisified;
  return promisified;
}
promisify.custom = kCustomPromisifiedSymbol;
exportsObj.promisify = promisify;

function callbackify(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('The "fn" argument must be of type Function');
  }
  return function callbackified() {
    const args = Array.prototype.slice.call(arguments);
    const cb = args.pop();
    if (typeof cb !== 'function') {
      throw new TypeError('The last argument must be of type Function');
    }
    const self = this;
    const maybePromise = fn.apply(self, args);
    const nextTick = (typeof process !== 'undefined' && process.nextTick)
      ? process.nextTick.bind(process)
      : (f) => Promise.resolve().then(f);
    Promise.resolve(maybePromise).then(
      (result) => nextTick(() => cb(null, result)),
      (err) => nextTick(() => cb(err)),
    );
  };
}
exportsObj.callbackify = callbackify;

function deprecate(fn, msg, code) {
  if (typeof fn !== 'function') {
    throw new TypeError('The "fn" argument must be of type Function');
  }
  let warned = false;
  const deprecated = function deprecated() {
    if (!warned) {
      warned = true;
      const out = (typeof process !== 'undefined' && process.emitWarning)
        ? (m) => process.emitWarning(m, 'DeprecationWarning', code)
        : (m) => { if (typeof console !== 'undefined' && console.error) console.error(m); };
      out(msg);
    }
    return fn.apply(this, arguments);
  };
  return deprecated;
}
exportsObj.deprecate = deprecate;

// ---------- TextEncoder / TextDecoder (UTF-8) ----------

class JSTextEncoder {
  encode(input) {
    const str = String(input === undefined ? '' : input);
    const out = [];
    for (let i = 0; i < str.length; i++) {
      let cp = str.charCodeAt(i);
      if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < str.length) {
        const lo = str.charCodeAt(i + 1);
        if (lo >= 0xdc00 && lo <= 0xdfff) {
          cp = 0x10000 + ((cp - 0xd800) << 10) + (lo - 0xdc00);
          i++;
        }
      }
      if (cp < 0x80) out.push(cp);
      else if (cp < 0x800) {
        out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
      } else if (cp < 0x10000) {
        out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f),
                 0x80 | (cp & 0x3f));
      } else {
        out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f),
                 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
      }
    }
    return Uint8Array.from(out);
  }
  encodeInto(src, dest) {
    const bytes = this.encode(src);
    const n = Math.min(bytes.length, dest.length);
    dest.set(bytes.subarray(0, n));
    let read = src.length;
    if (n < bytes.length) {
      read = 0;
      let used = 0;
      while (used < n && read < src.length) {
        const w = src.charCodeAt(read) > 0x7f ? (src.charCodeAt(read) > 0x7ff ? (src.charCodeAt(read) >= 0xd800 && src.charCodeAt(read) <= 0xdbff ? 4 : 3) : 2) : 1;
        if (used + w > n) break;
        used += w;
        read += (w === 4 ? 2 : 1);
      }
    }
    return { read, written: n };
  }
  get encoding() { return 'utf-8'; }
}

class JSTextDecoder {
  constructor(encoding, options) {
    this._encoding = 'utf-8';
    this._fatal = Boolean(options && options.fatal);
    this._ignoreBOM = Boolean(options && options.ignoreBOM);
  }
  get encoding() { return this._encoding; }
  get fatal() { return this._fatal; }
  get ignoreBOM() { return this._ignoreBOM; }
  decode(input, options) {
    if (input === undefined) return '';
    const bytes = input instanceof ArrayBuffer
      ? new Uint8Array(input)
      : (ArrayBuffer.isView(input)
          ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
          : new Uint8Array(input));
    let out = '';
    let i = 0;
    if (!this._ignoreBOM && bytes.length >= 3 &&
        bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      i = 3;
    }
    while (i < bytes.length) {
      const b = bytes[i];
      let cp, len;
      if (b < 0x80) { cp = b; len = 1; }
      else if ((b & 0xe0) === 0xc0) { cp = b & 0x1f; len = 2; }
      else if ((b & 0xf0) === 0xe0) { cp = b & 0x0f; len = 3; }
      else if ((b & 0xf8) === 0xf0) { cp = b & 0x07; len = 4; }
      else {
        if (this._fatal) throw new TypeError('The encoded data was not valid for encoding utf-8');
        out += '�';
        i++;
        continue;
      }
      if (i + len > bytes.length) {
        if (options && options.stream) break;
        if (this._fatal) throw new TypeError('The encoded data was not valid for encoding utf-8');
        out += '�';
        i++;
        continue;
      }
      for (let j = 1; j < len; j++) {
        cp = (cp << 6) | (bytes[i + j] & 0x3f);
      }
      if (cp <= 0xffff) {
        out += String.fromCharCode(cp);
      } else {
        cp -= 0x10000;
        out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
      }
      i += len;
    }
    return out;
  }
}

exportsObj.TextEncoder = typeof TextEncoder !== 'undefined'
  ? TextEncoder : JSTextEncoder;
exportsObj.TextDecoder = typeof TextDecoder !== 'undefined'
  ? TextDecoder : JSTextDecoder;

// ---------- misc ----------

exportsObj.debuglog = function debuglog(section) {
  return () => {};
};
exportsObj.log = function log() {
  if (typeof console !== 'undefined' && console.log) {
    console.log.apply(console, arguments);
  }
};
exportsObj.error = function error() {
  if (typeof console !== 'undefined' && console.error) {
    console.error.apply(console, arguments);
  }
};
exportsObj.toUSVString = function toUSVString(str) {
  return String(str).replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, '�');
};
exportsObj.stripVTControlCharacters = function stripVTControlCharacters(str) {
  // eslint-disable-next-line no-control-regex
  return String(str).replace(/[\u001b\u009b][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
};

export default exportsObj;
