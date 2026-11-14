import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { requireNode } from '../dist/index.js'

const expect = (value) => ({
  toBe: (expected) => assert.equal(value, expected),
  toEqual: (expected) => assert.deepEqual(value, expected),
  toBeDefined: () => assert.notEqual(value, undefined),
  toBeUndefined: () => assert.equal(value, undefined),
  toContain: (expected) => assert.ok(value.includes(expected)),
  toBeGreaterThan: (expected) => assert.ok(value > expected),
  toBeLessThan: (expected) => assert.ok(value < expected),
  toThrow: () => assert.throws(value),
  not: { toBeNull: () => assert.notEqual(value, null) },
})

// Keep the upstream Jasmine cases untouched and supply the small runner boundary.
// A callback timeout is a failed test, rather than a silently skipped async case.
for (const module of ['Events', 'Util', 'Assert', 'Buffer', 'Querystring', 'Stream']) {
  const source = readFileSync(
    new URL(`../vendor/ns-node/tests/Node${module}.js`, import.meta.url),
    'utf8',
  )

  const register = new Function('describe', 'it', 'expect', 'require', source)

  register(
    describe,
    (name, action) =>
      it(name, { timeout: 3000 }, () =>
        action.length
          ? new Promise((resolve, reject) => {
              const done = (error) => (error ? reject(error) : resolve())

              action(done)
            })
          : action(),
      ),
    expect,
    requireNode,
  )
}
