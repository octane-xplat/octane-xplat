import '@nativescript/core/globals'
import { Application, Utils } from '@nativescript/core'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { setiOSWindow } from '@nativescript/core/application/helpers-common'
import { createNativeScriptRoot, registerElement } from '@octane-xplat/nativescript-octane'
import { projectVisualTree } from '@octane-xplat/native-prerender'
import { bindIOSMasonTree } from '@octane-xplat/native-prerender/ios/mason-binding'
import { writeProbeDiagnostic } from './write-native-diagnostic.ios.js'
import { StartupComponent } from 'xplat-prerender:component'
import startup from 'xplat-prerender:startup'
import sheets from 'xplat-prerender:styles'

const check = (value, reason) => {
  if (!value) {
    throw new Error(reason)
  }
}

const settle = () => new Promise((done) => setTimeout(done, 50))

registerElement('masonview', View)

const proofs = []

function proof(entry) {
  proofs.push(entry)
  writeProbeDiagnostic('artifact-proofs.json', JSON.stringify(proofs))
}

function reportFailure(error) {
  try {
    proof({ phase: 'failed', error: String(error), stack: error?.stack })
  } finally {
    writeProbeDiagnostic('entry-error.txt', String(error?.stack ?? error))
  }
}

const scene = UIApplication.sharedApplication.connectedScenes.allObjects.objectAtIndex(0)
const window = scene.windows.objectAtIndex(0)
const mount = PrerenderMountHost.mount
const viewport = PrerenderMountHost.viewport

const nativeSnapshot = JSON.parse(
  String(
    NSString.stringWithContentsOfFileEncodingError(
      NSHomeDirectory() + '/Documents/native-mount.json',
      4,
      null,
    ),
  ),
)

function snapshotJson(root) {
  return JSON.parse(
    String(
      NSString.alloc().initWithDataEncoding(
        NSJSONSerialization.dataWithJSONObjectOptionsError(
          PrerenderHomeMount.snapshot(root),
          0,
          null,
        ),
        4,
      ),
    ),
  )
}

function rowsEquivalent(before, after) {
  const differences = []
  const equivalent = (left, right, key) => {
    if (key === 'borderRadius') {
      const normalize = (value) =>
        value === '' || value === null || value === undefined ? '0' : value
      left = normalize(left)
      right = normalize(right)
    }
    if (typeof left === 'number' && typeof right === 'number')
      return Math.abs(left - right) <= 0.0001
    if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object')
      return left === right
    const keys = new Set([...Object.keys(left), ...Object.keys(right)])
    return [...keys].every((child) => equivalent(left?.[child], right?.[child], child))
  }
  before.forEach((row, index) => {
    for (const key of new Set([...Object.keys(row), ...Object.keys(after[index] ?? {})])) {
      const left = row[key],
        right = after[index]?.[key]
      if (!equivalent(left, right, key)) {
        differences.push({ index, key, before: left, after: right })
      }
    }
  })
  return differences
}

async function qualify() {
  const scheme = Application.systemAppearance?.() === 'dark' ? 'dark' : 'light'

  check(scheme === nativeSnapshot.theme, 'Native/live configured theme differs')

  const mountViews = mount.views
  const natives = Array.from({ length: mountViews.count }, (_, index) =>
    mountViews.objectAtIndex(index),
  )

  check(mount.root === natives[0], 'Native mount root order differs')
  check(
    natives.length === projectVisualTree(startup.nodes).length,
    'Native count differs from artifact nodes',
  )

  const originalNodes = natives.map((view) =>
    NSCMason.shared.nodeForView(view, view instanceof TNSLabel),
  )
  const originalHandles = originalNodes.map((node) => String(node.nativePtr))

  const context = {}

  const css = sheets.map((sheet) => sheet.css).join('\n')
  const className = 'ns-root ' + (scheme === 'dark' ? 'ns-dark' : 'xds-light')

  const binding = bindIOSMasonTree(startup.nodes, viewport, natives)
  const { host, wrappers, claims } = binding

  host.width = viewport.bounds.size.width
  host.height = viewport.bounds.size.height
  host.style.display = 'flex'
  host.style.flexDirection = 'column'
  host.className = className
  host.css = css

  const root = createNativeScriptRoot(host, { createView: claims.createView })
  const prepared = root.prepare(StartupComponent, startup.seed)

  check(prepared.status === 'prepared', 'Startup prepare suspended')
  claims.match(prepared.batch.commands)
  host._setupAsRootView(context)
  host.callLoaded()
  mount.restoreDefaults()

  binding.commit(() => {
    prepared.commit()
  })

  const layout = () => {
    const width = Utils.layout.toDevicePixels(viewport.bounds.size.width),
      height = Utils.layout.toDevicePixels(viewport.bounds.size.height),
      left = Utils.layout.toDevicePixels(viewport.frame.origin.x),
      top = Utils.layout.toDevicePixels(viewport.frame.origin.y)

    host.measure(
      Utils.layout.makeMeasureSpec(width, Utils.layout.EXACTLY),
      Utils.layout.makeMeasureSpec(height, Utils.layout.EXACTLY),
    )
    host.layout(left, top, left + width, top + height)
  }

  layout()
  await settle()
  layout()

  const cold = nativeSnapshot.rows
  const live = snapshotJson(mount.root)
  const differences = rowsEquivalent(cold, live)

  check(
    differences.length === 0,
    'Cold/live differs: ' + JSON.stringify(differences),
  )

  check(
    wrappers.every(
      (view, index) =>
        view.nativeViewProtected === natives[index] &&
        NSCMason.shared.nodeForView(
          natives[index],
          natives[index] instanceof TNSLabel,
        ) === originalNodes[index] &&
        String(originalNodes[index].nativePtr) === originalHandles[index] &&
        view.isLoaded &&
        view._context === context,
    ),
    'Adoption replaced native objects or failed Core ownership',
  )

  check(
    claims.phase === 'live' &&
      claims.claimedCount === natives.length &&
      claims.factoryCalls === natives.length,
    'Initial claims differ',
  )

  proof({
    phase: 'hydrated',
    coldLiveParity: true,
    nativeIdentityRetained: true,
    masonIdentityRetained: true,
    initialClaims: claims.claimedCount,
    factoryCalls: claims.factoryCalls,
    logicalNodes: startup.nodes.length,
  })

  // The hydrated tree stays on screen so the cold-to-live transition can be
  // evaluated visually; the runner leaves the app and device running.
  proof({
    phase: 'presented',
    visualNodes: natives.length,
    viewportSubviews: viewport.subviews.count,
    claimPhase: claims.phase,
  })
}

setiOSWindow(window)
setTimeout(() => {
  qualify().catch(reportFailure)
}, 0)
