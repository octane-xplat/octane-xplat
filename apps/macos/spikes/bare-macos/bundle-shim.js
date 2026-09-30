// Temporary CJS environment for measuring the actual bundle's host needs.
globalThis.console = {
  log: (...args) => __hostLog(...args),
  warn: (...args) => __hostLog(...args),
  error: (...args) => __hostLog(...args.map((value) => value instanceof Error ? value.stack : value)),
};

globalThis.process = { env: { NODE_ENV: 'production', OCTANE_MACOS_AUTOMATION: '1', OCTANE_MACOS_EXTERNAL_RUNLOOP: '1' } };
Object.defineProperty(globalThis, 'Buffer', { configurable: true, value: { from(value, encoding) {
  if (encoding !== 'base64') {throw Error(`unsupported Buffer encoding: ${encoding}`);}
  return NSData.alloc().initWithBase64EncodedStringOptions(value, 0);
} } });

const fileManager = NSFileManager.defaultManager;
const nodeModules = {
  'node:crypto': { createHash(algorithm) {
    if (algorithm !== 'sha256') {throw Error(`unsupported hash: ${algorithm}`);}
    let bytes;
    return {
      update(data) { bytes = new Uint8Array(interop.bufferFromData(data)); return this; },
      digest(encoding) {
        if (encoding !== 'hex' || !bytes) {throw Error(`unsupported digest: ${encoding}`);}
        const output = new Uint8Array(32);
        CC_SHA256(bytes, bytes.length, output);
        return Array.from(output, (value) => value.toString(16).padStart(2, '0')).join('');
      },
    };
  } },
  'node:fs': {
    mkdirSync(path) { fileManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(path, true, null, null); },
    existsSync(path) { return fileManager.fileExistsAtPath(path); },
    writeFileSync(path, value) {
      const bytes = typeof value === 'string' ? NSString.stringWithString(value).dataUsingEncoding(4) : value;
      if (!bytes.writeToFileAtomically(path, true)) {throw Error(`write failed: ${path}`);}
    },
  },
  'node:os': { homedir: () => NSHomeDirectory() },
  'node:path': { join: (...parts) => parts.join('/').replace(/\/+/g, '/') },
};

globalThis.require = (name) => {
  if (name === '@nativescript/macos-node-api') {return __nativeExports;}
  if (name in nodeModules) {return nodeModules[name];}
  throw Error(`unsupported require: ${name}`);
};

globalThis.setTimeout = __setTimeout;
globalThis.clearTimeout = __clearTimer;
globalThis.setInterval = __setInterval;
globalThis.clearInterval = __clearTimer;
globalThis.queueMicrotask = (callback) => Promise.resolve().then(callback);
