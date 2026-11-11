import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TWEAKS_PROTOCOL_VERSION } from '../src/protocol.ts'
import type { PanelEntry, TweakEntry } from '../src/protocol.ts'

test('protocol constants and shape', () => {
  assert.equal(TWEAKS_PROTOCOL_VERSION, 5)

  const entry: PanelEntry = {
    id: 'src/a.tsrx#card/title',
    file: 'src/a.tsrx',
    name: 'title',
    group: 'card',
    input: { type: 'string' },
    value: 'hi',
    writable: true,
    runtimeValue: 'hi',
    override: null,
    dirty: false,
    mountedBy: [],
  }

  const base: TweakEntry = entry

  assert.equal(base.id, entry.id)
})
