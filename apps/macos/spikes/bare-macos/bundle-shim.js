// Temporary CJS environment for measuring the actual bundle's host needs.
globalThis.console = {
  log: (...args) => __hostLog(...args),
  warn: (...args) => __hostLog(...args),
  error: (...args) => __hostLog(...args),
};
globalThis.process = { env: { NODE_ENV: 'production', OCTANE_MACOS_AUTOMATION: '1' } };
Object.defineProperty(globalThis, 'Buffer', { configurable: true, value: { from(value, encoding) {
  if (encoding !== 'base64') throw Error(`unsupported Buffer encoding: ${encoding}`);
  return NSData.alloc().initWithBase64EncodedStringOptions(value, 0);
} } });
// Probe past a CoreText bridge crash; this deliberately disables font matching.
Object.defineProperty(globalThis, 'CTFontDescriptorCopyAttribute', { configurable: true, value: () => ({ path: globalThis.__fontPath }) });
const fileManager = NSFileManager.defaultManager;
const nodeModules = {
  'node:crypto': { createHash() { return { update() { return this; }, digest() { return 'bare-spike'; } }; } },
  'node:fs': {
    mkdirSync(path) { fileManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(path, true, null, null); },
    existsSync(path) { if (path.endsWith('.ttf')) globalThis.__fontPath = path; return fileManager.fileExistsAtPath(path); },
    writeFileSync(path, value) {
      if (path.endsWith('.ttf')) globalThis.__fontPath = path;
      const bytes = typeof value === 'string' ? NSString.stringWithString(value).dataUsingEncoding(4) : value;
      if (!bytes.writeToFileAtomically(path, true)) throw Error(`write failed: ${path}`);
    },
  },
  'node:os': { homedir: () => NSHomeDirectory() },
  'node:path': { join: (...parts) => parts.join('/').replace(/\/+/g, '/') },
};
globalThis.require = (name) => {
  if (name === '@nativescript/macos-node-api') return __nativeExports;
  if (name in nodeModules) return nodeModules[name];
  throw Error(`unsupported require: ${name}`);
};
globalThis.setTimeout = __setTimeout;
globalThis.clearTimeout = __clearTimer;
globalThis.setInterval = __setInterval;
globalThis.clearInterval = __clearTimer;
globalThis.queueMicrotask = (callback) => Promise.resolve().then(callback);
