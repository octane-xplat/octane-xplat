import '@nativescript/core/globals'
import { Application, Utils } from '@nativescript/core'
import { Scroll } from '@octane-xplat/nativescript-mason-core/scroll'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { createNativeScriptRoot, registerElement } from '@octane-xplat/nativescript-octane'
import {
  prepareFirstFrame,
  projectPreparedTree,
  projectVisualTree,
} from '@octane-xplat/native-prerender'
import { bindAndroidMasonTree } from '@octane-xplat/native-prerender/android/mason-binding'

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

async function qualify(activity) {
  if (!Application.android.nativeApp) {
    Application.android.init(activity.getApplication())
  }

  const scheme = Application.systemAppearance() === 'dark' ? 'dark' : 'light'

  check(scheme === activity.getMountTheme(), 'Native/live configured theme differs')

  const visual = projectVisualTree(startup.nodes)
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

  const natives = Array.from({ length: activity.getViewCount() }, (_, index) =>
    activity.getView(index),
  )

  check(
    natives.length === visual.length,
    'Native count differs from artifact nodes',
  )

  const mason = org.nativescript.mason.masonkit.Mason.Companion.getShared()
  const originalNodes = natives.map((view) => mason.nodeForView(view))
  const originalHandles = originalNodes.map((node) => String(node.getNativePtr()))
  const binding = bindAndroidMasonTree(startup.nodes, activity.getViewport(), natives)
  const { host, wrappers, claims } = binding

  const viewport = activity.getViewport()
  host.width = Utils.layout.toDeviceIndependentPixels(viewport.getWidth())
  host.height = Utils.layout.toDeviceIndependentPixels(viewport.getHeight())
  host.style.display = 'flex'
  host.style.flexDirection = 'column'
  host.className = 'ns-root ' + (scheme === 'dark' ? 'ns-dark' : 'xds-light')
  host.css = sheets.map((sheet) => sheet.css).join('\n')

  const root = createNativeScriptRoot(host, { createView: claims.createView })
  const prepared = prepareFirstFrame(root, StartupComponent, startup.seed)

  check(prepared.status === 'prepared', 'Startup prepare suspended')

  const projected = projectPreparedTree(prepared.batch.commands).nodes
  if (JSON.stringify(projected) !== JSON.stringify(startup.nodes)) {
    const diffs = []
    for (let index = 0; index < Math.max(projected.length, startup.nodes.length); index++) {
      if (JSON.stringify(projected[index]) !== JSON.stringify(startup.nodes[index])) {
        diffs.push({ index, cold: startup.nodes[index], live: projected[index] })
      }
    }
    check(false, 'Prepared nodes differ: ' + JSON.stringify(diffs.slice(0, 3)))
  }

  claims.match(prepared.batch.commands)
  host._setupAsRootView(activity)
  host.callLoaded()
  activity.restoreDefaults()
  try {
    binding.commit(() => {
      prepared.commit()
    })
  } catch (error) {
    const dump = visual.map((row, index) => {
      const parent = row.parent === null ? viewport : natives[row.parent]
      const children = []
      for (let i = 0; i < parent.getChildCount(); i++) {
        const child = parent.getChildAt(i)
        children.push({
          slot: i,
          class: String(child.getClass().getName()),
          isNative: natives.indexOf(child),
        })
      }
      let placeholder
      if (row.kind === 'placeholder') {
        const box = natives[index]
        const boxNode = mason.nodeForView(box)
        const parentNode = mason.nodeForView(parent)
        placeholder = {
          boxParentView: String(box.getParent()?.getClass()?.getName()),
          boxNodeParentIsParentNode: boxNode.getParent() === parentNode,
          boxNodeLayoutParentIsParentNode: boxNode.getLayoutParent() === parentNode,
          boxNodeAnonymous: boxNode.isAnonymous(),
          parentNodeChildren: parentNode.getChildren().indexOf(boxNode),
        }
      }
      return { index, kind: row.kind, children, placeholder }
    })
    check(false, 'Commit failed: ' + String(error) + ' TREE ' + JSON.stringify(dump))
    throw error
  }

  function layout() {
    const width = viewport.getWidth(),
      height = viewport.getHeight(),
      left = viewport.getLeft(),
      top = viewport.getTop()

    host.measure(
      Utils.layout.makeMeasureSpec(width, Utils.layout.EXACTLY),
      Utils.layout.makeMeasureSpec(height, Utils.layout.EXACTLY),
    )

    host.layout(left, top, left + width, top + height)
  }

  layout()
  await settle()
  layout()

  const cold = JSON.parse(String(activity.snapshotCold()))
  const live = JSON.parse(String(activity.snapshotMounted()))
  const differences = []
  const motionAlpha = []

  for (const [index, baked] of inFlightAlpha) {
    check(
      typeof cold[index]?.alpha === 'number' &&
        Math.abs(cold[index].alpha - baked) <= 0.0001,
      'Cold alpha differs from baked artifact opacity at ' + visual[index].path,
    )
    motionAlpha.push({
      index,
      path: visual[index].path,
      artifact: baked,
      cold: cold[index]?.alpha,
      live: live[index]?.alpha,
    })
  }

  cold.forEach((row, index) => {
    // Placeholder rows compare cold box vs live replacement below.
    if (placeholderIndexes.has(index)) return
    for (const key of new Set([...Object.keys(row), ...Object.keys(live[index])])) {
      // The in-flight motion row's live alpha moves after hydration.
      if (key === 'alpha' && inFlightAlpha.has(index)) continue
      const a = row[key],
        b = live[index][key]

      if (!(typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= 0.0001 : a === b)) {
        differences.push({ index, key, cold: a, live: b })
      }
    }
  })

  check(differences.length === 0, 'Cold/live differs: ' + JSON.stringify(differences))
  activity.checkInitialIdentities()
  check(
    visual.every((row, index) =>
      row.kind === 'placeholder'
        ? wrappers[index] === null && natives[index].getParent() === null
        : wrappers[index].nativeViewProtected === natives[index] &&
          mason.nodeForView(natives[index]) === originalNodes[index] &&
          String(originalNodes[index].getNativePtr()) === originalHandles[index] &&
          wrappers[index].isLoaded &&
          wrappers[index]._context === activity,
    ),
    'Adoption replaced native objects or failed Core ownership',
  )

  // Each placeholder's slot must now hold the live host's native view at the
  // cold frame size, with the cold box fully detached. The expected class is
  // keyed on the record's hostKind: activityindicator -> Core's ProgressBar;
  // svgview -> the vendored ui-svg MySVGViewCtor, a runtime-generated
  // android.view.View.extend subclass. The generated name embeds the extend
  // call site (android.view.View_<file>_<line>_<col>_, or
  // com.tns.gen.android.view.View_* on older runtimes); only the prefix is
  // stable across bundles. image -> Core's org.nativescript.widgets.ImageView.
  const replacementClasses = {
    activityindicator: (view) => view instanceof android.widget.ProgressBar,
    svgview: (view) => {
      const name = String(view.getClass().getName())
      return name.startsWith('android.view.View_') || name.startsWith('com.tns.gen.android.view.View')
    },
    image: (view) => view instanceof org.nativescript.widgets.ImageView,
  }
  const replacements = {}
  for (const index of placeholderIndexes) {
    const row = visual[index]
    const parent = row.parent === null ? viewport : natives[row.parent]
    const slot = Number(row.path.split('/').pop())
    const replacement = parent.getChildAt(slot)
    replacements[row.hostKind] = String(replacement.getClass().getName())
    const expected = replacementClasses[row.hostKind]
    check(
      expected !== undefined && expected(replacement),
      'Placeholder replacement class differs: ' +
        row.hostKind +
        ' got ' +
        replacements[row.hostKind],
    )
    check(
      Math.abs(replacement.getWidth() - cold[index].width) <= 1 &&
        Math.abs(replacement.getHeight() - cold[index].height) <= 1,
      'Placeholder replacement size differs',
    )
    check(natives[index].getParent() === null, 'Placeholder cold native still attached')
  }

  check(
    claims.phase === 'live' &&
      claims.claimedCount + claims.replacedCount === natives.length &&
      claims.factoryCalls === natives.length,
    'Initial claims differ',
  )

  activity.recordProof(
    JSON.stringify({
      phase: 'hydrated',
      coldLiveParity: true,
      nativeIdentityRetained: true,
      masonIdentityRetained: true,
      initialClaims: claims.claimedCount,
      replacedClaims: claims.replacedCount,
      factoryCalls: claims.factoryCalls,
      logicalNodes: startup.nodes.length,
      replacements,
      motionAlpha,
    }),
  )

  // Spin the hydration marker now that the live tree owns the screen; the
  // cold mount draws it statically, so rotation marks the hydration seam.
  const spinnerIndex = projectVisualTree(startup.nodes).findIndex(
    (node) => node.props.id === 'hydration-spinner',
  )
  const spinner = spinnerIndex >= 0 ? wrappers[spinnerIndex]?.nativeViewProtected : undefined
  if (spinner) {
    const animator = android.animation.ObjectAnimator.ofFloat(spinner, 'rotation', [0, 360])
    animator.setDuration(900)
    animator.setInterpolator(new android.view.animation.LinearInterpolator())
    animator.setRepeatCount(android.animation.ValueAnimator.INFINITE)
    animator.start()
  }

  // The hydrated tree stays on screen so the cold-to-live transition can be
  // evaluated visually; the runner leaves the app and device running.
  activity.recordProof(
    JSON.stringify({
      phase: 'presented',
      visualNodes: natives.length,
      viewportChildren: viewport.getChildCount(),
      claimPhase: claims.phase,
    }),
  )

  activity.presentAdoption()
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
