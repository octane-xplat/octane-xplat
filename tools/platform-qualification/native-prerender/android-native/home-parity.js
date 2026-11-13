import { Utils } from '@nativescript/core'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import { Home } from '../Home.tsrx'
import resolved from 'xplat-prerender:artifact'

const check = (value, message) => {
  if (!value) throw new Error(message)
}
export class HomeLeaseRetired extends Error {
  constructor() {
    super('Home Activity lease retired')
  }
}
const settle = async (lease) => {
  await new Promise((done) => setTimeout(done, 50))
  if (!lease.active) throw new HomeLeaseRetired()
}
function layout(host, width, height) {
  // Parent padding may place the root below system bars even when its content
  // frame fills the window. Manual probe layout must retain that native origin.
  const left = host.nativeViewProtected.getLeft(),
    top = host.nativeViewProtected.getTop()
  host.measure(
    Utils.layout.makeMeasureSpec(width, Utils.layout.EXACTLY),
    Utils.layout.makeMeasureSpec(height, Utils.layout.EXACTLY),
  )
  host.layout(left, top, left + width, top + height)
}
function compare(activity, phase, source = 'adopted') {
  const adopted = JSON.parse(
    String(
      source === 'cold'
        ? activity.snapshotPreRuntime()
        : source === 'baseline'
          ? activity.snapshotBeforeBinding()
          : activity.snapshotHome(),
    ),
  )
  const ordinary = JSON.parse(String(activity.snapshotReference()))
  check(adopted.length === 19 && ordinary.length === 19, 'Home reference count differs')
  const differences = []
  adopted.forEach((row, index) => {
    const reference = ordinary[index]
    if (phase !== 'style removal')
      check(
        [row, reference].every(
          (item) =>
            item.attached &&
            item.width > 0 &&
            item.height > 0 &&
            Number.isFinite(item.computedWidth) &&
            Number.isFinite(item.computedHeight),
        ),
        'Home comparison lacks attached nonzero computed geometry at ' + index,
      )
    for (const key of new Set([...Object.keys(row), ...Object.keys(reference)])) {
      const left = row[key],
        right = reference[key]
      const equal =
        typeof left === 'number' && typeof right === 'number'
          ? Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= 0.0001
          : left === right
      if (!equal) differences.push({ index, key, adopted: left, ordinary: right })
    }
  })
  check(
    differences.length === 0,
    'Home ' + phase + ' differs from ordinary reference: ' + JSON.stringify(differences),
  )
  return adopted.length
}

/** Fixed-screen measured/style comparison; neither images nor presentation. */
export async function qualifyHomeParity(activity, host, factoryCalls, lease) {
  const ordinary = new View()
  ordinary.width = '100%'
  ordinary.height = '100%'
  ordinary.style.display = 'flex'
  ordinary.style.flexDirection = 'column'
  const css = host.css,
    className = host.className
  ordinary.className = className
  ordinary.css = css
  ordinary._setupAsRootView(activity)
  ordinary.callLoaded()
  const reference = createNativeScriptRoot(ordinary)
  const native = ordinary.nativeViewProtected
  let attached = false
  let initialCompared, preRuntimeCompared, baselineCompared, removedCompared, restoredCompared
  try {
    const prepared = reference.prepare(Home, resolved.seed)
    check(prepared.status === 'prepared', 'Ordinary reference preparation suspended')
    prepared.commit()
    activity.attachReference(native)
    attached = true
    if (activity.requestProbeRecreation()) {
      const deadline = Date.now() + 5000
      while (Date.now() < deadline) await settle(lease)
      throw new Error('Requested Activity recreation did not retire its comparison lease')
    }
    await settle(lease)
    const width = activity.getViewport().getWidth(),
      height = activity.getViewport().getHeight()
    check(width > 0 && height > 0, 'Home comparison viewport is empty')
    layout(host, width, height)
    layout(ordinary, width, height)
    preRuntimeCompared = compare(activity, 'pre-runtime', 'cold')
    baselineCompared = compare(activity, 'native baseline', 'baseline')
    initialCompared = compare(activity, 'initial')
    host.css = ''
    ordinary.css = ''
    host.className = ''
    ordinary.className = ''
    await settle(lease)
    layout(host, width, height)
    layout(ordinary, width, height)
    removedCompared = compare(activity, 'style removal')
    host.className = className
    ordinary.className = className
    host.css = css
    ordinary.css = css
    await settle(lease)
    layout(host, width, height)
    layout(ordinary, width, height)
    restoredCompared = compare(activity, 'style restoration')
    check(factoryCalls() === 19, 'Ordinary reference consumed adoption factories')
  } finally {
    await reference.unmount()
    ordinary.callUnloaded()
    if (attached) activity.detachReference(native)
    ordinary._tearDownUI(true)
  }
  if (!lease.active) throw new HomeLeaseRetired()
  activity.recordHomeProof(
    JSON.stringify({
      phase: 'parity',
      referenceVisualNodes: 19,
      ordinaryObjectsDistinct: true,
      preRuntimeCompared,
      baselineCompared,
      initialCompared,
      removedCompared,
      restoredCompared,
      referenceDisposed: true,
      hookCalls: factoryCalls(),
      presentationQualified: false,
    }),
  )
}
