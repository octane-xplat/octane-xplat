// Generated source (ESM/TS).
// @ts-nocheck — ESM-authored scaffold; proper typing is a later pass.


function unescapeBuffer(s) {
  try {
    return decodeURIComponent(s);
  } catch (e) {
    return s;
  }
}

function parse(str, sep, eq, options) {
  const obj = Object.create(null);
  if (typeof str !== 'string' || str.length === 0) return obj;
  sep = sep || '&';
  eq = eq || '=';
  const maxKeys = (options && options.maxKeys) || 1000;
  const parts = str.split(sep);
  let count = 0;
  for (const part of parts) {
    if (part === '') continue;
    if (maxKeys > 0 && count >= maxKeys) break;
    const idx = part.indexOf(eq);
    let k, v;
    if (idx === -1) {
      k = part;
      v = '';
    } else {
      k = part.substring(0, idx);
      v = part.substring(idx + eq.length);
    }
    k = unescapeBuffer(k.replace(/\+/g, ' '));
    v = unescapeBuffer(v.replace(/\+/g, ' '));
    if (obj[k] === undefined) {
      obj[k] = v;
    } else if (Array.isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
    count++;
  }
  return obj;
}

function encodeValue(v) {
  return encodeURIComponent(stringifyPrimitive(v));
}

function stringifyPrimitive(v) {
  switch (typeof v) {
    case 'string': return v;
    case 'number': return isFinite(v) ? '' + v : '';
    case 'boolean': return v ? 'true' : 'false';
  }
  return '';
}

function stringify(obj, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  const nameFn = options && options.encodeURIComponent;
  const enc = nameFn || encodeValue;
  if (obj === null || typeof obj !== 'object') return '';
  const parts = [];
  for (const k of Object.keys(obj)) {
    const ks = enc(k) + eq;
    const v = obj[k];
    if (Array.isArray(v)) {
      for (const item of v) {
        parts.push(ks + enc(item === null || item === undefined
          ? '' : stringifyPrimitive(item)));
      }
    } else {
      parts.push(ks + enc(v === null || v === undefined
        ? '' : stringifyPrimitive(v)));
    }
  }
  return parts.join(sep);
}

const _m = {
  parse: parse,
  decode: parse,
  stringify: stringify,
  encode: stringify,
  escape: encodeURIComponent,
  unescape: unescapeBuffer,
  unescapeBuffer: unescapeBuffer,
};

export default _m;
