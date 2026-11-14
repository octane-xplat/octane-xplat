// Generated source (ESM/TS).
// @ts-nocheck — ESM-authored scaffold; proper typing is a later pass.


import util from './util.js';
const inspect = util.inspect;

class AssertionError extends Error {
  constructor(options) {
    options = options || {};
    const message = options.message !== undefined ? String(options.message)
      : 'assertion failed';
    super(message);
    this.name = 'AssertionError';
    this.code = 'ERR_ASSERTION';
    this.actual = options.actual;
    this.expected = options.expected;
    this.operator = options.operator;
    this.generatedMessage = options.message === undefined;
  }
}

function innerFail(obj) {
  throw new AssertionError({
    message: obj.message,
    actual: obj.actual,
    expected: obj.expected,
    operator: obj.operator,
  });
}

function fail(actual, expected, message, operator) {
  if (arguments.length === 1) {
    message = actual;
    actual = undefined;
  }
  innerFail({ actual, expected, message, operator: operator || 'fail' });
}

function ok(value, message) {
  if (!value) {
    innerFail({ actual: value, expected: true, message, operator: '==' });
  }
}

function equal(actual, expected, message) {
  // eslint-disable-next-line eqeqeq
  if (actual != expected) {
    innerFail({ actual, expected, message, operator: '==' });
  }
}

function notEqual(actual, expected, message) {
  // eslint-disable-next-line eqeqeq
  if (actual == expected) {
    innerFail({ actual, expected, message, operator: '!=' });
  }
}

function strictEqual(actual, expected, message) {
  if (!Object.is(actual, expected)) {
    innerFail({ actual, expected, message, operator: 'strictEqual' });
  }
}

function notStrictEqual(actual, expected, message) {
  if (Object.is(actual, expected)) {
    innerFail({ actual, expected, message, operator: 'notStrictEqual' });
  }
}

function deepEqual(actual, expected, message) {
  if (!isDeepEqualLoose(actual, expected)) {
    innerFail({ actual, expected, message, operator: 'deepEqual' });
  }
}

function notDeepEqual(actual, expected, message) {
  if (isDeepEqualLoose(actual, expected)) {
    innerFail({ actual, expected, message, operator: 'notDeepEqual' });
  }
}

function deepStrictEqual(actual, expected, message) {
  if (!util.isDeepStrictEqual(actual, expected)) {
    innerFail({ actual, expected, message, operator: 'deepStrictEqual' });
  }
}

function notDeepStrictEqual(actual, expected, message) {
  if (util.isDeepStrictEqual(actual, expected)) {
    innerFail({ actual, expected, message, operator: 'notDeepStrictEqual' });
  }
}

// Loose deep equality for deepEqual(): like strict but treats null/undefined
// loosely and uses == for primitive leaves.
function isDeepEqualLoose(a, b) {
  // eslint-disable-next-line eqeqeq
  if (a == b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!isDeepEqualLoose(a[k], b[k])) return false;
  }
  return true;
}

function expectedException(actual, expected, message) {
  if (expected === undefined) return true;

  if (expected instanceof RegExp) {
    return expected.test(String(actual));
  }
  if (typeof expected === 'object' && expected !== null) {
    for (const k of Object.keys(expected)) {
      if (actual === null || typeof actual !== 'object' ||
          !(k in actual) || actual[k] !== expected[k]) {
        throw new AssertionError({
          message: 'The expected error did not match property ' + inspect(k) +
            '. Expected: ' + inspect(expected[k]) + ', got: ' +
            inspect(actual && actual[k]),
          actual, expected, operator: 'throws',
        });
      }
    }
    return true;
  }
  if (typeof expected === 'function') {
    if (expected.prototype !== undefined && actual instanceof expected) {
      return true;
    }
    if (expected === Error || Object.getPrototypeOf(expected) === Error ||
        actual instanceof expected) {
      return true;
    }
    return expected.call({}, actual) === true;
  }
  throw new TypeError('The "expected" argument must be a RegExp, function, ' +
    'object, or Error class.');
}

function throws(fn, expected, message) {
  if (typeof expected === 'string') {
    message = expected;
    expected = undefined;
  }
  if (typeof fn !== 'function') {
    throw new TypeError('The "fn" argument must be of type Function');
  }
  try {
    fn();
  } catch (e) {
    if (expectedException(e, expected, message)) {
      return e;
    }
    return e;
  }
  innerFail({
    actual: undefined, expected,
    message: message !== undefined ? message
      : 'Missing expected exception' + (expected ? ': ' + inspect(expected) : ''),
    operator: 'throws',
  });
}

function doesNotThrow(fn, expected, message) {
  if (typeof fn !== 'function') {
    throw new TypeError('The "fn" argument must be of type Function');
  }
  try {
    fn();
  } catch (e) {
    if (expected !== undefined && expectedException(e, expected, message)) {
      innerFail({
        actual: e, expected,
        message: message !== undefined ? message
          : 'Got unwanted exception: ' + inspect(e),
        operator: 'doesNotThrow',
      });
    }
    throw e;
  }
}

function ifError(value) {
  if (value !== null && value !== undefined) {
    const err = new AssertionError({
      message: 'ifError got unwanted exception: ' + inspect(value),
      actual: value, expected: null, operator: 'ifError',
    });
    throw value instanceof Error ? Object.assign(value, { assertion: err }) : err;
  }
}

async function waitForActual(promiseFn) {
  let result;
  try {
    result = await promiseFn();
  } catch (e) {
    return e;
  }
  innerFail({
    actual: result, expected: undefined,
    message: 'Expected promise to be rejected but it resolved with ' + inspect(result),
    operator: 'rejects',
  });
}

function rejects(asyncFn, expected, message) {
  if (typeof expected === 'string') {
    message = expected;
    expected = undefined;
  }
  let promise = typeof asyncFn === 'function' ? undefined : asyncFn;
  const runner = () => {
    if (typeof asyncFn === 'function') return asyncFn();
    return promise;
  };
  const p = waitForActual(runner);
  return p.then((e) => {
    expectedException(e, expected, message);
    return e;
  });
}

async function doesNotRejectWait(promiseFn) {
  try {
    return await promiseFn();
  } catch (e) {
    return e;
  }
}

function doesNotReject(asyncFn, expected, message) {
  if (typeof expected === 'string') {
    message = expected;
    expected = undefined;
  }
  const runner = () => (typeof asyncFn === 'function' ? asyncFn() : asyncFn);
  return doesNotRejectWait(runner).then((e) => {
    if (e instanceof Error) {
      if (expected !== undefined && expectedException(e, expected, message)) {
        innerFail({
          actual: e, expected,
          message: message !== undefined ? message
            : 'Got unwanted rejection: ' + inspect(e),
          operator: 'doesNotReject',
        });
      }
      throw e;
    }
    return e;
  });
}

function match(value, regExp, message) {
  if (!(regExp instanceof RegExp)) {
    throw new TypeError('The "regExp" argument must be a RegExp');
  }
  if (!regExp.test(String(value))) {
    innerFail({ actual: value, expected: regExp, message, operator: 'match' });
  }
}

function doesNotMatch(value, regExp, message) {
  if (!(regExp instanceof RegExp)) {
    throw new TypeError('The "regExp" argument must be a RegExp');
  }
  if (regExp.test(String(value))) {
    innerFail({ actual: value, expected: regExp, message, operator: 'doesNotMatch' });
  }
}

function assert(value, message) {
  ok(value, message);
}

assert.AssertionError = AssertionError;
assert.fail = fail;
assert.ok = ok;
assert.equal = equal;
assert.notEqual = notEqual;
assert.strictEqual = strictEqual;
assert.notStrictEqual = notStrictEqual;
assert.deepEqual = deepEqual;
assert.notDeepEqual = notDeepEqual;
assert.deepStrictEqual = deepStrictEqual;
assert.notDeepStrictEqual = notDeepStrictEqual;
assert.throws = throws;
assert.doesNotThrow = doesNotThrow;
assert.rejects = rejects;
assert.doesNotReject = doesNotReject;
assert.ifError = ifError;
assert.match = match;
assert.doesNotMatch = doesNotMatch;
assert.CallTracker = undefined;


assert.default = assert;
assert.strict = Object.assign(function strict(value, message) {
  ok(value, message);
}, assert, { equal: strictEqual, notEqual: notStrictEqual,
              deepEqual: deepStrictEqual, notDeepEqual: notDeepStrictEqual });

export default assert;
