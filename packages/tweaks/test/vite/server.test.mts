import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { TweakEntry, TweakValue } from '../../src/protocol.ts'
import { TweaksServer } from '../../src/vite/server.ts'
import { extract, type ExtractedTweak } from '../../src/vite/extract.ts'
import { extractStyles, type StyleSite } from '../../src/vite/styles.ts'
import type { StyleEntry } from '../../src/protocol.ts'

// Fake DevBackend port: sessions are hub app connections identified by
// sessionId, panels by panel id. sendToApp/sendToPanels record into per-peer
// queues; tests drive inbound frames through appMessage/panelMessage and the
// session snapshot list through setSessions.
interface Queue {
  messages: Record<string, unknown>[]
  waiters: { type: string; resolve: (m: Record<string, unknown>) => void }[]
}

function makeQueue() {
  const q: Queue = { messages: [], waiters: [] }
  const push = (msg: Record<string, unknown>) => {
    const i = q.waiters.findIndex((w) => w.type === msg.type)

    if (i >= 0) {
      q.waiters.splice(i, 1)[0].resolve(msg)
    } else {
      q.messages.push(msg)
    }
  }

  const next = (type: string, timeoutMs = 3000) =>
    new Promise<Record<string, unknown>>((resolve, reject) => {
      const i = q.messages.findIndex((m) => m.type === type)

      if (i >= 0) {
        return resolve(q.messages.splice(i, 1)[0])
      }

      const timer = setTimeout(() => reject(new Error(`timeout waiting for ${type}`)), timeoutMs)

      q.waiters.push({
        type,
        resolve: (m) => {
          clearTimeout(timer)
          resolve(m)
        },
      })
    })

  return { push, next, messages: q.messages }
}

interface Fake {
  setSessions(
    sessions: { sessionId: string; platform?: string; state?: string; tweaks?: boolean }[],
  ): void
  appMessage(session: string, msg: Record<string, unknown>): void
  panelMessage(panel: string, msg: Record<string, unknown>): void
  appNext(session: string, type: string): Promise<Record<string, unknown>>
  panelNext(panel: string, type: string): Promise<Record<string, unknown>>
  appMessages(session: string): Record<string, unknown>[]
  panelMessages(panel: string): Record<string, unknown>[]
}

interface Harness extends Fake {
  manifest: Map<string, { entry: TweakEntry; tweak: ExtractedTweak }>
  hub: TweaksServer
}

function start(
  t: { after(fn: () => void): void },
  files: Record<string, string> = {},
  saveDelay = 0,
): Harness {
  const manifest = new Map<string, { entry: TweakEntry; tweak: ExtractedTweak }>()
  const styleManifest = new Map<string, StyleSite>()

  for (const [file, code] of Object.entries(files)) {
    for (const site of extractStyles(code, file).sites) {
      styleManifest.set(site.entry.id, site)
    }

    for (const tweak of extract(code, file).tweaks) {
      manifest.set(tweak.id, {
        entry: {
          id: tweak.id,
          file,
          name: tweak.name,
          group: tweak.group,
          input: tweak.input,
          value: tweak.value,
          writable: tweak.writable,
          reason: tweak.reason,
        },
        tweak,
      })
    }
  }

  const saves: { ok: boolean; saved: string[]; errors: never[] }[] = []
  const appQueues = new Map<string, ReturnType<typeof makeQueue>>()
  const panelQueues = new Map<string, ReturnType<typeof makeQueue>>()
  const liveSessions = new Set<string>()
  const appQ = (s: string) => {
    let q = appQueues.get(s)

    if (!q) {
      appQueues.set(s, (q = makeQueue()))
    }

    return q
  }

  const panelQ = (p: string) => {
    let q = panelQueues.get(p)

    if (!q) {
      panelQueues.set(p, (q = makeQueue()))
    }

    return q
  }

  let onMessage:
    | ((
        m:
          | { from: 'app'; session: string; data: never }
          | { from: 'panel'; panel: string; data: never },
      ) => void)
    | null = null

  let onSessions: ((sessions: never[]) => void) | null = null
  const port = {
    subscribe(listener: typeof onMessage) {
      onMessage = listener
      return () => {}
    },
    onSessions(listener: typeof onSessions) {
      onSessions = listener
      return () => {}
    },
    sendToApp(session: string | '*', data: Record<string, unknown>) {
      if (session === '*') {
        for (const s of liveSessions) {
          appQ(s).push(data)
        }
      } else {
        appQ(session).push(data)
      }

      return true
    },
    sendToPanels(data: Record<string, unknown>, panel?: string) {
      if (panel) {
        panelQ(panel).push(data)
      } else {
        for (const q of panelQueues.values()) {
          q.push(data)
        }
      }

      return true
    },
    close() {},
  }

  const hub = new TweaksServer(
    {
      root: '/proj',
      name: 'test-app',
      getEntry: (id) => manifest.get(id)?.entry,
      getStyleEntry: (id: string) => styleManifest.get(id)?.entry,
      save: async () => {
        await new Promise((r) => setTimeout(r, saveDelay))

        const report = { ok: true, saved: ['src/a.tsx'], errors: [] }

        saves.push(report as never)
        return report
      },
      savePreview: async () => ({
        files: [
          {
            file: 'src/a.tsx',
            diff: '@@ -1,1 +1,1 @@\n-const a = useTweak(8)\n+const a = useTweak(20)',
          },
        ],
        truncated: false,
        errors: [],
      }),
      log: () => {},
    },
    port as never,
  )

  t.after(() => hub.close())
  return {
    manifest,
    hub,
    setSessions(sessions) {
      liveSessions.clear()

      const snaps = sessions.map((s) => {
        if (s.state !== 'disconnected') {
          liveSessions.add(s.sessionId)
        }

        return {
          sessionId: s.sessionId,
          targetId: 't',
          appInstanceId: 'i',
          platform: s.platform ?? 'web',
          registryRevision: 0,
          state: s.state ?? 'ready',
          ownership: 'o',
          origin: 'o',
          readiness: 'r',
          connectedAt: '',
          disconnectedAt: '',
          channels: s.tweaks === false ? [] : [{ id: 'tweaks', version: 5 }],
        }
      })

      onSessions!(snaps as never[])
    },
    appMessage(session, msg) {
      onMessage!({ from: 'app', session, data: msg as never })
    },
    panelMessage(panel, msg) {
      onMessage!({ from: 'panel', panel, data: msg as never })
    },
    appNext: (s, type) => appQ(s).next(type),
    panelNext: (p, type) => panelQ(p).next(type),
    appMessages: (s) => appQ(s).messages,
    panelMessages: (p) => panelQ(p).messages,
  }
}

const FILE = `import { useTweak } from '@octane-xplat/tweaks'
const a = useTweak(8, { input: { type: 'number' } })
const pick = useTweak('x', { input: { type: 'select', options: ['x', 'y'] } })
`

const FILES = { 'src/a.tsx': FILE }

test('new tweaks session gets values; mount → hello state; session loss drops mounts', async (t) => {
  const h = start(t, FILES)

  h.setSessions([{ sessionId: 'c1' }])

  const values = await h.appNext('c1', 'values')

  assert.deepEqual(values.values, {})
  h.appMessage('c1', { type: 'mount', mounts: [{ id: 'src/a.tsx#a', value: 8 }] })
  // hello answers that panel only.
  h.panelMessage('p1', { type: 'hello' })

  const state = (await h.panelNext('p1', 'state')) as {
    entries: { id: string; mountedBy: string[]; runtimeValue: TweakValue }[]
    clients: { clientId: string; label: string }[]
  }

  assert.deepEqual(
    state.entries.map((e) => e.id),
    ['src/a.tsx#a'],
  )

  assert.deepEqual(state.entries[0].mountedBy, ['c1'])
  assert.equal(state.entries[0].runtimeValue, 8)
  assert.deepEqual(state.clients, [{ clientId: 'c1', label: 'web' }])

  // Unmount removes the entry from state.
  const gone = h.panelNext('p1', 'state')

  h.appMessage('c1', { type: 'unmount', ids: ['src/a.tsx#a'] })
  assert.deepEqual(((await gone).entries as unknown[]).length, 0)
  assert.deepEqual((await gone).unmountedDirty, [])
  // Session loss drops mounts too.
  h.appMessage('c1', { type: 'mount', mounts: [{ id: 'src/a.tsx#a', value: 8 }] })
  await h.panelNext('p1', 'state')

  const empty = h.panelNext('p1', 'state')

  h.setSessions([])
  assert.deepEqual(((await empty).entries as unknown[]).length, 0)
})

test('set validates type and broadcasts values + state', async (t) => {
  const h = start(t, FILES)

  h.setSessions([{ sessionId: 'c1' }])
  await h.appNext('c1', 'values')
  h.appMessage('c1', { type: 'mount', mounts: [{ id: 'src/a.tsx#pick', value: 'x' }] })
  h.panelMessage('p1', { type: 'hello' })
  await h.panelNext('p1', 'state')
  // Invalid: not in options → ignored, no broadcast.
  h.panelMessage('p1', { type: 'set', id: 'src/a.tsx#pick', value: 'zzz' })
  await new Promise((r) => setTimeout(r, 150))

  // Valid: broadcast values to the app.
  const msg = h.appNext('c1', 'values')

  h.panelMessage('p1', { type: 'set', id: 'src/a.tsx#pick', value: 'y' })
  assert.deepEqual((await msg).values, { 'src/a.tsx#pick': 'y' })

  const state = (await h.panelNext('p1', 'state')) as {
    entries: { override: TweakValue | null; dirty: boolean }[]
  }

  assert.equal(state.entries[0].override, 'y')
  assert.equal(state.entries[0].dirty, true)

  // Revert sets the override to the source value (deliberately not deleted).
  const reverted = h.appNext('c1', 'values')

  h.panelMessage('p1', { type: 'revert', ids: ['src/a.tsx#pick'] })
  assert.deepEqual((await reverted).values, { 'src/a.tsx#pick': 'x' })

  const clean = (await h.panelNext('p1', 'state')) as { entries: { dirty: boolean }[] }

  assert.equal(clean.entries[0].dirty, false)
})

test('concurrent save reports busy; saveResult goes to the requester only', async (t) => {
  const h = start(t, FILES, 200)
  const r1 = h.panelNext('p1', 'saveResult')
  const r2 = h.panelNext('p2', 'saveResult')

  h.panelMessage('p1', { type: 'save' })
  h.panelMessage('p2', { type: 'save' })

  const [first, second] = (await Promise.all([r1, r2])) as {
    ok: boolean
    saved: string[]
    errors: { message: string }[]
  }[]

  assert.equal(first.ok, true)
  assert.deepEqual(first.saved, ['src/a.tsx'])
  assert.equal(second.ok, false)
  assert.match(second.errors[0].message, /busy/)
  // p1's result never reached p2's queue (and vice versa beyond the busy).
  assert.equal(h.panelMessages('p2').filter((m) => m.type === 'saveResult').length, 0)
  assert.equal(h.panelMessages('p1').filter((m) => m.type === 'saveResult').length, 0)
})

test('savePreview request returns the diff to that panel only; busy during save', async (t) => {
  const h = start(t, FILES, 150)
  const preview = h.panelNext('p1', 'savePreview')

  h.panelMessage('p1', { type: 'savePreview' })

  const report = (await preview) as {
    files: { file: string; diff: string }[]
    truncated: boolean
    errors: { message: string }[]
  }

  assert.equal(report.files.length, 1)
  assert.equal(report.files[0].file, 'src/a.tsx')
  assert.match(report.files[0].diff, /^\+const a = useTweak\(20\)$/m)
  assert.equal(report.truncated, false)
  assert.equal(h.panelMessages('p2').length, 0)

  // While a save is in flight a preview answers busy instead of racing it.
  const saving = h.panelNext('p1', 'saveResult')

  h.panelMessage('p1', { type: 'save' })
  await new Promise((r) => setTimeout(r, 60)) // < saveDelay: the save is still running

  const busy = h.panelNext('p2', 'savePreview')

  h.panelMessage('p2', { type: 'savePreview' })
  await saving
  assert.match((await busy).errors[0].message, /busy/)
})

test('unmountedDirty lists dirty overrides with no mounting session; bare revert covers them', async (t) => {
  const h = start(t, FILES)

  h.setSessions([{ sessionId: 'c1' }])
  await h.appNext('c1', 'values')
  h.panelMessage('p1', { type: 'hello' })
  await h.panelNext('p1', 'state')
  h.appMessage('c1', { type: 'mount', mounts: [{ id: 'src/a.tsx#a', value: 8 }] })
  await h.panelNext('p1', 'state')

  // Override while mounted, then unmount → dirty with no session.
  const v = h.appNext('c1', 'values')

  h.panelMessage('p1', { type: 'set', id: 'src/a.tsx#a', value: 42 })
  await v
  h.appMessage('c1', { type: 'unmount', ids: ['src/a.tsx#a'] })

  // Wait for the post-unmount state (earlier broadcasts may still be queued).
  let s: {
    entries: unknown[]
    unmountedDirty: { id: string; override: TweakValue; value: TweakValue | null }[]
  }

  for (;;) {
    s = (await h.panelNext('p1', 'state')) as typeof s
    if (s.entries.length === 0) {
      break
    }
  }

  assert.deepEqual(s.unmountedDirty, [
    {
      id: 'src/a.tsx#a',
      kind: 'tweak',
      file: 'src/a.tsx',
      name: 'a',
      group: null,
      override: 42,
      value: 8,
    },
  ])

  // Bare revert reverts unmounted dirty overrides too.
  const reverted = h.appNext('c1', 'values')

  h.panelMessage('p1', { type: 'revert' })
  assert.deepEqual((await reverted).values, { 'src/a.tsx#a': 8 })

  let clean: { unmountedDirty: unknown[]; entries: { id: string; dirty: boolean }[] }

  for (;;) {
    clean = (await h.panelNext('p1', 'state')) as typeof clean
    if (clean.unmountedDirty.length === 0 && clean.entries.every((e) => !e.dirty)) {
      break
    }
  }
})

test('styleSet/styleDelete drafts, validation, mounted styles in state, revert', async (t) => {
  const h = start(t, {
    'src/App.tsx': `export function App() {
	return <View style={{ borderRadius: 8, padding: 16 }}><Text style={{ color: 'red' }} /></View>
}`,
  })

  const siteId = 'src/App.tsx#style:App/View:1'

  h.setSessions([{ sessionId: 'a1' }])

  const valuesMsgs = h.appMessages('a1')

  h.appMessage('a1', { type: 'mount', mounts: [{ id: siteId, value: 0 }] })
  h.panelMessage('p1', { type: 'hello' })

  const states = h.panelMessages('p1')

  await new Promise((r) => setTimeout(r, 60))

  const state = states.at(-1) as { styles: { id: string; dirty: boolean }[] }
  const entry = state.styles.find((s) => s.id === siteId)

  assert.ok(entry, 'mounted inline site in state.styles')
  assert.equal(entry.dirty, false)

  // Invalid: bad path + read-only kind length>1 for inline. The async
  // connect-time values broadcast may still be in flight, so compare
  // against a baseline count rather than zero.
  const baseline = valuesMsgs.length

  h.panelMessage('p1', { type: 'styleSet', id: siteId, path: ['a', 'b'], value: 1 })
  h.panelMessage('p1', { type: 'styleSet', id: siteId, path: [''], value: 1 })
  await new Promise((r) => setTimeout(r, 60))
  assert.equal(valuesMsgs.length, baseline)

  // Valid set + delete.
  h.panelMessage('p1', { type: 'styleSet', id: siteId, path: ['padding'], value: 24 })
  h.panelMessage('p1', { type: 'styleDelete', id: siteId, path: ['borderRadius'] })
  await new Promise((r) => setTimeout(r, 80))

  const vals = valuesMsgs.at(-1) as {
    styles: Record<string, { kind: string; set: Record<string, number>; delete: string[] }>
  }

  assert.deepEqual(vals.styles[siteId], {
    kind: 'inline',
    set: { padding: 24 },
    delete: ['borderRadius'],
  })

  const lastState = () =>
    (h.panelMessages('p1').at(-1) ?? {}) as { styles: { id: string; dirty: boolean }[] }

  assert.equal(lastState().styles.find((s) => s.id === siteId)!.dirty, true)

  // Delete after editing must remove the property, not merely undo the edit.
  h.panelMessage('p1', { type: 'styleDelete', id: siteId, path: ['padding'] })
  await new Promise((r) => setTimeout(r, 60))
  assert.ok(valuesMsgs.at(-1)!.styles[siteId].delete.includes('padding'))
  assert.equal(valuesMsgs.at(-1)!.styles[siteId].set.padding, undefined)

  // Restore is a styleSet of the source literal; it must clear deletion too.
  h.panelMessage('p1', { type: 'styleSet', id: siteId, path: ['padding'], value: 16 })
  h.panelMessage('p1', { type: 'styleSet', id: siteId, path: ['borderRadius'], value: 8 })
  await new Promise((r) => setTimeout(r, 60))
  assert.equal(lastState().styles.find((s) => s.id === siteId)!.dirty, false)

  // Restoring a draft addition drops it without deleting a source property.
  h.panelMessage('p1', { type: 'styleSet', id: siteId, path: ['opacity'], value: '0.5' })
  h.panelMessage('p1', { type: 'styleDelete', id: siteId, path: ['opacity'] })
  await new Promise((r) => setTimeout(r, 60))
  assert.equal(lastState().styles.find((s) => s.id === siteId)!.dirty, false)
  h.panelMessage('p1', { type: 'styleSet', id: siteId, path: ['padding'], value: 24 })

  // Revert the site.
  h.panelMessage('p1', { type: 'revert', ids: [siteId] })
  await new Promise((r) => setTimeout(r, 60))
  assert.equal(lastState().styles.find((s) => s.id === siteId)!.dirty, false)
  assert.equal((valuesMsgs.at(-1) as typeof vals).styles[siteId], undefined)
})

test('pick broadcast, picked relay to all panels, new session while picking', async (t) => {
  const h = start(t, {
    'src/App.tsx': `export function App() {
	return <View style={{ padding: 16 }} />
}`,
  })

  const siteId = 'src/App.tsx#style:App/View:1'

  h.setSessions([{ sessionId: 'a1' }])

  const appMsgs = h.appMessages('a1')

  h.appMessage('a1', { type: 'mount', mounts: [{ id: siteId, value: 0 }] })
  h.panelMessage('p1', { type: 'hello' })

  const states = h.panelMessages('p1')
  const until = (fn: () => boolean, label: string) =>
    new Promise<void>((resolve, reject) => {
      const end = Date.now() + 4000
      const poll = () =>
        fn()
          ? resolve()
          : Date.now() > end
            ? reject(new Error(`timeout ${label}`))
            : setTimeout(poll, 10)

      poll()
    })

  await until(() => (states.at(-1)?.styles.length ?? 0) === 1, 'mount state')

  // pick active → state.picking + apps get pick active.
  h.panelMessage('p1', { type: 'pick', active: true })
  await until(() => (states.at(-1) as { picking: boolean })?.picking === true, 'picking true')
  await until(() => appMsgs.some((m) => m.type === 'pick' && m.active === true), 'app pick on')

  // picked ignored when not picking.
  h.panelMessage('p1', { type: 'pick', active: false })
  await until(() => (states.at(-1) as { picking: boolean })?.picking === false, 'picking false')
  h.appMessage('a1', { type: 'picked', ids: [siteId] })
  await new Promise((r) => setTimeout(r, 60))
  assert.equal(h.panelMessages('p1').filter((m) => m.type === 'picked').length, 0)

  // picking again, picked relays ids filtered to mounted sites, to every panel.
  h.panelMessage('p1', { type: 'pick', active: true })
  await until(() => (states.at(-1) as { picking: boolean })?.picking === true, 'picking again')

  const p2picked = h.panelNext('p2', 'picked')

  h.appMessage('a1', { type: 'picked', ids: [siteId, 'bogus#style:X/Y:9'] })
  await until(() => h.panelMessages('p1').some((m) => m.type === 'picked'), 'picked relayed')

  const picked = h.panelMessages('p1').find((m) => m.type === 'picked')!

  assert.deepEqual(picked.ids, [siteId])
  assert.equal(picked.clientId, 'a1')
  assert.deepEqual((await p2picked).ids, [siteId], 'picked broadcast reaches all panels')
  await until(() => (states.at(-1) as { picking: boolean })?.picking === false, 'pick ended')

  // New session while picking receives pick after its connect-time values.
  h.panelMessage('p1', { type: 'pick', active: true })
  await until(
    () => (states.at(-1) as { picking: boolean })?.picking === true,
    'picking before new session',
  )

  const app2Msgs = h.appMessages('a2')

  h.setSessions([{ sessionId: 'a1' }, { sessionId: 'a2' }])
  await until(
    () =>
      app2Msgs.findIndex((m) => m.type === 'values') !== -1 &&
      app2Msgs.findIndex((m) => m.type === 'pick' && m.active === true) >
        app2Msgs.findIndex((m) => m.type === 'values'),
    'a2 pick after values',
  )
})
