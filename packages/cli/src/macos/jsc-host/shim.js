// Small, explicit host API for the packaged CommonJS entry.
globalThis.console = {
  log: (...args) => __hostLog(...args),
  warn: (...args) => __hostLog(...args),
  error: (...args) => __hostLog(...args.map((value) => value instanceof Error ? value.stack : value)),
};
globalThis.process = new Proxy({
  env: new Proxy({}, { get: (_target, key) => typeof key === 'string' ? __hostEnv(key) : undefined }),
  cwd: () => __hostCwd(),
}, {
  get(target, key) {
    if (key in target) return target[key];
    throw Error(`Unsupported macOS host API: process.${String(key)}`);
  },
});
Object.defineProperty(globalThis, 'Buffer', { configurable: true, value: { from(value, encoding) {
  if (encoding !== 'base64') throw Error(`unsupported Buffer encoding: ${encoding}`);
  return NSData.alloc().initWithBase64EncodedStringOptions(value, 0);
} } });
const fileManager = NSFileManager.defaultManager;
const nodeModules = {
  'node:crypto': { createHash(algorithm) {
    if (algorithm !== 'sha256') throw Error(`unsupported hash: ${algorithm}`);
    let bytes;
    return {
      update(data) { bytes = new Uint8Array(interop.bufferFromData(data)); return this; },
      digest(encoding) {
        if (encoding !== 'hex' || !bytes) throw Error(`unsupported digest: ${encoding}`);
        const output = new Uint8Array(32);
        CC_SHA256(bytes, bytes.length, output);
        return Array.from(output, (value) => value.toString(16).padStart(2, '0')).join('');
      },
    };
  } },
  'node:fs': {
    mkdirSync(path) {
      if (!fileManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(path, true, null, null))
        throw Error(`mkdir failed: ${path}`);
    },
    existsSync(path) { return fileManager.fileExistsAtPath(path); },
    readFileSync(path, encoding) {
      const data = NSData.dataWithContentsOfFile(path);
      if (!data) throw Error(`read failed: ${path}`);
      if (encoding === undefined) return data;
      if (encoding === 'utf8') return String(NSString.alloc().initWithDataEncoding(data, 4));
      throw Error(`Unsupported macOS host API: fs.readFileSync encoding ${encoding}`);
    },
    writeFileSync(path, value) {
      const bytes = typeof value === 'string' ? NSString.stringWithString(value).dataUsingEncoding(4) : value;
      if (!bytes.writeToFileAtomically(path, true)) throw Error(`write failed: ${path}`);
    },
  },
  'node:os': { homedir: () => NSHomeDirectory() },
  'node:path': {
    join: (...parts) => normalizePath(parts.join('/')),
    resolve: (...parts) => {
      let path = '';
      for (const part of [process.cwd(), ...parts])
        path = part.startsWith('/') ? part : `${path}/${part}`;
      return normalizePath(path);
    },
  },
};
function normalizePath(path) {
  const absolute = path.startsWith('/');
  const parts = [];
  for (const part of path.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (parts.length && parts.at(-1) !== '..') parts.pop();
      else if (!absolute) parts.push(part);
    }
    else parts.push(part);
  }
  return `${absolute ? '/' : ''}${parts.join('/')}` || '.';
}
for (const [name, methods] of Object.entries(nodeModules)) {
  nodeModules[name] = new Proxy(methods, {
    get(target, key) {
      if (key in target) return target[key];
      throw Error(`Unsupported macOS host API: ${name}.${String(key)}`);
    },
  });
}
globalThis.require = (name) => {
  if (name === '@nativescript/macos-node-api') return __nativeExports;
  if (Object.hasOwn(globalThis.__xplatDevModules ?? {}, name)) return globalThis.__xplatDevModules[name];
  if (name in nodeModules) return nodeModules[name];
  throw Error(`unsupported require: ${name}`);
};
globalThis.setTimeout = __setTimeout;
globalThis.clearTimeout = __clearTimer;
globalThis.setInterval = __setInterval;
globalThis.clearInterval = __clearTimer;
globalThis.queueMicrotask = (callback) => Promise.resolve().then(callback);
globalThis.performance = { now: () => __hostNow() };
