// Engine-neutral renderer benchmark. Both entries pass the same shipping
// createGtkRoot defaults (Promise-microtask flush), so timings cover renderer
// and binding work up to the committed widget state, not GTK paint.
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { BenchScreen, benchControl, ROWS } from './bench-screen.gtk.tsx'

const UPDATES = 50
const REMOUNTS = 10
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}
const nodeById = (container, id) => [...container.nodes.values()].find((node) => node.props?.id === id)

// `now` must read CLOCK_MONOTONIC in ms (g_get_monotonic_time) so bench.py can
// split spawn-to-ready into bundle evaluation and first mount.
export async function runBench({ Gtk, engine, now, beforeRemount = () => {}, afterUnmount = () => {} }) {
  const entryMonoMs = now()
  Gtk.init()
  const win = new Gtk.Window({ title: 'Octane runtime benchmark', default_width: 480, default_height: 320, decorated: false })
  const host = new Gtk.Box({ orientation: 1 })
  win.set_child(host)

  let start = now()
  let mounted = createGtkRoot(host)
  mounted.root.render(BenchScreen, {})
  const firstMountMs = now() - start
  win.present()
  console.log(JSON.stringify({ benchReady: true, engine, firstMountMs, entryMonoMs }))
  await pause(300)

  // Await microtask turns until the flush has committed the expected label.
  const commit = async (id, text) => {
    for (let turn = 0; turn < 20; turn++) {
      await Promise.resolve()
      if (nodeById(mounted.container, id).view.get_label() === text) return
    }
    throw Error(`label ${id} never reached ${text}`)
  }
  const timeUpdates = async (apply, id, label) => {
    const samples = []
    for (let i = 1; i <= UPDATES; i++) {
      start = now()
      apply(i)
      await commit(id, label(i))
      samples.push(now() - start)
    }
    return samples
  }
  const singleUpdate = await timeUpdates(benchControl.setFocus, 'focus', (i) => `Focus ${i}`)
  const fullUpdate = await timeUpdates(benchControl.setTick, `row-${ROWS - 1}`, (i) => `Row ${ROWS - 1}: ${i}`)
  console.log(JSON.stringify({ benchSteady: true, engine }))
  await pause(300)

  const remount = []
  for (let i = 0; i < REMOUNTS; i++) {
    mounted.root.unmount()
    afterUnmount(mounted)
    beforeRemount()
    start = now()
    mounted = createGtkRoot(host)
    mounted.root.render(BenchScreen, {})
    remount.push(now() - start)
    await pause(20)
  }
  mounted.root.unmount()
  win.destroy()
  console.log(JSON.stringify({
    bench: {
      engine, rows: ROWS, updates: UPDATES, remounts: REMOUNTS, firstMountMs,
      singleUpdateMedianMs: median(singleUpdate), singleUpdateMaxMs: Math.max(...singleUpdate),
      fullUpdateMedianMs: median(fullUpdate), fullUpdateMaxMs: Math.max(...fullUpdate),
      remountMedianMs: median(remount), remountMaxMs: Math.max(...remount),
    },
  }))
  await pause(300)
}
