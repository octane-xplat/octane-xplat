import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAccessibilityState } from '../src/accessibility-state.ts'

test('AX-only views have semantic identity, immutable snapshots and identity-safe leases', () => {
  const state = createAccessibilityState(),
    view = {}

  const old = state.acquire(view),
    authored = { disabled: false }

  old.update({
    accessibilityLabel: 'Progress',
    accessibilityRole: 'progressbar',
    accessibilityState: authored,
  })

  authored.disabled = true

  const snapshot = state.get(view)!

  assert.equal(snapshot.accessibilityState?.disabled, false)

  const next = state.acquire(view)

  next.update({ accessibilityRole: 'adjustable' })
  old.update({ accessibilityLabel: 'stale' })
  old.release()
  old.release()
  assert.equal(old.current(), false)
  assert.equal(state.get(view)?.accessibilityRole, 'adjustable')
  assert.equal(state.get(view)?.accessibilityLabel, undefined)
  assert.equal(snapshot.accessibilityLabel, 'Progress')
  next.release()
  next.update({ accessibilityLabel: 'resurrected' })
  assert.equal(state.get(view), undefined)
})
