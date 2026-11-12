import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  displayValue,
  TweaksPanelModel,
  validateForInput,
  type TweaksPanelPort,
} from '../src/devtools/model.ts'

import type { BackendRef, SessionSnapshot } from '@octane-xplat/devtools/panel'
import type { PanelEntry } from '../src/protocol.ts'

// Fake TweaksPanelPort — stands in for the devtools connection: records
// sendToBackend frames and lets tests emit backend/sessions/state events.
class FakePort implements TweaksPanelPort {
  state: 'connecting' | 'live' | 'closed' = 'live'
  backendList: BackendRef[] = []
  sessionList: SessionSnapshot[] = []
  sent: { channel: string; targetId: string; data: unknown }[] = []

  private channelListeners = new Set<(msg: unknown) => void>()
  private backendListeners = new Set<(b: readonly BackendRef[]) => void>()
  private sessionListeners = new Set<(s: readonly SessionSnapshot[]) => void>()
  private stateListeners = new Set<(s: 'connecting' | 'live' | 'closed') => void>()

  sessions() {
    return this.sessionList
  }
  backends() {
    return this.backendList
  }
  sendToBackend(channel: string, targetId: string, data: unknown) {
    this.sent.push({ channel, targetId, data })
    return true
  }
  subscribe(l: (msg: never) => void) {
    this.channelListeners.add(l)
    return () => this.channelListeners.delete(l)
  }
  onBackends(l: (b: readonly BackendRef[]) => void) {
    this.backendListeners.add(l)
    return () => this.backendListeners.delete(l)
  }
  onSessions(l: (s: readonly SessionSnapshot[]) => void) {
    this.sessionListeners.add(l)
    return () => this.sessionListeners.delete(l)
  }
  onState(l: (s: 'connecting' | 'live' | 'closed') => void) {
    this.stateListeners.add(l)
    return () => this.stateListeners.delete(l)
  }

  // Test emitters.
  emitBackend(targetId: string, data: unknown) {
    for (const l of this.channelListeners) {
      l({ channel: 'tweaks', from: 'backend', targetId, data })
    }
  }
  setBackends(list: BackendRef[]) {
    this.backendList = list
    for (const l of this.backendListeners) {
      l(list)
    }
  }
  setSessions(list: SessionSnapshot[]) {
    this.sessionList = list
    for (const l of this.sessionListeners) {
      l(list)
    }
  }
  setState(state: 'connecting' | 'live' | 'closed') {
    this.state = state
    for (const l of this.stateListeners) {
      l(state)
    }
  }
}

const T1: BackendRef = { channel: 'tweaks', targetId: 'target-1' }
const OTHER: BackendRef = { channel: 'xplat-logs', targetId: 'logs' }

function entry(partial: Partial<PanelEntry>): PanelEntry {
  return {
    id: 'f#n',
    file: 'f',
    name: 'n',
    group: null,
    input: { type: 'number' },
    value: 1,
    writable: true,
    runtimeValue: 1,
    override: null,
    dirty: false,
    mountedBy: ['c'],
    ...partial,
  }
}

const stateMsg = (entries: PanelEntry[], unmountedDirty = [], styles: unknown[] = []) => ({
  type: 'state',
  server: { name: 'app', root: '/r' },
  clients: [{ clientId: 'c', label: 'web' }],
  entries,
  styles,
  unmountedDirty,
})

function setup(backends: BackendRef[] = [T1]) {
  const port = new FakePort()

  port.backendList = backends

  const model = new TweaksPanelModel(port)

  model.start()
  return { model, port }
}

const lastSent = (port: FakePort) => port.sent.at(-1)

test('a sole tweaks backend auto-selects and opens with hello', () => {
  const { model, port } = setup([T1, OTHER])

  assert.equal(model.targetId, 'target-1')
  assert.equal(model.status, 'connecting')
  assert.deepEqual(port.sent, [
    { channel: 'tweaks', targetId: 'target-1', data: { type: 'hello' } },
  ])
})

test('a panel mounted during connecting picks up the ready snapshot on live', () => {
  // The hub's `ready` frame seeds backends()/sessions() without firing
  // onBackends/onSessions — a model started while 'connecting' must re-read
  // the snapshot when the connection goes live.
  const port = new FakePort()

  port.state = 'connecting'

  const model = new TweaksPanelModel(port)

  model.start()
  assert.equal(model.targetId, null)
  port.backendList = [T1]
  port.setState('live')
  assert.equal(model.targetId, 'target-1')
  assert.deepEqual(lastSent(port)?.data, { type: 'hello' })
})

test('no auto-select with zero or several tweaks backends', () => {
  const zero = setup([])

  assert.equal(zero.model.targetId, null)
  assert.equal(zero.model.status, 'idle')

  const two = setup([T1, { channel: 'tweaks', targetId: 'target-2' }])

  assert.equal(two.model.targetId, null)
  assert.equal(two.port.sent.length, 0)
})

test('select targets a backend and receives only its frames', () => {
  const { model, port } = setup([T1, { channel: 'tweaks', targetId: 'target-2' }])

  model.select('target-2')
  assert.deepEqual(lastSent(port), {
    channel: 'tweaks',
    targetId: 'target-2',
    data: { type: 'hello' },
  })

  // Frames for other targets are ignored.
  port.emitBackend('target-1', stateMsg([entry({})]))
  assert.equal(model.entries.length, 0)
  port.emitBackend('target-2', stateMsg([entry({})]))
  assert.equal(model.entries.length, 1)
  assert.equal(model.status, 'connected')
})

test('a backend that reappears gets a fresh hello', () => {
  const { model, port } = setup([T1])

  port.emitBackend('target-1', stateMsg([entry({})]))
  port.sent.length = 0
  port.setBackends([])
  assert.equal(model.status, 'disconnected')
  port.setBackends([T1])
  assert.deepEqual(lastSent(port)?.data, { type: 'hello' })
})

test('set validates against input type and sends only valid values', () => {
  const { model, port } = setup()

  port.emitBackend('target-1', stateMsg([entry({ input: { type: 'number' } })]))
  assert.equal(model.set('f#n', 5), true)
  assert.equal(model.set('f#n', Number.NaN), false)
  assert.equal(model.set('f#n', 'x' as never), false)
  assert.deepEqual(
    port.sent.filter((s) => (s.data as { type: string }).type === 'set'),
    [{ channel: 'tweaks', targetId: 'target-1', data: { type: 'set', id: 'f#n', value: 5 } }],
  )
})

test('select/color/boolean validation', () => {
  assert.equal(validateForInput({ type: 'select', options: ['a', 1] }, 'a'), true)
  assert.equal(validateForInput({ type: 'select', options: ['a', 1] }, 'b'), false)
  assert.equal(validateForInput({ type: 'color' }, '#ff00aa'), true)
  assert.equal(validateForInput({ type: 'color' }, 'red'), false)
  assert.equal(validateForInput({ type: 'boolean' }, true), true)
  assert.equal(validateForInput({ type: 'boolean' }, 1 as never), false)
  assert.equal(validateForInput({ type: 'string' }, 'ok'), true)
  assert.equal(validateForInput({ type: 'number' }, 3.5), true)
})

test('dirty count includes unmountedDirty; revert/save payloads', () => {
  const { model, port } = setup()

  port.emitBackend(
    'target-1',
    stateMsg(
      [entry({ dirty: true })],
      [{ id: 'f#hidden', file: 'f', name: 'hidden', group: null, override: 2, value: 1 }],
    ),
  )

  assert.equal(model.dirtyCount(), 2)
  model.revertAll()
  model.save()
  assert.deepEqual(
    port.sent.slice(-2).map((s) => s.data),
    [{ type: 'revert' }, { type: 'save' }],
  )

  assert.equal(model.saving, true)
  port.emitBackend('target-1', { type: 'saveResult', ok: true, saved: ['f'], errors: [] })
  assert.equal(model.saving, false)
  assert.deepEqual(model.saveResult?.saved, ['f'])
})

test('switching targets clears selection state', () => {
  const { model, port } = setup([T1, { channel: 'tweaks', targetId: 'target-2' }])

  model.select('target-1')
  port.emitBackend('target-1', stateMsg([entry({})]))
  model.pickFilter = ['old-site']
  model.select('target-2')
  assert.equal(model.pickFilter, null)
  assert.equal(model.entries.length, 0)
  assert.equal(model.clients.length, 0)
  assert.equal(model.status, 'connecting')
  assert.deepEqual(lastSent(port)?.data, { type: 'hello' })
})

test('style dirty count, draft display, number coercion, add-name validation', () => {
  const { model, port } = setup()

  port.emitBackend('target-1', { ...stateMsg([]), styles: [STYLE_SITE] })
  assert.equal(model.dirtyCount(), 0)
  port.emitBackend('target-1', { ...stateMsg([]), styles: [{ ...STYLE_SITE, dirty: true }] })
  assert.equal(model.dirtyCount(), 1)

  const site = { ...STYLE_SITE, draft: { set: { padding: '10' }, delete: [] as string[] } }

  assert.equal(model.stylePropValue(site, ['padding']), '10')
  assert.equal(model.stylePropValue(site, ['backgroundColor']), 'surface')
  assert.equal(model.stylePropDeleted(site, ['padding']), false)
  assert.equal(
    model.stylePropDeleted({ ...site, draft: { set: {}, delete: ['padding'] } }, ['padding']),
    true,
  )

  assert.deepEqual(model.styleAddedPaths(site), [])
  assert.deepEqual(
    model.styleAddedPaths({ ...site, draft: { set: { marginTop: '8' }, delete: [] } }),
    ['marginTop'],
  )

  model.styleSet('style-1', ['fontSize'], '30')
  assert.deepEqual((lastSent(port)?.data as { value: unknown }).value, 30)
  model.styleSet('style-1', ['padding'], '10')
  assert.deepEqual((lastSent(port)?.data as { value: unknown }).value, '10')
  model.styleSet('style-1', ['fontSize'], 'abc')
  assert.deepEqual((lastSent(port)?.data as { value: unknown }).value, 'abc')

  assert.equal(model.styleAddNameValid({ ...STYLE_SITE, kind: 'inline' }, 'marginTop'), true)
  assert.equal(model.styleAddNameValid({ ...STYLE_SITE, kind: 'inline' }, 'a.b'), false)
  assert.equal(model.styleAddNameValid(STYLE_SITE, '_web.color'), true)
  assert.equal(model.styleAddNameValid(STYLE_SITE, ''), false)
  assert.equal(model.styleAddNameValid(STYLE_SITE, 'a..b'), false)

  model.styleRestore('style-1', ['backgroundColor'])
  assert.deepEqual(lastSent(port)?.data, {
    type: 'styleSet',
    id: 'style-1',
    path: ['backgroundColor'],
    value: 'surface',
  })
})

const STYLE_SITE = {
  id: 'style-1',
  kind: 'bamboo',
  file: 'src/App.style.ts',
  line: 5,
  label: 'card',
  properties: [
    { path: ['padding'], value: '6', editable: true },
    { path: ['backgroundColor'], value: 'surface', editable: true },
    { path: ['fontSize'], value: 24, editable: true },
  ],
  writable: true,
  draft: { set: {}, delete: [] },
  dirty: false,
  mountedBy: ['app'],
  preview: 'live',
} as never

test('restoring an added style property removes its draft addition', () => {
  const { model, port } = setup()

  port.emitBackend('target-1', {
    ...stateMsg([]),
    styles: [{ ...STYLE_SITE, draft: { set: { opacity: '0.5' }, delete: [] }, dirty: true }],
  })

  model.styleRestore('style-1', ['opacity'])
  assert.deepEqual(lastSent(port)?.data, {
    type: 'styleDelete',
    id: 'style-1',
    path: ['opacity'],
  })
})

test('a backend vanishing mid-save releases busy state without claiming success', () => {
  const { model, port } = setup()

  port.emitBackend('target-1', stateMsg([entry({ dirty: true })]))
  model.save()
  port.setBackends([])
  assert.equal(model.saving, false)
  assert.equal(model.saveResult?.ok, false)
  assert.match(model.saveResult!.errors[0].message, /Check source before retrying/)
})

test('a hub close mid-save releases busy state too', () => {
  const { model, port } = setup()

  port.emitBackend('target-1', stateMsg([entry({ dirty: true })]))
  model.save()
  port.setState('closed')
  assert.equal(model.saving, false)
  assert.equal(model.saveResult?.ok, false)
})

test('save preview: request sends savePreview, response shows diff, confirm/cancel', () => {
  const { model, port } = setup()

  port.emitBackend('target-1', stateMsg([entry({ dirty: true, override: 5 })]))
  model.requestPreview()
  assert.equal(model.previewing, true)
  assert.equal(model.preview, null)
  assert.deepEqual(lastSent(port)?.data, { type: 'savePreview' })

  const previewMsg = {
    type: 'savePreview',
    files: [{ file: 'f', diff: '@@ -1,1 +1,1 @@\n-old\n+new' }],
    truncated: false,
    errors: [],
  }

  port.emitBackend('target-1', previewMsg)
  assert.equal(model.previewing, false)
  assert.equal(model.preview?.files[0].file, 'f')
  assert.equal(model.previewStale, false)

  model.cancelPreview()
  assert.equal(model.preview, null)

  model.requestPreview()
  port.emitBackend('target-1', previewMsg)
  model.confirmSave()
  assert.equal(model.preview, null)
  assert.deepEqual(lastSent(port)?.data, { type: 'save' })
  assert.equal(model.saving, true)
})

test('a state change while the preview is open marks it stale; confirm refused', () => {
  const { model, port } = setup()

  port.emitBackend('target-1', stateMsg([entry({ dirty: true, override: 5 })]))
  model.requestPreview()
  port.emitBackend('target-1', {
    type: 'savePreview',
    files: [{ file: 'f', diff: 'd' }],
    truncated: false,
    errors: [],
  })

  assert.equal(model.previewStale, false)

  port.emitBackend('target-1', stateMsg([entry({ dirty: true, override: 9 })]))
  assert.equal(model.previewStale, true)
  model.confirmSave()
  assert.notEqual((lastSent(port)?.data as { type: string }).type, 'save')
  assert.ok(model.preview, 'stale preview stays open until refreshed or cancelled')

  model.requestPreview()
  port.emitBackend('target-1', {
    type: 'savePreview',
    files: [{ file: 'f', diff: 'd2' }],
    truncated: false,
    errors: [],
  })

  assert.equal(model.previewStale, false)
  model.confirmSave()
  assert.deepEqual(lastSent(port)?.data, { type: 'save' })
})

test('pick filter narrows groupedStyles and is pruned/cleared', () => {
  const { model, port } = setup()
  const s1 = { ...STYLE_SITE, id: 'f1#a' }
  const s2 = { ...STYLE_SITE, id: 'f2#b' }

  port.emitBackend('target-1', { ...stateMsg([]), styles: [s1, s2] })
  assert.equal(model.groupedStyles().flatMap((g) => g.sites).length, 2)

  port.emitBackend('target-1', { type: 'picked', clientId: 'c', ids: [s2.id] })
  assert.deepEqual(model.pickFilter, [s2.id])
  assert.deepEqual(
    model.groupedStyles().flatMap((g) => g.sites.map((s) => s.id)),
    [s2.id],
  )

  model.clearPickFilter()
  assert.equal(model.pickFilter, null)

  port.emitBackend('target-1', { type: 'picked', clientId: 'c', ids: [] })
  assert.equal(model.pickFilter, null)

  port.emitBackend('target-1', { type: 'picked', clientId: 'c', ids: [s1.id, s2.id] })
  port.emitBackend('target-1', { ...stateMsg([]), styles: [s1] })
  assert.deepEqual(model.pickFilter, [s1.id])
  port.emitBackend('target-1', { ...stateMsg([]), styles: [] })
  assert.equal(model.pickFilter, null)
})

test('dispose cancels an in-progress pick on the selected target', () => {
  const { model, port } = setup()

  port.emitBackend('target-1', { ...stateMsg([]), picking: true })
  model.dispose()
  assert.deepEqual(lastSent(port)?.data, { type: 'pick', active: false })
})

test('target labels append the session platform when known', () => {
  const { model, port } = setup()

  assert.equal(model.targetLabel(T1), 'target-1')
  port.setSessions([
    {
      sessionId: 's1',
      targetId: 'target-1',
      appInstanceId: 'a',
      platform: 'web',
      registryRevision: 0,
      state: 'ready',
      ownership: '',
      origin: '',
      readiness: '',
      connectedAt: '',
      disconnectedAt: '',
      channels: [],
    },
  ])

  assert.equal(model.targetLabel(T1), 'target-1 — web')
})
