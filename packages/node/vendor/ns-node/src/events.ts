// Generated source (ESM/TS). Do not edit js/events.cpp directly.
// @ts-nocheck — ESM-authored scaffold; proper typing is a later pass.
declare const Symbol: any;


function EventEmitter() {
  this._events = Object.create(null);
  this._eventsCount = 0;
  this._maxListeners = undefined;
}

EventEmitter.EventEmitter = EventEmitter;
EventEmitter.defaultMaxListeners = 10;
EventEmitter.errorMonitor = Symbol('events.errorMonitor');
EventEmitter.captureRejectionSymbol = Symbol('events.captureRejectionSymbol');

EventEmitter.defaultMaxListeners = 10;



Object.defineProperty(EventEmitter.prototype, '_events', {
  enumerable: false, writable: true, value: undefined,
});
Object.defineProperty(EventEmitter.prototype, '_eventsCount', {
  enumerable: false, writable: true, value: undefined,
});
Object.defineProperty(EventEmitter.prototype, '_maxListeners', {
  enumerable: false, writable: true, value: undefined,
});

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. ' +
      'Received type ' + typeof listener);
  }
}

function _addListener(target, type, listener, prepend) {
  checkListener(listener);
  let events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  }

  if (events.newListener !== undefined) {
    target.emit('newListener', type,
                listener.listener !== undefined ? listener.listener : listener);
    events = target._events;
  }

  let existing = events[type];
  if (existing === undefined) {
    events[type] = listener;
    target._eventsCount += 1;
  } else {
    if (typeof existing === 'function') {
      existing = events[type] = prepend ? [listener, existing]
                                        : [existing, listener];
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    const max = target._maxListeners !== undefined ? target._maxListeners
                                                 : EventEmitter.defaultMaxListeners;
    if (max > 0 && existing.length > max && !existing.warned) {
      existing.warned = true;
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('MaxListenersExceededWarning: Possible EventEmitter ' +
          'memory leak detected. ' + existing.length + ' ' + String(type) +
          ' listeners added. Use emitter.setMaxListeners() to increase limit.');
      }
    }
  }
  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};
EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener = function prependListener(type, listener) {
  return _addListener(this, type, listener, true);
};

function onceWrapper() {
  if (!this.fired) {
    this.fired = true;
    this.target.removeListener(this.type, this.wrapFn);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  const state = { fired: false, wrapFn: undefined, target, type, listener };
  const wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  return this.on(type, _onceWrap(this, type, listener));
};

EventEmitter.prototype.prependOnceListener =
  function prependOnceListener(type, listener) {
    checkListener(listener);
    return this.prependListener(type, _onceWrap(this, type, listener));
  };

EventEmitter.prototype.removeListener = function removeListener(type, listener) {
  checkListener(listener);
  const events = this._events;
  if (events === undefined) return this;
  const list = events[type];
  if (list === undefined) return this;

  const unwrap = (l) => l.listener !== undefined ? l.listener : l;

  if (list === listener || unwrap(list) === listener) {
    delete events[type];
    this._eventsCount -= 1;
    if (events.removeListener !== undefined) {
      this.emit('removeListener', type, unwrap(list));
    }
  } else if (Array.isArray(list)) {
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i] === listener || unwrap(list[i]) === listener) {
        const removed = list.splice(i, 1)[0];
        if (list.length === 1) {
          events[type] = list[0];
        }
        if (events.removeListener !== undefined) {
          this.emit('removeListener', type, unwrap(removed));
        }
        break;
      }
    }
  }
  return this;
};
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
  const events = this._events;
  if (events === undefined) return this;

  if (events.removeListener === undefined) {
    if (type === undefined) {
      this._events = Object.create(null);
      this._eventsCount = 0;
    } else if (events[type] !== undefined) {
      delete events[type];
      this._eventsCount -= 1;
    }
    return this;
  }

  if (type === undefined) {
    for (const key of Object.keys(events)) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = Object.create(null);
    this._eventsCount = 0;
    return this;
  }

  const list = events[type];
  if (typeof list === 'function') {
    this.removeListener(type, list);
  } else if (Array.isArray(list)) {
    for (let i = list.length - 1; i >= 0; i--) {
      this.removeListener(type, list[i]);
    }
  }
  return this;
};

EventEmitter.prototype.emit = function emit(type) {
  const events = this._events;
  const args = Array.prototype.slice.call(arguments, 1);

  let doError = type === 'error';
  let list = events !== undefined ? events[type] : undefined;

  if (list !== undefined) doError = false;

  if (doError) {
    let err;
    if (args.length > 0) {
      err = args[0];
    }
    if (err instanceof Error) throw err;
    const e = new Error('Unhandled error.' + (err !== undefined ? ' (' + String(err) + ')' : ''));
    e.context = err;
    throw e;
  }

  if (list === undefined) return false;

  if (typeof list === 'function') {
    list.apply(this, args);
    return true;
  }

  const listeners = list.slice();
  for (let i = 0; i < listeners.length; i++) {
    listeners[i].apply(this, args);
  }
  return true;
};

EventEmitter.prototype.listeners = function listeners(type) {
  const events = this._events;
  const list = events !== undefined ? events[type] : undefined;
  if (list === undefined) return [];
  if (typeof list === 'function') {
    return [list.listener !== undefined ? list.listener : list];
  }
  return list.map((l) => l.listener !== undefined ? l.listener : l);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  const events = this._events;
  const list = events !== undefined ? events[type] : undefined;
  if (list === undefined) return [];
  if (typeof list === 'function') return [list];
  return list.slice();
};

EventEmitter.prototype.listenerCount = function listenerCount(type, listener) {
  const events = this._events;
  const list = events !== undefined ? events[type] : undefined;
  if (list === undefined) return 0;
  if (typeof list === 'function') {
    if (listener !== undefined) {
      return (list === listener || list.listener === listener) ? 1 : 0;
    }
    return 1;
  }
  if (listener !== undefined) {
    let n = 0;
    for (const l of list) {
      if (l === listener || l.listener === listener) n++;
    }
    return n;
  }
  return list.length;
};

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || !Number.isFinite(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a ' +
      'non-negative finite number.');
  }
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return this._maxListeners !== undefined ? this._maxListeners
                                        : EventEmitter.defaultMaxListeners;
};

EventEmitter.listenerCount = function listenerCount(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  }
  return 0;
};

EventEmitter.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || !Number.isFinite(n)) {
    throw new RangeError('The value of "n" is out of range.');
  }
  for (let i = 1; i < arguments.length; i++) {
    arguments[i].setMaxListeners(n);
  }
};

// events.once(emitter, name) → Promise for the next emission. Rejects on
// 'error' for non-error events (Node semantics).
EventEmitter.once = function once(emitter, name) {
  return new Promise((resolve, reject) => {
    function errorListener(err) {
      emitter.removeListener(name, eventListener);
      reject(err);
    }
    function eventListener() {
      const args = Array.prototype.slice.call(arguments);
      if (name !== 'error') emitter.removeListener('error', errorListener);
      resolve(args);
    }
    emitter.once(name, eventListener);
    if (name !== 'error') {
      emitter.once('error', errorListener);
    }
  });
};

// events.on(emitter, name) → async iterator of emitted-arg arrays.
EventEmitter.on = function on(emitter, name) {
  const buffer = [];
  const pending = [];
  let finished = false;
  let error = null;

  function listener() {
    const args = Array.prototype.slice.call(arguments);
    if (pending.length > 0) {
      pending.shift()({ value: args, done: false });
    } else {
      buffer.push(args);
    }
  }
  function errorListener(err) {
    error = err;
    finished = true;
    emitter.removeListener(name, listener);
    while (pending.length > 0) pending.shift()(Promise.reject(err));
  }

  emitter.on(name, listener);
  if (name !== 'error') emitter.on('error', errorListener);

  return {
    next() {
      if (buffer.length > 0) {
        return Promise.resolve({ value: buffer.shift(), done: false });
      }
      if (error !== null) return Promise.reject(error);
      if (finished) return Promise.resolve({ value: undefined, done: true });
      return new Promise((resolve) => {
        pending.push((r) => {
          if (r && typeof r.then === 'function') r.then(resolve, resolve);
          else resolve(r);
        });
      });
    },
    return() {
      emitter.removeListener(name, listener);
      if (name !== 'error') emitter.removeListener('error', errorListener);
      finished = true;
      while (pending.length > 0) {
        pending.shift()({ value: undefined, done: true });
      }
      return Promise.resolve({ value: undefined, done: true });
    },
    throw(err) {
      return this.return().then(() => { throw err; });
    },
    [Symbol.asyncIterator]() { return this; },
  };
};

export = EventEmitter;
