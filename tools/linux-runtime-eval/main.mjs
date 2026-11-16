import { createUniversalRoot } from 'octane/universal/native'
import { Screen, state, actions } from './screen.gtk.tsx'
import { api, stats } from '#gtk-api'

const check = (name, ok, detail) => {
  console.log(JSON.stringify({ check: name, pass: !!ok, detail }))
  if (!ok) {
    throw Error(name)
  }
}
const wait = async (fn, ms = 3000) => {
  const start = api.now()
  while (!fn()) {
    if (api.now() - start > ms) {
      throw Error(`wait timed out: ${JSON.stringify(state)}`)
    }
    await api.pause(10)
  }
}
let mountNumber = 0

function mount() {
  const mountId = ++mountNumber
  const nodes = new Map(),
    host = api.create('host', { mount: mountId, widgetId: '<host>' })
  let root
  const detach = (node) => {
    api.detach(node.view)
    node.parent = null
  }
  const applyProps = (node, props) => {
    node.props = props
    if (props.text !== undefined) {
      node.muted = true
      api.setText(node.type, node.view, String(props.text))
      node.muted = false
    }
  }
  const driver = {
    id: 'probe',
    capabilities: { text: 'host' },
    events: {
      classify: (name) =>
        name === 'onTap'
          ? { type: 'tap', priority: 'discrete' }
          : name === 'onTextChange'
            ? { type: 'textChange', priority: 'discrete' }
            : null,
    },
    prepareBatch(container, batch) {
      return {
        apply() {
          for (const c of batch.commands) {
            if (c.op === 'create') {
              const n = {
                type: c.type,
                view: api.create(c.type, {
                  mount: mountId,
                  nodeId: c.id,
                  widgetId: c.props?.id ?? null,
                }),
                props: {},
                events: new Map(),
                muted: false,
                parent: null,
                pending: new Set(),
              }
              nodes.set(c.id, n)
              applyProps(n, c.props)
            } else if (c.op === 'update') {
              applyProps(nodes.get(c.id), c.props)
            } else if (c.op === 'insert' || c.op === 'move') {
              const n = nodes.get(c.id)
              if (n.parent) {
                detach(n)
              }
              const parent = c.parent === null ? host : nodes.get(c.parent).view
              api.attach(parent, n.view, c.before === null ? null : nodes.get(c.before).view)
              n.parent = parent
            } else if (c.op === 'remove') {
              detach(nodes.get(c.id))
            } else if (c.op === 'destroy') {
              const n = nodes.get(c.id)
              for (const id of n.pending) {
                api.cancelEvent(id)
              }
              n.pending.clear()
              for (const dispose of n.events.values()) {
                dispose()
              }
              if (n.parent) {
                detach(n)
              }
              api.destroy(n.view)
              nodes.delete(c.id)
            } else if (c.op === 'event') {
              const n = nodes.get(c.id)
              n.events.get(c.type)?.()
              n.events.delete(c.type)
              if (c.listener) {
                const callback = () => {
                  if (n.muted) {
                    return
                  }
                  const payload = {
                    value: n.type === 'textfield' ? api.text(n.type, n.view) : undefined,
                  }
                  const id = api.deferEvent(() => {
                    n.pending.delete(id)
                    root.dispatchEvent(c.listener.id, payload)
                  })
                  n.pending.add(id)
                }
                n.events.set(
                  c.type,
                  api.connect(n.view, c.type === 'tap' ? 'clicked' : 'changed', callback),
                )
              }
            } else if (c.op !== 'ensure-public-instance') {
              throw Error(`unsupported command ${c.op}`)
            }
          }
        },
        abort() {},
      }
    },
    getPublicInstance: (_, id) => nodes.get(id)?.view ?? null,
  }
  root = createUniversalRoot({}, driver, {
    scheduleMicrotask: (fn) => Promise.resolve().then(fn),
    onUncaughtError: (e) => {
      throw e
    },
  })
  const win = api.window()
  root.render(Screen, {})
  api.show(win, host)
  return {
    nodes,
    root,
    win,
    host,
    find: (id) => [...nodes.values()].find((n) => n.props.id === id),
    dispose() {
      root.unmount()
      check('unmount-nodes-empty', nodes.size === 0, nodes.size)
      api.close(win)
      api.destroy(host)
    },
  }
}
async function run() {
  api.init()
  const initial = api.now()
  let first = mount()
  await api.pause(150)
  let entry = first.find('entry'),
    counter = first.find('counter')
  check('compiled-octane-mounted', api.text(counter.type, counter.view) === 'Count: 0')
  let before = counter.view
  const frames = [...first.nodes.values()].map((n) => ({ id: n.props.id, ...api.bounds(n.view) }))
  console.log(JSON.stringify({ ready: true, frames, mountMs: api.now() - initial, stats }))
  api.focus(entry.view)
  // The host runner sends actual XTest click/keyboard events after the ready record.
  await wait(() => state.count === 1 && state.text === 'ABC')
  check('os-click-updated-count', api.text(counter.type, counter.view) === 'Count: 1')
  check('controlled-entry-uppercase', api.text(entry.type, entry.view) === 'ABC', { ...state })
  check('stable-counter-identity', first.find('counter').view === before)
  await api.pause(50)
  check('controlled-write-no-echo', state.changes === 3, { ...state })
  const latencies = []
  for (let i = 2; i < 102; i++) {
    const start = api.now()
    actions.setCount(i)
    await Promise.resolve()
    await Promise.resolve()
    check('microtask-update', api.text(counter.type, counter.view) === `Count: ${i}`)
    latencies.push(api.now() - start)
  }
  latencies.sort((a, b) => a - b)
  console.log(
    JSON.stringify({
      scheduling: { samples: latencies.length, p95Ms: latencies[94], maxMs: latencies.at(-1) },
    }),
  )
  const records = api.nativeRecords?.()
  if (records) {
    check(
      'mason-real-child-geometry',
      records.some(
        (r) => r.length >= 110 && r[23] === 0 && r[45] === 120 && r[67] === 240 && r[89] === 360,
      ),
      records.map((r) => r.slice(0, 110)),
    )
  }
  first.dispose()
  for (let i = 0; i < 20; i++) {
    let instance = mount()
    await api.pause(10)
    instance.dispose()
    // The async function remains active through the final collection below;
    // release its last loop-local root explicitly before measuring finalizers.
    instance = null
    check('cycle-baseline', stats.nodes === 0 && stats.callbacks === 0, { cycle: i, ...stats })
  }
  let cancelled = mount()
  await api.pause(30)
  const prior = state.count
  api.emitClick(cancelled.find('increment').view)
  check(
    'event-queued-before-unmount',
    [...cancelled.nodes.values()].some((n) => n.pending.size > 0),
  )
  cancelled.dispose()
  await api.pause(30)
  check('queued-event-cancelled', state.count === prior)
  const saved = { ...state },
    snapshot = { ...stats }
  await api.pause(5000)
  check(
    'five-second-drain',
    stats.nodes === 0 && stats.callbacks === 0 && JSON.stringify(saved) === JSON.stringify(state),
    { stats, snapshot },
  )
  // Drop every handle to dead trees, then collect so the check measures
  // retention rather than GC deferral (native engine: wrapper refs keep
  // natives alive until the JS wrapper is unreachable).
  first = null
  entry = null
  counter = null
  before = null
  cancelled = null
  actions.setCount = null // module-level action closure pins the last render's tree
  if (api.nativeRecords) {
    for (let i = 0; i < 3; i++) {
      globalThis.gc?.()
      await api.pause(50)
    }
    check('native-widget-finalization', stats.finalized === stats.created, {
      ...stats,
      pendingWidgets: api.pendingWidgets?.() ?? [],
    })
  }
  check('native-measure-callback', !api.nativeRecords || stats.leafMeasures > 0, stats)
  console.log(JSON.stringify({ complete: true, stats, pendingWidgets: api.pendingWidgets?.() ?? [] }))
}
if (api.run) {
  api.run(run)
} else {
  await run()
}
