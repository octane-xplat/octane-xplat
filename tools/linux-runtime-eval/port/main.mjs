// Self-checking port probe: real createGtkRoot + shared @octane-xplat/ui on the
// NativeScript runtime through the GI projection. Follows the slice's ready/
// input/complete protocol so input.py drives real XTest events.
import {
  namespaces,
  beginScope,
  releaseScope,
  bridgeStats,
  describeResidual,
  pendingFinalizers,
  pendingInScope,
  typeNameOf,
} from '../../../packages/cli/src/linux-gtk/bindings.mjs'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { PortScreen, portState } from './screen.gtk.tsx'
import { getNativeGtkMajorVersion } from './native-sdk-smoke.ts'
const { Gtk } = namespaces

const check = (name, ok, detail) => {
  console.log(JSON.stringify({ check: name, pass: !!ok, detail }))
  if (!ok) {
    throw Error(name)
  }
}
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const wait = async (fn, ms = 8000) => {
  const start = Date.now()
  while (!fn()) {
    if (Date.now() - start > ms) {
      throw Error(`wait timed out: ${JSON.stringify(portState)}`)
    }
    await pause(10)
  }
}
const nodeById = (container, id) =>
  [...container.nodes.values()].find((node) => node.props?.id === id)
const widgetOf = (node) => node?.layoutView ?? node?.view
// integer bounds of `widget` measured in `target`'s coordinate space
const frame = (widget, target) => {
  const [ok, rect] = widget.compute_bounds(target)
  if (!ok) {
    throw Error('gtk_widget_compute_bounds failed')
  }
  const origin = rect.origin ?? rect
  const size = rect.size ?? rect
  return {
    x: Math.round(origin.x),
    y: Math.round(origin.y),
    width: Math.round(size.width),
    height: Math.round(size.height),
  }
}

Gtk.init()
const nativeGtkMajor = getNativeGtkMajorVersion()
check('native-sdk-gtk-version', nativeGtkMajor === Gtk.MAJOR_VERSION, nativeGtkMajor)
const options = {
  onUncaughtError: (error) => {
    throw error
  },
}
const mount = () => {
  const mounted = createGtkRoot(host, options)
  mounted.root.render(PortScreen, {})
  return mounted
}
// Runtime wrappers own their GObject ref: JS-reachable wrappers keep natives
// alive. Drop every handle to a dead tree, then collect so the check window
// measures retention, not just GC deferral.
const collect = async () => {
  for (let i = 0; i < 3; i++) {
    globalThis.gc?.()
    await pause(20)
  }
}

const scope = beginScope()
let win = new Gtk.Window({
  title: 'Octane runtime evaluation',
  default_width: 480,
  default_height: 320,
  decorated: false,
})
let host = new Gtk.Box({ orientation: 1 })
win.set_child(host)

// Kept inside a function so every probe handle dies before the drain checks.
const firstMount = async () => {
  const mounted = mount()
  win.present()

  await pause(150)
  const layout = widgetOf(nodeById(mounted.container, 'layout'))
  const counterNode = nodeById(mounted.container, 'counter')
  const entry = widgetOf(nodeById(mounted.container, 'entry'))
  const textview = nodeById(mounted.container, 'multiline')?.view
  check('probe-widgets-present', layout && counterNode?.view && entry && textview, {
    ids: [...mounted.container.nodes.values()].map((n) => n.props?.id),
  })
  // Mason is required on every platform (octane-xplat#281): the renderer's
  // Gtk.Box fallback is not a supported layout path, so it fails here.
  const layoutType = typeNameOf(layout)
  check('mason-mode', layoutType === 'XplatMasonView', layoutType)
  const frames = [
    { id: 'layout', ...frame(layout, win) },
    { id: 'increment', ...frame(widgetOf(nodeById(mounted.container, 'increment')), layout) },
    { id: 'entry', ...frame(entry, layout) },
    { id: 'multiline', ...frame(widgetOf(nodeById(mounted.container, 'multiline')), layout) },
  ]
  console.log(JSON.stringify({ ready: true, frames, stats: { ...bridgeStats } }))
  // The host runner sends XTest click/keyboard events after the ready record.
  await wait(
    () => portState.count === 1 && portState.text === 'ABC' && portState.multiline === 'de',
  )
  check('counter-label-text', counterNode.view.get_label?.() === 'Count: 1', portState)
  check('controlled-entry-uppercase', entry.get_text() === 'ABC', portState)
  check('entry-caret-at-end', entry.get_position() === 3, entry.get_position())
  check('controlled-write-no-echo', portState.changes === 3, portState)
  check('multiline-buffer-text', textview.get_text() === 'de', textview.get_text())
  check(
    'stable-counter-identity',
    nodeById(mounted.container, 'counter') === counterNode &&
      nodeById(mounted.container, 'counter').view === counterNode.view,
  )

  mounted.root.unmount()
  await pause(50)
}
await firstMount()

// Both completion paths must retire GTK's native callback trampoline even
// while the widget and the enclosing probe scope are still alive.
const callbacksBeforeTicks = bridgeStats.callbacks
let tickRuns = 0
const cancelledTick = host.add_tick_callback(() => {
  tickRuns++
  return false
})
host.remove_tick_callback(cancelledTick)
await wait(() => bridgeStats.callbacks === callbacksBeforeTicks)
check('removed-tick-callback-released', tickRuns === 0)
host.add_tick_callback(() => {
  tickRuns++
  return false
})
await wait(() => tickRuns === 1 && bridgeStats.callbacks === callbacksBeforeTicks)
check('completed-tick-callback-released', true)

// Remount cycles into the same host; each mount owns one explicit scope.
let baseline = null
for (let i = 0; i < 20; i++) {
  const cycle = beginScope()
  const runCycle = async () => {
    const instance = mount()
    await pause(10)
    instance.root.unmount()
  }
  // Let the GTK root's Promise scheduler run passive teardown before releasing
  // the probe's callback scope.
  await runCycle()
  releaseScope(cycle)
  await pause(30) // let deferred interop callback releases drain
  // The strict lifecycle invariant: every object created in this scope must
  // finalize — pendingFinalizers names whatever GTK still holds. Raw
  // finalized counts jitter ±1 because wrapObject reuses live wrappers, so
  // the count of newly weak-ref'd objects varies slightly per mount.
  const deadline = Date.now() + 1500
  let cyclePending
  do {
    await collect()
    cyclePending = pendingInScope(cycle)
    console.log(JSON.stringify({ drainCycle: i, pendingN: cyclePending.length }))
  } while (cyclePending.length > 0 && Date.now() < deadline)
  const settled = { ...bridgeStats }
  check('cycle-pending-drained', cyclePending.length === 0, {
    cycle: i,
    finalized: settled.finalized,
    liveProxies: settled.objects,
    liveSignals: describeResidual().signals,
    pending: cyclePending,
  })
  if (baseline === null) {
    baseline = settled
    continue
  }
  check(
    'cycle-stats-stable',
    settled.objects === baseline.objects &&
      settled.signals === baseline.signals &&
      settled.callbacks === baseline.callbacks &&
      settled.sources === baseline.sources,
    { cycle: i, snap: settled, baseline },
  )
}

const destroyWindow = () => {
  const surface = win.get_surface()
  win.destroy()
  // The X11 display's pointer cache can still own the last surface. Identify
  // that exact destroyed surface without keeping a JS reference to it.
  if (surface && typeNameOf(surface) === 'GdkX11Toplevel') {
    check('window-surface-destroyed', surface.is_destroyed())
    return surface.__native.toBigInt().toString()
  }
  return null
}
const pointerSurface = destroyWindow()
releaseScope(scope)
win = null
host = null
const processGlobals = new Set(['GtkSettings', 'GdkX11Display', 'GdkDisplay'])
const finalDeadline = Date.now() + 1500
let residual
let drained
do {
  await collect()
  residual = describeResidual()
  drained = [...pendingFinalizers].every(
    ([address, name]) =>
      processGlobals.has(name) || (address === pointerSurface && name === 'GdkX11Toplevel'),
  )
} while (!drained && Date.now() < finalDeadline)
residual.pendingFinalizers = [...pendingFinalizers.values()]
residual.retainedPointerSurface = pointerSurface !== null && pendingFinalizers.has(pointerSurface)
check('residual-process-global', drained, residual)
console.log(JSON.stringify({ complete: true, stats: { ...bridgeStats }, residual }))
