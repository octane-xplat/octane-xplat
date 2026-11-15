import '@nativescript/core/globals'
import { Application, Utils } from '@nativescript/core'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { createNativeScriptRoot, registerElement } from '@octane-xplat/nativescript-octane'
import { projectVisualTree } from '@octane-xplat/native-prerender'
import {
  bindAndroidMasonTree,
  releaseAndroidMasonTree,
} from '@octane-xplat/native-prerender/android/mason-binding'

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

async function qualify(activity) {
  if (!Application.android.nativeApp) {
    Application.android.init(activity.getApplication())
  }

  const scheme = Application.systemAppearance() === 'dark' ? 'dark' : 'light'

  check(scheme === activity.getMountTheme(), 'Native/live configured theme differs')

  const natives = Array.from({ length: activity.getViewCount() }, (_, index) =>
    activity.getView(index),
  )

  check(
    natives.length === projectVisualTree(startup.nodes).length,
    'Native count differs from artifact nodes',
  )

  const mason = org.nativescript.mason.masonkit.Mason.Companion.getShared()
  const originalNodes = natives.map((view) => mason.nodeForView(view))
  const originalHandles = originalNodes.map((node) => String(node.getNativePtr()))
  const binding = bindAndroidMasonTree(startup.nodes, activity.getViewport(), natives)
  const { host, wrappers, claims } = binding

  const viewport = activity.getViewport()
  host.width = 320
  host.height = 640
  host.style.display = 'flex'
  host.style.flexDirection = 'column'
  host.className = 'ns-root ' + (scheme === 'dark' ? 'ns-dark' : 'xds-light')
  host.css = sheets.map((sheet) => sheet.css).join('\n')

  const root = createNativeScriptRoot(host, { createView: claims.createView })
  const prepared = root.prepare(StartupComponent, startup.seed)

  check(prepared.status === 'prepared', 'Startup prepare suspended')
  claims.match(prepared.batch.commands)
  host._setupAsRootView(activity)
  host.callLoaded()
  activity.restoreDefaults()
  binding.commit(() => {
    prepared.commit()
  })

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

  cold.forEach((row, index) => {
    for (const key of new Set([...Object.keys(row), ...Object.keys(live[index])])) {
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
    wrappers.every(
      (view, index) =>
        view.nativeViewProtected === natives[index] &&
        mason.nodeForView(natives[index]) === originalNodes[index] &&
        String(originalNodes[index].getNativePtr()) === originalHandles[index] &&
        view.isLoaded &&
        view._context === activity,
    ),
    'Adoption replaced native objects or failed Core ownership',
  )

  check(
    claims.phase === 'live' &&
      claims.claimedCount === natives.length &&
      claims.factoryCalls === natives.length,
    'Initial claims differ',
  )

  const all = new Set(wrappers)

  activity.recordProof(
    JSON.stringify({
      phase: 'hydrated',
      coldLiveParity: true,
      nativeIdentityRetained: true,
      masonIdentityRetained: true,
      initialClaims: claims.claimedCount,
      factoryCalls: claims.factoryCalls,
      logicalNodes: startup.nodes.length,
    }),
  )

  await Promise.resolve(root.unmount())
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
    'Disposal retained owners',
  )

  activity.recordProof(
    JSON.stringify({
      phase: 'disposed',
      ownersReleased: all.size,
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
