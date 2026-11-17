import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createMasonSurfaceOwner } from '../src/mason-surface.ts'

test('Mason surface owner applies changes once and clears only its own hosts', () => {
  const calls = []
  const owner = createMasonSurfaceOwner((view, options) => calls.push([view, options]))
  const content = { _view: {} }
  const surface = { _view: {} }
  const detached = { _view: null }
  const corners = { radius: 24, curve: 'squircle' }

  owner.update(detached, corners)
  owner.update(content, null)
  owner.update(surface, corners)
  owner.update(surface, { ...corners })
  owner.update(content, corners)
  owner.update(content, null)
  owner.dispose(surface)
  owner.dispose(surface)
  owner.dispose(detached)
  assert.deepEqual(calls, [
    [content, null], [surface, corners], [content, corners], [content, null], [surface, null],
  ])
})

test('a rejected update is not cached', () => {
  let attempts = 0
  const owner = createMasonSurfaceOwner(() => { if (++attempts === 1) throw Error('rejected') })
  const surface = { _view: {} }
  assert.throws(() => owner.update(surface, 8), /rejected/)
  owner.update(surface, 8)
  assert.equal(attempts, 2)
})
