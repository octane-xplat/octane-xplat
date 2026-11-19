import '@nativescript/core/globals'
import { Application, ApplicationSettings, Utils } from '@nativescript/core'
import { Scroll } from '@octane-xplat/nativescript-mason-core/scroll'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { setiOSWindow } from '@nativescript/core/application/helpers-common'
import { createNativeScriptRoot, registerElement } from '@octane-xplat/nativescript-octane'
import {
  prepareFirstFrame,
  projectPreparedTree,
  projectVisualTree,
  selectLaunchTree,
} from '@octane-xplat/native-prerender'
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
registerElement('scrollview', Scroll)

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

// The Swift mount resolves the same persisted inputs before engine init plus
// the implicit systemAppearance bind from the OS appearance read;
// re-selecting here must land on the identical bind or the cold mount and
// the live prepared tree would compare different topologies. Absent keys
// resolve to each declaration's default; hasKey keeps an absent key distinct
// from a stored empty string.
const scheme = Application.systemAppearance?.() === 'dark' ? 'dark' : 'light'
const tree = selectLaunchTree(startup, (name) =>
  name === 'systemAppearance'
    ? scheme
    : ApplicationSettings.hasKey(name)
      ? ApplicationSettings.getString(name)
      : null,
)
check(tree, 'Persisted launch inputs selected no startup tree')
const canonicalBind = (bind) =>
  JSON.stringify(
    Object.keys(bind ?? {})
      .sort()
      .map((name) => [name, bind[name]]),
  )
check(
  canonicalBind(tree.bind) === canonicalBind(nativeSnapshot.bind),
  'Live launch bind differs from the mounted tree',
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

function rowsEquivalent(before, after, skipped = new Set(), alphaExempt = new Set()) {
  const differences = []
  const equivalent = (left, right, key, index) => {
    if (key === 'alpha' && alphaExempt.has(index)) return true
    if (key === 'borderRadius') {
      // The borderRadius string is not authoritative on the live side: the
      // driver writes the shared style buffer and leaves the string at its
      // default, so cold can read the authored value or "" while live reads
      // "0". effectiveRadii carries the rendered corners, compared separately.
      const normalize = (value) =>
        value === '' || value === null || value === undefined ? '0' : value
      if (normalize(right) === '0') return true
      left = normalize(left)
      right = normalize(right)
    }
    if (typeof left === 'number' && typeof right === 'number')
      return Math.abs(left - right) <= 0.0001
    if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object')
      return left === right
    const keys = new Set([...Object.keys(left), ...Object.keys(right)])
    return [...keys].every((child) =>
      equivalent(left?.[child], right?.[child], child, index),
    )
  }
  before.forEach((row, index) => {
    // Placeholder rows compare cold box vs live replacement elsewhere.
    if (skipped.has(index)) return
    for (const key of new Set([...Object.keys(row), ...Object.keys(after[index] ?? {})])) {
      const left = row[key],
        right = after[index]?.[key]
      if (!equivalent(left, right, key, index)) {
        differences.push({ index, key, before: left, after: right })
      }
    }
  })
  return differences
}

async function qualify() {
  check(scheme === nativeSnapshot.theme, 'Native/live configured theme differs')

  const visual = projectVisualTree(tree.nodes)
  const placeholderIndexes = new Set(
    visual.flatMap((row, index) => (row.kind === 'placeholder' ? [index] : [])),
  )
  // Hosts whose artifact style carries a baked first-frame motion opacity
  // animate after hydration; their live alpha is legitimately in flight.
  // The cold row's alpha must still equal the baked artifact value — that is
  // what proves the cold mount rendered the same first frame the live
  // prepared tree emitted — so it is asserted separately below.
  const inFlightAlpha = new Map(
    visual.flatMap((row, index) => {
      const baked = row.kind === 'placeholder' ? undefined : row.props?.style?.opacity
      return typeof baked === 'number' ? [[index, baked]] : []
    }),
  )

  const mountViews = mount.views
  const natives = Array.from({ length: mountViews.count }, (_, index) =>
    mountViews.objectAtIndex(index),
  )

  check(mount.root === natives[0], 'Native mount root order differs')
  check(
    natives.length === visual.length,
    'Native count differs from artifact nodes',
  )

  const originalNodes = natives.map((view) =>
    NSCMason.shared.nodeForView(view, view instanceof TNSLabel),
  )
  const originalHandles = originalNodes.map((node) => String(node.nativePtr))

  const context = {}

  const css = sheets.map((sheet) => sheet.css).join('\n')
  const className = 'ns-root ' + (scheme === 'dark' ? 'ns-dark' : 'xds-light')
  const binding = bindIOSMasonTree(tree.nodes, viewport, natives)
  const { host, wrappers, claims } = binding

  // Adopted views keep the cold-mounted frames exactly: overflow is needed
  // only where the cold frame already reaches outside the safe-area guide —
  // on a guide-inset host the clip is what restores the cold frame.
  const safeGuide = window.safeAreaLayoutGuide.layoutFrame
  const overflowsSafeArea = (native) => {
    const frame = native.convertRectToView(native.bounds, window)
    return (
      frame.origin.x < safeGuide.origin.x - 0.5 ||
      frame.origin.y < safeGuide.origin.y - 0.5 ||
      frame.origin.x + frame.size.width > safeGuide.origin.x + safeGuide.size.width + 0.5 ||
      frame.origin.y + frame.size.height > safeGuide.origin.y + safeGuide.size.height + 0.5
    )
  }
  host.iosOverflowSafeArea = overflowsSafeArea(viewport)
  wrappers.forEach(
    (view, index) =>
      view !== null && (view.iosOverflowSafeArea = overflowsSafeArea(natives[index])),
  )

  host.width = viewport.bounds.size.width
  host.height = viewport.bounds.size.height
  host.style.display = 'flex'
  host.style.flexDirection = 'column'
  host.className = className
  host.css = css

  const root = createNativeScriptRoot(host, { createView: claims.createView })
  const prepared = prepareFirstFrame(root, StartupComponent, startup.seed)

  check(prepared.status === 'prepared', 'Startup prepare suspended')

  const projected = projectPreparedTree(prepared.batch.commands).nodes
  if (JSON.stringify(projected) !== JSON.stringify(tree.nodes)) {
    const diffs = []
    for (let index = 0; index < Math.max(projected.length, tree.nodes.length); index++) {
      if (JSON.stringify(projected[index]) !== JSON.stringify(tree.nodes[index])) {
        diffs.push({ index, cold: tree.nodes[index], live: projected[index] })
      }
    }
    check(false, 'Prepared nodes differ: ' + JSON.stringify(diffs.slice(0, 3)))
  }

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
  const motionAlpha = []
  for (const [index, baked] of inFlightAlpha) {
    const coldAlpha = cold[index]?.paint?.alpha
    check(
      typeof coldAlpha === 'number' && Math.abs(coldAlpha - baked) <= 0.0001,
      'Cold alpha differs from baked artifact opacity at ' + visual[index].path,
    )
    motionAlpha.push({
      index,
      path: visual[index].path,
      artifact: baked,
      cold: coldAlpha,
      live: live[index]?.paint?.alpha,
    })
  }
  const differences = rowsEquivalent(
    cold,
    live,
    placeholderIndexes,
    new Set(inFlightAlpha.keys()),
  )

  check(
    differences.length === 0,
    'Cold/live differs: ' + JSON.stringify(differences),
  )

  check(
    visual.every((row, index) =>
      row.kind === 'placeholder'
        ? wrappers[index] === null && natives[index].superview === null
        : wrappers[index].nativeViewProtected === natives[index] &&
          NSCMason.shared.nodeForView(
            natives[index],
            natives[index] instanceof TNSLabel,
          ) === originalNodes[index] &&
          String(originalNodes[index].nativePtr) === originalHandles[index] &&
          wrappers[index].isLoaded &&
          wrappers[index]._context === context,
    ),
    'Adoption replaced native objects or failed Core ownership',
  )

  // Each placeholder's slot must now hold the live host's native view at the
  // cold frame size, with the cold box fully detached. The expected class is
  // keyed on the record's hostKind: activityindicator -> Core's
  // UIActivityIndicatorView, svgview -> the vendored ui-svg SVGKFastImageView,
  // image -> Core's UIImageView.
  const replacementClasses = {
    activityindicator: UIActivityIndicatorView.class(),
    svgview: SVGKFastImageView.class(),
    image: UIImageView.class(),
  }
  const replacements = {}
  for (const index of placeholderIndexes) {
    const row = visual[index]
    const parent = row.parent === null ? mount.root : natives[row.parent]
    const slot = Number(row.path.split('/').pop())
    const replacement = parent.subviews.objectAtIndex(slot)
    replacements[row.hostKind] = String(NSStringFromClass(replacement.class()))
    const expected = replacementClasses[row.hostKind]
    check(
      expected !== undefined && replacement.isKindOfClass(expected),
      'Placeholder replacement class differs: ' +
        row.hostKind +
        ' got ' +
        replacements[row.hostKind],
    )
    check(
      Math.abs(replacement.frame.size.width - cold[index].frame.width) <= 0.5 &&
        Math.abs(replacement.frame.size.height - cold[index].frame.height) <= 0.5,
      'Placeholder replacement size differs',
    )
    check(natives[index].superview === null, 'Placeholder cold native still attached')
  }

  check(
    claims.phase === 'live' &&
      claims.claimedCount + claims.replacedCount === natives.length &&
      claims.factoryCalls === natives.length,
    'Initial claims differ',
  )

  proof({
    phase: 'hydrated',
    coldLiveParity: true,
    nativeIdentityRetained: true,
    masonIdentityRetained: true,
    initialClaims: claims.claimedCount,
    replacedClaims: claims.replacedCount,
    factoryCalls: claims.factoryCalls,
    logicalNodes: tree.nodes.length,
    replacements,
    motionAlpha,
  })

  // Spin the hydration marker now that the live tree owns the screen; the
  // cold mount draws it statically, so rotation marks the hydration seam.
  const spinnerIndex = projectVisualTree(tree.nodes).findIndex(
    (node) => node.props.id === 'hydration-spinner',
  )
  const spinner = spinnerIndex >= 0 ? wrappers[spinnerIndex]?.nativeViewProtected : undefined
  if (spinner) {
    const animation = CABasicAnimation.animationWithKeyPath('transform.rotation.z')
    animation.toValue = Math.PI * 2
    animation.duration = 0.9
    animation.repeatCount = 1e9
    animation.timingFunction = CAMediaTimingFunction.functionWithName(
      kCAMediaTimingFunctionLinear,
    )
    spinner.layer.addAnimationForKey(animation, 'hydration-spin')
  }

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
