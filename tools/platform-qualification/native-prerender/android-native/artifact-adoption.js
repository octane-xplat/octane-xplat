import '@nativescript/core/globals'
import { Application, Utils } from '@nativescript/core'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { createNativeScriptRoot, registerElement } from '@octane-xplat/nativescript-octane'
import {
  bindAndroidMasonTree,
  releaseAndroidMasonOwners,
  releaseAndroidMasonTree,
} from '../../../../packages/native-prerender/platforms/android/mason-binding.android.js'

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

// This scenario belongs to KeyedStartup, not to the reusable binding.
async function qualify(activity) {
  check(
    startup.seed.labels?.join(',') === 'One,Two',
    'Expected the maintained keyed startup fixture',
  )

  if (!Application.android.nativeApp) {
    Application.android.init(activity.getApplication())
  }

  const scheme = Application.systemAppearance() === 'dark' ? 'dark' : 'light'

  check(scheme === activity.getMountTheme(), 'Native/live configured theme differs')

  const natives = Array.from({ length: activity.getViewCount() }, (_, index) =>
    activity.getView(index),
  )

  const mason = org.nativescript.mason.masonkit.Mason.Companion.getShared()
  const originalNodes = natives.map((view) => mason.nodeForView(view))
  const originalHandles = originalNodes.map((node) => String(node.getNativePtr()))
  const binding = bindAndroidMasonTree(startup.nodes, activity.getViewport(), natives)
  const { host, wrappers, claims } = binding

  host.width = 320
  host.height = 640
  host.style.display = 'flex'
  host.style.flexDirection = 'column'
  host.className = 'ns-root ' + (scheme === 'dark' ? 'ns-dark' : 'xds-light')
  host.css = sheets.map((sheet) => sheet.css).join('\n')

  const root = createNativeScriptRoot(host, { createView: claims.createView })
  const abort = root.prepare(StartupComponent, startup.seed)

  check(abort.status === 'prepared', 'Configured prepare suspended')
  abort.abort()
  check(claims.factoryCalls === 0 && host.getChildrenCount() === 0, 'Aborted prepare claimed views')

  const prepared = root.prepare(StartupComponent, startup.seed)

  check(prepared.status === 'prepared', 'Configured prepare suspended')
  claims.match(prepared.batch.commands)
  host._setupAsRootView(activity)
  host.callLoaded()
  activity.restoreDefaults()
  binding.commit(() => {
    prepared.commit()
  })

  function layout(target = host) {
    const native = activity.getViewport()
    const width = native.getWidth(),
      height = native.getHeight(),
      left = native.getLeft(),
      top = native.getTop()

    target.measure(
      Utils.layout.makeMeasureSpec(width, Utils.layout.EXACTLY),
      Utils.layout.makeMeasureSpec(height, Utils.layout.EXACTLY),
    )

    target.layout(left, top, left + width, top + height)
  }

  layout()
  await settle()
  layout()

  const cold = JSON.parse(String(activity.snapshotCold()))
  const live = JSON.parse(String(activity.snapshotMounted()))
  const differences = []

  cold.forEach((row, index) => {
    for (const key of new Set([...Object.keys(row), ...Object.keys(live[index])])) {
      const a = row[key],
        b = live[index][key]

      if (!(typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= 0.0001 : a === b)) {
        differences.push({ index, key, cold: a, live: b })
      }
    }
  })

  check(differences.length === 0, 'Configured cold/live differs: ' + JSON.stringify(differences))
  activity.checkInitialIdentities()
  check(
    wrappers.every(
      (view, index) =>
        view.nativeViewProtected === natives[index] &&
        mason.nodeForView(natives[index]) === originalNodes[index] &&
        String(originalNodes[index].getNativePtr()) === originalHandles[index] &&
        view.isLoaded &&
        view._context === activity,
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
      node = mason.nodeForView(native)

    check(
      native.getChildCount() === children.length && node.getChildCount() === children.length,
      'Configured native/Mason count differs',
    )

    children.forEach((view, index) => {
      owners.add(view)
      check(
        view.parent === parent &&
          view._context === activity &&
          view.isLoaded &&
          native.getChildAt(index) === view.nativeViewProtected &&
          node.getChildAt(index) === mason.nodeForView(view.nativeViewProtected) &&
          view.nativeViewProtected.getWidth() > 0 &&
          view.nativeViewProtected.getHeight() > 0,
        'Configured native/Mason child order, ownership or geometry differs',
      )
    })

    return children
  }

  const identity = (view) => ({
    owner: view._domId,
    native: java.lang.System.identityHashCode(view.nativeViewProtected),
    mason: java.lang.System.identityHashCode(mason.nodeForView(view.nativeViewProtected)),
    handle: String(mason.nodeForView(view.nativeViewProtected).getNativePtr()),
    text: String(view.text),
  })

  const proof = (phase, labels, fields = {}) =>
    activity.recordProof(
      JSON.stringify({
        phase,
        labels,
        children: snapshot(labels).map(identity),
        factoryCalls: claims.factoryCalls,
        initialClaims: claims.claimedCount,
        ...fields,
      }),
    )

  const ordinary = new View()

  ordinary.width = 320
  ordinary.height = 640
  ordinary.style.display = 'flex'
  ordinary.style.flexDirection = 'column'
  ordinary.className = host.className
  ordinary.css = host.css
  ordinary._setupAsRootView(activity)
  ordinary.callLoaded()

  const reference = createNativeScriptRoot(ordinary)
  const referencePrepared = reference.prepare(StartupComponent, startup.seed)

  check(referencePrepared.status === 'prepared', 'Ordinary configured prepare suspended')
  referencePrepared.commit()

  const referenceNative = ordinary.nativeViewProtected

  referenceNative.setVisibility(android.view.View.INVISIBLE)

  const nativeParent = activity.getViewport().getParent()

  nativeParent.addView(
    referenceNative,
    new android.widget.FrameLayout.LayoutParams(
      activity.getViewport().getWidth(),
      activity.getViewport().getHeight(),
    ),
  )

  await settle()
  layout(ordinary)

  const referenceRows = JSON.parse(String(activity.snapshotReference(referenceNative)))
  const referenceDifferences = []

  live.forEach((row, index) => {
    for (const key of Object.keys(row)) {
      const a = row[key],
        b = referenceRows[index][key]

      if (!(typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= 0.0001 : a === b)) {
        referenceDifferences.push({ index, key, live: a, ordinary: b })
      }
    }
  })

  check(
    referenceDifferences.length === 0,
    'Configured ordinary reference differs: ' + JSON.stringify(referenceDifferences),
  )

  const referenceContainer = ordinary.getChildAt(0),
    referenceTitle = referenceContainer.getChildAt(0)

  const referenceOwners = new Set([referenceContainer])
  const referenceSnapshot = (labels) =>
    snapshot(labels, referenceContainer, referenceTitle, referenceOwners)

  let previousLabels = ['One', 'Two'],
    lastTransitions

  proof('hydrated', previousLabels, {
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
      const next = target.prepare(StartupComponent, props)

      check(next.status === 'prepared', 'Configured update suspended')
      next.commit()
    }

    await settle()
    layout()
    layout(ordinary)
    check(
      title.text === 'Android: Updated screen' && referenceTitle.text === title.text,
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

  proof('reordered-added', previousLabels, {
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

  proof('removed', previousLabels, {
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

  proof('recreated', previousLabels, {
    removedKeyCreatedOrdinarily: true,
    ordinaryMoveParity: true,
    transitions: lastTransitions,
  })

  await reference.unmount()
  nativeParent.removeView(referenceNative)
  if (ordinary.isLoaded) {
    ordinary.callUnloaded()
  }

  if (ordinary._context) {
    ordinary._tearDownUI(true)
  }

  releaseAndroidMasonTree(ordinary, [...referenceOwners])
  releaseAndroidMasonOwners(ordinary, [...referenceOwners])
  check(
    ordinary.getChildrenCount() === 0 &&
      [...referenceOwners].every(
        (view) => !view.parent && !view._context && !view.nativeViewProtected && !view.isLoaded,
      ),
    'Ordinary reference retained owners',
  )

  await root.unmount()
  if (host.isLoaded) {
    host.callUnloaded()
  }

  if (host._context) {
    host._tearDownUI(true)
  }

  releaseAndroidMasonTree(host, [...all])
  binding.retire()
  check(
    host.getChildrenCount() === 0 &&
      [...all].every(
        (view) => !view.parent && !view._context && !view.nativeViewProtected && !view.isLoaded,
      ),
    'Configured disposal retained owners',
  )

  activity.recordProof(
    JSON.stringify({
      phase: 'disposed',
      ownersReleased: all.size,
      referenceOwnersReleased: referenceOwners.size,
      nativeHandlesCleared: true,
      contextsCleared: true,
      logicalParentsCleared: true,
      claimPhase: claims.phase,
    }),
  )

  activity.completeAdoption()
}

org.octanexplat.prerenderandroid.MasonMountActivity.installBridge(
  new org.octanexplat.prerenderandroid.MasonMountActivity.Bridge({
    onActivity(activity) {
      qualify(activity).catch((error) =>
        activity.recordProof(
          JSON.stringify({ phase: 'failed', error: String(error), stack: error?.stack }),
        ),
      )
    },
  }),
)
