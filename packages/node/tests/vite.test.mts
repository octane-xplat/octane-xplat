import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nodeBuiltins } from '../dist/vite.js'

const plugin = nodeBuiltins()

assert.equal(typeof plugin.resolveId, 'function')

const resolveId = plugin.resolveId.bind(plugin)

test('claimed builtins resolve to bundled dist entries', () => {
  for (const id of ['buffer', 'node:buffer']) {
    assert.match(resolveId(id), /\/dist\/buffer\.js$/, id)
  }
})

test('unclaimed ids fall through to normal resolution', () => {
  for (const id of ['buffer/', 'util/', 'buffer/index.js', 'events/events.js', 'fs', 'node:fs']) {
    assert.equal(resolveId(id), undefined, id)
  }
})

test('unsupported Node core subpaths are rejected', () => {
  for (const id of [
    'node:stream/promises',
    'stream/promises',
    'util/types',
    'assert/strict',
    'node:events/x',
  ]) {
    assert.throws(() => resolveId(id), /Unsupported Node builtin subpath/, id)
  }
})
