import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, dirname } from 'node:path'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'

const require = createRequire(import.meta.url)
const root = dirname(require.resolve('@octane-xplat/nativescript-mason-core/package.json'))
const source = readFileSync(join(root, 'smooth-corners.js'), 'utf8')
  .replace(/^import .*$/gm, '')
  .replace(/^export /gm, '')

// Exercise the actual installed helper against the Android bridge shape.
test('published Mason helper reaches Android getStyle and passes the encoded values', () => {
  const calls = []
  class NativeArray extends Array { static create(_type, length) { return new NativeArray(length) } }
  const context = { __ANDROID__: true, Array: NativeArray, encodeSmoothCorners: () => [24, 1], RangeError }
  runInNewContext(source, context)
  const surface = { _view: { getStyle: () => ({ setSmoothCorners: (value) => { calls.push(value); return true } }) } }
  context.setSmoothCorners(surface, 24)
  context.setSmoothCorners(surface, null)
  assert.deepEqual(Array.from(calls[0]), [24, 1])
  assert.equal(calls[1], null)
  assert.throws(() => context.setSmoothCorners({ _view: {} }, 24), /does not support smooth corners/)
})
