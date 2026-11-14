// Generated source (ESM/TS).
// @ts-nocheck — ESM-authored scaffold; proper typing is a later pass.


import { EventEmitter } from 'node:events';
import { Buffer } from 'node:buffer';
const SymbolAsyncIterator = Symbol.asyncIterator || Symbol('asyncIterator');

function toBuffer(chunk, encoding) {
  if (Buffer.isBuffer(chunk)) return chunk;
  if (ArrayBuffer.isView(chunk)) return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  if (typeof chunk === 'string') return Buffer.from(chunk, encoding || 'utf8');
  throw new TypeError('chunk must be string, Buffer, or Uint8Array');
}

class Stream extends EventEmitter {
  constructor() { super(); }
  pipe(dest, options) {
    const src = this;
    const opts = options || {};
    let ended = false;
    function ondata(chunk) {
      if (dest.write(chunk) === false) {
        src.pause();
        dest.once('drain', ondrain);
      }
    }
    function ondrain() { src.resume(); }
    function onend() {
      if (!ended && opts.end !== false) {
        ended = true;
        dest.end();
      }
    }
    function onerror(err) { dest.emit('error', err); }
    src.on('data', ondata);
    src.once('end', onend);
    src.once('error', onerror);
    dest.once('unpipe', () => {
      src.removeListener('data', ondata);
    });
    dest.emit('pipe', src);
    src.resume();
    return dest;
  }
  unpipe(dest) {
    if (dest) dest.emit('unpipe');
    else this._unpipeAll = true;
    return this;
  }
}

class Readable extends Stream {
  constructor(options) {
    super();
    options = options || {};
    this._readableState = {
      buffer: [], ended: false, endEmitted: false, flowing: false, destroyed: false,
      encoding: options.encoding, objectMode: !!options.objectMode,
      readImpl: options.read, reading: false, length: 0,
    };
    if (options.read) {
      this._read = options.read.bind(this);
    }
    this.on('newListener', (name) => {
      // Defer: 'newListener' fires before the listener is registered, so a
      // synchronous resume would emit 'data' before it can be received.
      if (name === 'data') queueMicrotask(() => this.resume());
    });
  }
  _read(size) {}
  get readable() { const s = this._readableState; return !s.destroyed && !s.ended; }
  get readableEnded() { return this._readableState.ended; }
  get destroyed() { return this._readableState.destroyed; }
  get readableLength() { return this._readableState.length; }
  push(chunk, encoding) {
    const s = this._readableState;
    if (s.ended) return false;
    if (chunk === null) {
      s.ended = true;
      this._scheduleEnd();
      return true;
    }
    const buf = s.objectMode ? chunk : toBuffer(chunk, encoding || s.encoding);
    s.buffer.push(buf);
    s.length += s.objectMode ? 1 : buf.length;
    this.emit('readable');
    if (s.flowing) this._drain();
    return true;
  }
  read(size) {
    const s = this._readableState;
    if (s.buffer.length === 0) {
      if (s.ended) return null;
      this._pull();
      return null;
    }
    let out;
    if (s.objectMode) {
      out = s.buffer.shift();
      s.length -= 1;
    } else {
      if (size === undefined || size >= s.length) {
        out = Buffer.concat(s.buffer);
        s.buffer = [];
        s.length = 0;
      } else {
        const all = Buffer.concat(s.buffer);
        out = all.subarray(0, size);
        s.buffer = [all.subarray(size)];
        s.length -= size;
      }
    }
    if (s.length === 0 && s.ended && !s.endEmitted) {
      s.endEmitted = true;
      this.emit('end');
    } else {
      this._pull();
    }
    return out;
  }
  pause() {
    this._readableState.flowing = false;
    return this;
  }
  resume() {
    const s = this._readableState;
    if (!s.flowing) {
      s.flowing = true;
      this._drain();
    }
    return this;
  }
  isPaused() { return !this._readableState.flowing; }
  setEncoding(enc) { this._readableState.encoding = enc; return this; }
  destroy(err) {
    const s = this._readableState;
    if (s.destroyed) return this;
    s.destroyed = true;
    queueMicrotask(() => {
      if (err) this.emit('error', err);
      this.emit('close');
    });
    return this;
  }
  _pull() {
    const s = this._readableState;
    if (s.reading || s.ended || s.destroyed) return;
    s.reading = true;
    queueMicrotask(() => {
      s.reading = false;
      try { this._read(); } catch (e) { this.destroy(e); }
    });
  }
  _drain() {
    const s = this._readableState;
    if (!s.flowing) return;
    while (s.buffer.length > 0 && s.flowing) {
      const chunk = s.objectMode ? s.buffer.shift() : s.buffer.shift();
      s.length -= s.objectMode ? 1 : chunk.length;
      const val = s.encoding && Buffer.isBuffer(chunk)
        ? chunk.toString(s.encoding) : chunk;
      this.emit('data', val);
    }
    if (s.buffer.length === 0 && s.ended && !s.endEmitted) {
      s.endEmitted = true;
      this.emit('end');
    }
    if (s.buffer.length === 0 && !s.ended && !s.reading && s.flowing) {
      this._pull();
    }
  }
  _scheduleEnd() {
    queueMicrotask(() => {
      const s = this._readableState;
      if (s.buffer.length === 0 && !s.endEmitted) {
        s.endEmitted = true;
        this.emit('end');
      } else {
        this._drain();
      }
    });
  }
  [SymbolAsyncIterator]() {
    const self = this;
    return {
      next() {
        return new Promise((resolve, reject) => {
          const s = self._readableState;
          const chunk = self.read();
          if (chunk !== null) { resolve({ value: chunk, done: false }); return; }
          if (s.destroyed) { resolve({ done: true }); return; }
          const onEnd = () => { cleanup(); resolve({ done: true }); };
          const onReadable = () => {
            const c = self.read();
            if (c !== null) { cleanup(); resolve({ value: c, done: false }); }
          };
          const onError = (e) => { cleanup(); reject(e); };
          function cleanup() {
            self.removeListener('end', onEnd);
            self.removeListener('readable', onReadable);
            self.removeListener('error', onError);
          }
          self.once('end', onEnd);
          self.on('readable', onReadable);
          self.once('error', onError);
        });
      },
      return() { self.destroy(); return Promise.resolve({ done: true }); },
      [SymbolAsyncIterator]() { return this; },
    };
  }
  static from(iterable, options) {
    const r = new Readable(Object.assign({ objectMode: true }, options));
    const it = iterable[SymbolAsyncIterator]
      ? iterable[SymbolAsyncIterator]() : iterable[Symbol.iterator]();
    r._read = function () {
      Promise.resolve(it.next()).then(({ value, done }) => {
        if (done) r.push(null); else r.push(value);
      }).catch((e) => r.destroy(e));
    };
    return r;
  }
}

class Writable extends Stream {
  constructor(options) {
    super();
    options = options || {};
    this._writableState = {
      ended: false, finished: false, destroyed: false,
      objectMode: !!options.objectMode,
      highWaterMark: options.highWaterMark || 16384,
      buffered: 0, writing: false, queue: [],
    };
    if (options.write) this._write = options.write.bind(this);
    if (options.final) this._final = options.final.bind(this);
    if (options.writev) this._writev = options.writev.bind(this);
  }
  _write(chunk, encoding, cb) { cb && cb(); }
  _final(cb) { cb && cb(); }
  get writable() { const s = this._writableState; return !s.destroyed && !s.finished && !s.ended; }
  get writableEnded() { return this._writableState.ended; }
  get writableFinished() { return this._writableState.finished; }
  get destroyed() { return this._writableState.destroyed; }
  get writableLength() { return this._writableState.buffered; }
  get writableHighWaterMark() { return this._writableState.highWaterMark; }
  write(chunk, encoding, cb) {
    const s = this._writableState;
    if (typeof encoding === 'function') { cb = encoding; encoding = undefined; }
    if (s.ended) {
      const err = new Error('write after end');
      if (cb) queueMicrotask(() => cb(err));
      queueMicrotask(() => this.emit('error', err));
      return false;
    }
    const buf = s.objectMode ? chunk : toBuffer(chunk, encoding);
    s.buffered += s.objectMode ? 1 : buf.length;
    s.queue.push({ chunk: buf, encoding, cb });
    this._pump();
    return s.buffered < s.highWaterMark;
  }
  _pump() {
    const s = this._writableState;
    if (s.writing) return;
    const entry = s.queue.shift();
    if (!entry) {
      if (s.ended && !s.finished) this._finish();
      return;
    }
    s.writing = true;
    let called = false;
    const done = (err) => {
      if (called) return;
      called = true;
      s.writing = false;
      s.buffered -= s.objectMode ? 1 : entry.chunk.length;
      if (entry.cb) { try { entry.cb(err); } catch (e) { /* noop */ } }
      if (err) { this.destroy(err); return; }
      if (s.buffered < s.highWaterMark) this.emit('drain');
      this._pump();
    };
    try {
      this._write(entry.chunk, entry.encoding, done);
    } catch (e) {
      done(e);
    }
  }
  _finish() {
    const s = this._writableState;
    let called = false;
    const done = (err) => {
      if (called) return;
      called = true;
      if (err) { this.destroy(err); return; }
      s.finished = true;
      this.emit('finish');
    };
    try { this._final(done); } catch (e) { done(e); }
  }
  end(chunk, encoding, cb) {
    const s = this._writableState;
    if (typeof chunk === 'function') { cb = chunk; chunk = undefined; }
    else if (typeof encoding === 'function') { cb = encoding; encoding = undefined; }
    if (cb) this.once('finish', cb);
    if (chunk !== undefined && chunk !== null) this.write(chunk, encoding);
    s.ended = true;
    if (!s.writing && s.queue.length === 0) this._finish();
    return this;
  }
  cork() { this._writableState.corked = true; }
  uncork() { this._writableState.corked = false; }
  destroy(err) {
    const s = this._writableState;
    if (s.destroyed) return this;
    s.destroyed = true;
    queueMicrotask(() => {
      if (err) this.emit('error', err);
      this.emit('close');
    });
    return this;
  }
}

class Duplex extends Readable {
  constructor(options) {
    super(options);
    options = options || {};
    this._writableState = {
      ended: false, finished: false, destroyed: false,
      objectMode: !!options.writableObjectMode || !!options.objectMode,
      highWaterMark: options.highWaterMark || 16384,
      buffered: 0, writing: false, queue: [],
    };
    if (options.write) this._write = options.write.bind(this);
    if (options.final) this._final = options.final.bind(this);
  }
}
// Copy Writable members onto Duplex prototype via descriptors (getters must
// not be invoked during the copy).
for (const k of Object.getOwnPropertyNames(Writable.prototype)) {
  if (k !== 'constructor' && k !== 'destroyed' &&
      !Object.prototype.hasOwnProperty.call(Duplex.prototype, k)) {
    Object.defineProperty(Duplex.prototype, k,
      Object.getOwnPropertyDescriptor(Writable.prototype, k));
  }
}
Object.defineProperty(Duplex.prototype, 'destroyed', {
  get() {
    const r = this._readableState, w = this._writableState;
    return (r && r.destroyed) || (w && w.destroyed) || false;
  },
  configurable: true,
});
Duplex.prototype.destroy = function (err) {
  const r = this._readableState, w = this._writableState;
  if (this.destroyed) return this;
  if (r) r.destroyed = true;
  if (w) w.destroyed = true;
  queueMicrotask(() => {
    if (err) this.emit('error', err);
    this.emit('close');
  });
  return this;
};

class Transform extends Duplex {
  constructor(options) {
    super(options);
    options = options || {};
    if (options.transform) this._transform = options.transform.bind(this);
    if (options.flush) this._flush = options.flush.bind(this);
    this._write = (chunk, encoding, cb) => {
      this._transform(chunk, encoding, (err, data) => {
        if (err) return cb(err);
        if (data !== undefined && data !== null) this.push(data);
        cb();
      });
    };
    this._final = (cb) => {
      this._flush((err, data) => {
        if (data !== undefined && data !== null) this.push(data);
        if (!err) this.push(null);
        cb(err);
      });
    };
  }
  _transform(chunk, encoding, cb) { cb(null, chunk); }
  _flush(cb) { cb(); }
}

class PassThrough extends Transform {}

function finished(stream, cb) {
  let done = false;
  const cleanup = () => {
    stream.removeListener('end', onDone);
    stream.removeListener('finish', onDone);
    stream.removeListener('error', onErr);
    stream.removeListener('close', onDone);
  };
  const onDone = () => { if (done) return; done = true; cleanup(); cb(); };
  const onErr = (e) => { if (done) return; done = true; cleanup(); cb(e); };
  stream.once('end', onDone);
  stream.once('finish', onDone);
  stream.once('error', onErr);
  stream.once('close', onDone);
  return cleanup;
}

function pipeline(...args) {
  const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
  const streams = args[0] && args[0].length !== undefined && Array.isArray(args[0])
    ? args[0] : args;
  let dest;
  for (let i = 0; i < streams.length - 1; i++) {
    dest = streams[i].pipe(streams[i + 1]);
  }
  const last = streams[streams.length - 1];
  if (cb) {
    finished(last, cb);
    for (const s of streams) s.once('error', cb);
  }
  return last;
}

function pipelinePromise(...streams) {
  return new Promise((resolve, reject) => {
    pipeline(...streams, (err) => err ? reject(err) : resolve());
  });
}

function finishedPromise(stream) {
  return new Promise((resolve, reject) => {
    finished(stream, (err) => err ? reject(err) : resolve());
  });
}

const _m: any = {
  Stream,
  Readable, Writable, Duplex, Transform, PassThrough,
  finished, pipeline,
  promises: { pipeline: pipelinePromise, finished: finishedPromise },
};
_m.default = _m;

export = _m;
