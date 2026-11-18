import '@nativescript/core/globals'
import { Application, Utils } from '@nativescript/core'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { bindNativeView } from '@octane-xplat/nativescript-mason-core/adoption'
import { setiOSWindow } from '@nativescript/core/application/helpers-common'
import { createNativeScriptRoot, registerElement } from '@octane-xplat/nativescript-octane'
import { ArtifactError, prepareFirstFrame } from '@octane-xplat/native-prerender'
import {
  bindIOSMasonTree,
  releaseIOSMasonOwners,
  releaseIOSMasonTree,
} from '@octane-xplat/native-prerender/ios/mason-binding'
import { writeProbeDiagnostic } from './write-native-diagnostic.ios.js'
import { StartupComponent } from 'xplat-prerender:component'
import startup from 'xplat-prerender:startup'
import sheets from 'xplat-prerender:styles'
import mode from 'xplat-prerender:mode'

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

function collectOwners(root, owners = new Set()) {
  root.eachChildView((child) => {
    owners.add(child)
    collectOwners(child, owners)
    return true
  })
  return owners
}

function ownersReleased(owners) {
  return [...owners].every(
    (view) => !view.parent && !view._context && !view.nativeViewProtected && !view.isLoaded,
  )
}

// This scenario belongs to KeyedStartup, not to the reusable binding.
async function qualify() {
  check(
    startup.seed.labels?.join(',') === 'One,Two',
    'Expected the maintained keyed startup fixture',
  )

  const scheme = Application.systemAppearance?.() === 'dark' ? 'dark' : 'light'

  check(scheme === nativeSnapshot.theme, 'Native/live configured theme differs')

  const mountViews = mount.views
  const natives = Array.from({ length: mountViews.count }, (_, index) =>
    mountViews.objectAtIndex(index),
  )

  check(mount.root === natives[0], 'Native mount root order differs')

  const originalNodes = natives.map((view) =>
    NSCMason.shared.nodeForView(view, view instanceof TNSLabel),
  )
  const originalHandles = originalNodes.map((node) => String(node.nativePtr))

  const context = {}

  const css = sheets.map((sheet) => sheet.css).join('\n')
  const className = 'ns-root ' + (scheme === 'dark' ? 'ns-dark' : 'xds-light')

  function style(target) {
    target.width = 320
    target.height = 640
    target.style.display = 'flex'
    target.style.flexDirection = 'column'
    target.className = className
    target.css = css
  }

  function layout(target) {
    const width = Utils.layout.toDevicePixels(viewport.bounds.size.width),
      height = Utils.layout.toDevicePixels(viewport.bounds.size.height),
      left = Utils.layout.toDevicePixels(viewport.frame.origin.x),
      top = Utils.layout.toDevicePixels(viewport.frame.origin.y)

    target.measure(
      Utils.layout.makeMeasureSpec(width, Utils.layout.EXACTLY),
      Utils.layout.makeMeasureSpec(height, Utils.layout.EXACTLY),
    )
    target.layout(left, top, left + width, top + height)
  }

  /** Ordinary rendering on a fresh host bound to the same native viewport. */
  async function recoverOrdinarily() {
    const ordinary = new View()

    bindNativeView(ordinary, viewport)
    style(ordinary)
    ordinary._setupAsRootView(context)
    ordinary.callLoaded()

    const reference = createNativeScriptRoot(ordinary)
    const prepared = prepareFirstFrame(reference, StartupComponent, startup.seed)

    check(prepared.status === 'prepared', 'Ordinary configured prepare suspended')
    prepared.commit()

    const native = ordinary.getChildAt(0).nativeViewProtected

    check(
      viewport.subviews.count === 1 &&
        viewport.subviews.objectAtIndex(0) === native &&
        !natives.includes(native),
      'Ordinary recovery did not attach one fresh root',
    )
    check(
      natives.every((view) => view.window === null),
      'Ordinary recovery retained the original native tree',
    )

    await settle()
    layout(ordinary)

    check(
      natives.every((view) => view.window === null) &&
        native.frame.size.width > 0 &&
        native.frame.size.height > 0,
      'Ordinary recovery geometry missing',
    )

    return { ordinary, reference }
  }

  async function disposeOrdinary(ordinary, reference) {
    const owners = collectOwners(ordinary)

    await Promise.resolve(reference.unmount())
    if (ordinary.isLoaded) {
      ordinary.callUnloaded()
    }

    if (ordinary._context) {
      ordinary._tearDownUI(true)
    }

    releaseIOSMasonTree(ordinary, [...owners])
    releaseIOSMasonOwners(ordinary, [...owners])
    check(
      ordinary.getChildrenCount() === 0 && ownersReleased(owners),
      'Ordinary reference retained owners',
    )
    return owners
  }

  if (mode === 'seed-mismatch') {
    const binding = bindIOSMasonTree(startup.nodes, viewport, natives)
    const { host, claims } = binding

    const root = createNativeScriptRoot(host, { createView: claims.createView })
    const prepared = prepareFirstFrame(root, StartupComponent, {
      ...startup.seed,
      labels: ['One', 'Changed'],
    })

    check(prepared.status === 'prepared', 'Mismatched seed prepare suspended')

    let rejection = null
    try {
      claims.match(prepared.batch.commands)
    } catch (error) {
      rejection = error
    }

    check(
      rejection instanceof ArtifactError && claims.phase === 'rejected',
      'Mismatched seed was not rejected as an artifact mismatch',
    )
    prepared.abort()
    check(
      claims.factoryCalls === 0 && claims.claimedCount === 0 && claims.pendingCount === 0,
      'Rejected plan consumed claims',
    )
    check(
      host.getChildrenCount() === 0 && natives.every((view) => view.window === window),
      'Rejected plan mutated the native tree',
    )

    binding.retire()
    check(claims.phase === 'retired', 'Rejected binding did not retire')

    viewport.removeView(mount.root)
    check(
      viewport.subviews.count === 0 && natives.every((view) => view.window === null),
      'Rejected mount left native views attached',
    )

    proof({
      phase: 'plan-rejected',
      claimsPhase: claims.phase,
      factoryCalls: claims.factoryCalls,
      attachedNatives: viewport.subviews.count,
    })

    const { ordinary, reference } = await recoverOrdinarily()

    proof({ phase: 'recovered', ordinaryRender: true, originalDetached: true })

    const owners = await disposeOrdinary(ordinary, reference)
    proof({
      phase: 'disposed',
      claimPhase: claims.phase,
      ownersReleased: owners.size,
      viewportSubviews: viewport.subviews.count,
    })
    return
  }

  const injected = new Error('Injected native attachment failure')
  let attachmentCalls = 0

  const binding = bindIOSMasonTree(startup.nodes, viewport, natives, {
    beforeAttach(count) {
      attachmentCalls = count
      if (mode === 'attach-failure' && count === 3) {
        throw injected
      }
    },
  })
  const { host, wrappers, claims } = binding

  style(host)

  const root = createNativeScriptRoot(host, { createView: claims.createView })
  const abort = prepareFirstFrame(root, StartupComponent, startup.seed)

  check(abort.status === 'prepared', 'Configured prepare suspended')
  abort.abort()
  check(
    claims.factoryCalls === 0 &&
      host.getChildrenCount() === 0 &&
      wrappers.every((view) => !view.parent),
    'Aborted prepare claimed views',
  )

  const prepared = prepareFirstFrame(root, StartupComponent, startup.seed)

  check(prepared.status === 'prepared', 'Configured prepare suspended')
  claims.match(prepared.batch.commands)
  host._setupAsRootView(context)
  host.callLoaded()
  mount.restoreDefaults()

  if (mode === 'attach-failure') {
    let failure = null
    try {
      binding.commit(() => {
        prepared.commit()
      })
    } catch (error) {
      failure = error
    }

    check(failure === injected, 'Injected attachment failure did not propagate')
    check(claims.phase === 'failed', 'Failed commit did not mark the claim scope')
    check(attachmentCalls === 3, 'Attachment injection ran an unexpected count')

    proof({
      phase: 'claim-failure',
      attachmentCalls,
      factoryCalls: claims.factoryCalls,
      claimsPhase: claims.phase,
    })

    let unmountError = null
    await Promise.resolve(root.unmount()).catch((error) => {
      unmountError = String(error)
    })
    if (host.isLoaded) {
      host.callUnloaded()
    }

    if (host._context) {
      host._tearDownUI(true)
    }

    releaseIOSMasonTree(host, wrappers)
    binding.retire()
    check(
      host.getChildrenCount() === 0 &&
        ownersReleased(wrappers) &&
        ![host, ...wrappers].some((view) => view._masonPendingAdds),
      'Failed adoption left owners or pending native adds behind',
    )
    check(
      viewport.subviews.count === 0 && natives.every((view) => view.window === null),
      'Failed adoption left native views attached',
    )

    proof({
      phase: 'failed-adoption-disposed',
      ownersReleased: wrappers.length,
      pendingAddsCleared: true,
      unmountError,
      claimPhase: claims.phase,
    })

    const { ordinary, reference } = await recoverOrdinarily()

    proof({ phase: 'recovered', ordinaryRender: true, originalDetached: true })

    const owners = await disposeOrdinary(ordinary, reference)
    proof({
      phase: 'disposed',
      claimPhase: claims.phase,
      ownersReleased: owners.size,
      viewportSubviews: viewport.subviews.count,
    })
    return
  }

  check(mode === 'adopt', 'Unknown mount control mode: ' + mode)

  binding.commit(() => {
    prepared.commit()
  })

  layout(host)
  await settle()
  layout(host)

  const cold = nativeSnapshot.rows
  const live = snapshotJson(mount.root)
  const differences = rowsEquivalent(cold, live)

  check(
    differences.length === 0,
    'Configured cold/live differs: ' + JSON.stringify(differences),
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
    'Configured adoption replaced native objects or failed Core ownership',
  )

  check(
    claims.phase === 'live' &&
      claims.claimedCount === natives.length &&
      claims.factoryCalls === natives.length,
    'Configured initial claims differ',
  )

  const container = wrappers[0],
    title = wrappers[1],
    one = wrappers[2],
    two = wrappers[3]

  const all = new Set(wrappers)
  const snapshot = (labels, parent = container, heading = title, owners = all) => {
    const children = Array.from({ length: parent.getChildrenCount() }, (_, index) =>
      parent.getChildAt(index),
    )

    check(
      children[0] === heading && children.length === labels.length + 1,
      'Configured live child count differs',
    )

    check(
      children.slice(1).every((view, index) => String(view.text) === labels[index]),
      'Configured live text order differs',
    )

    const native = parent.nativeViewProtected,
      node = NSCMason.shared.nodeForView(native, false)

    check(
      native.subviews.count === children.length && node.getChildren().count === children.length,
      'Configured native/Mason count differs',
    )

    children.forEach((view, index) => {
      owners.add(view)
      const childNative = view.nativeViewProtected,
        childNode = NSCMason.shared.nodeForView(childNative, childNative instanceof TNSLabel)
      check(
        view.parent === parent &&
          view._context === context &&
          view.isLoaded &&
          native.subviews.objectAtIndex(index) === childNative &&
          node.getChildren().objectAtIndex(index) === childNode &&
          childNative.frame.size.width > 0 &&
          childNative.frame.size.height > 0,
        'Configured native/Mason child order, ownership or geometry differs',
      )
    })

    return children
  }

  const seen = new Map()
  let sequence = 0
  const identityOf = (object) => {
    if (!seen.has(object)) seen.set(object, ++sequence)
    return seen.get(object)
  }
  const identity = (view) => {
    const native = view.nativeViewProtected,
      node = NSCMason.shared.nodeForView(native, native instanceof TNSLabel)
    return {
      owner: view._domId,
      native: identityOf(native),
      mason: identityOf(node),
      handle: String(node.nativePtr),
      text: String(view.text),
    }
  }

  const record = (phase, labels, fields = {}) =>
    proof({
      phase,
      labels,
      children: snapshot(labels).map(identity),
      factoryCalls: claims.factoryCalls,
      initialClaims: claims.claimedCount,
      ...fields,
    })

  // An ordinary, invisible sibling in the same window proves adopted and
  // ordinary keyed lifetimes match move for move.
  const referenceViewport = NSCMason.shared.createView()
  referenceViewport.style.display = MasonDisplay.Flex
  referenceViewport.hidden = true
  viewport.superview.addSubview(referenceViewport)

  const referenceHost = new View()
  bindNativeView(referenceHost, referenceViewport)
  style(referenceHost)
  referenceHost._setupAsRootView(context)
  referenceHost.callLoaded()

  const reference = createNativeScriptRoot(referenceHost)
  const referencePrepared = prepareFirstFrame(reference, StartupComponent, startup.seed)

  check(referencePrepared.status === 'prepared', 'Ordinary configured prepare suspended')
  referencePrepared.commit()

  const referenceRoot = referenceHost.getChildAt(0)

  await settle()
  layout(referenceHost)

  const referenceRows = snapshotJson(referenceRoot.nativeViewProtected)
  const referenceDifferences = rowsEquivalent(live, referenceRows)

  check(
    referenceDifferences.length === 0,
    'Configured ordinary reference differs: ' + JSON.stringify(referenceDifferences),
  )

  const referenceContainer = referenceRoot,
    referenceTitle = referenceContainer.getChildAt(0)

  const referenceOwners = new Set([referenceContainer])
  const referenceSnapshot = (labels) =>
    snapshot(labels, referenceContainer, referenceTitle, referenceOwners)

  let previousLabels = ['One', 'Two'],
    lastTransitions

  record('hydrated', previousLabels, {
    logicalNodes: startup.nodes.length,
    coldLiveParity: true,
    ordinaryInitialParity: true,
    nativeIdentityRetained: true,
    masonIdentityRetained: true,
    prepareAbortMutationFree: true,
  })

  async function update(labels) {
    const before = snapshot(previousLabels).slice(1).map(identity)
    const beforeReference = referenceSnapshot(previousLabels).slice(1).map(identity)
    const props = { ...startup.seed, title: 'Updated screen', labels }

    for (const target of [root, reference]) {
      const next = prepareFirstFrame(target, StartupComponent, props)

      check(next.status === 'prepared', 'Configured update suspended')
      next.commit()
    }

    await settle()
    layout(host)
    layout(referenceHost)
    check(
      String(title.text) === 'iOS: Updated screen' &&
        String(referenceTitle.text) === String(title.text),
      'Configured title did not update',
    )

    const children = snapshot(labels),
      referenceChildren = referenceSnapshot(labels)

    const after = children.slice(1).map(identity),
      afterReference = referenceChildren.slice(1).map(identity)

    lastTransitions = before.flatMap((old, index) => {
      const position = labels.indexOf(old.text)

      if (position < 0) {
        return []
      }

      const current = after[position],
        oldReference = beforeReference[index],
        currentReference = afterReference[position]

      check(
        current.owner === old.owner && currentReference.owner === oldReference.owner,
        'Keyed logical owner replaced',
      )

      const retained = {}

      for (const key of ['native', 'mason', 'handle']) {
        retained[key] = current[key] === old[key]
        check(
          retained[key] === (currentReference[key] === oldReference[key]),
          'Adopted move differs from ordinary native lifetime: ' + old.text + '/' + key,
        )
      }

      return [{ label: old.text, retained }]
    })

    previousLabels = labels
    return children
  }

  let children = await update(['Two', 'One', 'Three'])
  const three = children[3]

  check(
    children[1] === two && children[2] === one && !natives.includes(three.nativeViewProtected),
    'Keyed reorder replaced adopted logical owners or reused an initial native factory',
  )

  record('reordered-added', previousLabels, {
    adoptedOwnersRetained: true,
    ordinaryCreation: true,
    ordinaryMoveParity: true,
    transitions: lastTransitions,
  })

  children = await update(['Three', 'Two'])
  check(
    children[1] === three &&
      children[2] === two &&
      !one.parent &&
      !one._context &&
      !one.nativeViewProtected,
    'Keyed removal retained ownership or replaced surviving children',
  )

  record('removed', previousLabels, {
    removedOwnerReleased: true,
    ordinaryMoveParity: true,
    transitions: lastTransitions,
  })

  children = await update(['One', 'Three', 'Two'])
  check(
    children[1] !== one &&
      children[1].nativeViewProtected !== natives[2] &&
      children[2] === three &&
      children[3] === two,
    'Recreated key replayed an adopted native factory',
  )

  record('recreated', previousLabels, {
    removedKeyCreatedOrdinarily: true,
    ordinaryMoveParity: true,
    transitions: lastTransitions,
  })

  const owners = collectOwners(referenceHost)
  await Promise.resolve(reference.unmount())
  referenceViewport.removeFromSuperview()
  if (referenceHost.isLoaded) {
    referenceHost.callUnloaded()
  }

  if (referenceHost._context) {
    referenceHost._tearDownUI(true)
  }

  releaseIOSMasonTree(referenceHost, [...owners])
  releaseIOSMasonOwners(referenceHost, [...owners])
  check(
    referenceHost.getChildrenCount() === 0 && ownersReleased(owners),
    'Ordinary reference retained owners',
  )

  await Promise.resolve(root.unmount())
  if (host.isLoaded) {
    host.callUnloaded()
  }

  if (host._context) {
    host._tearDownUI(true)
  }

  releaseIOSMasonTree(host, [...all])
  binding.retire()
  check(
    host.getChildrenCount() === 0 && ownersReleased(all) && viewport.subviews.count === 0,
    'Configured disposal retained owners',
  )

  proof({
    phase: 'disposed',
    ownersReleased: all.size,
    referenceOwnersReleased: owners.size,
    nativeHandlesCleared: true,
    contextsCleared: true,
    logicalParentsCleared: true,
    claimPhase: claims.phase,
  })
}

setiOSWindow(window)
setTimeout(() => {
  qualify().catch(reportFailure)
}, 0)
