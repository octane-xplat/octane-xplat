import { Application, ApplicationSettings } from '@nativescript/core'
import { setActivityCallbacks } from '@nativescript/core/ui/frame'
import { registerElement } from '@octane-xplat/nativescript-octane'
import { Scroll } from '@octane-xplat/nativescript-mason-core/scroll'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import {
  bindAndroidMasonTree,
  releaseAndroidMasonOwners,
  releaseAndroidMasonTree,
} from '../android/mason-binding.android.js'
import { renderWithStartupCore } from './shared.js'

registerElement('masonview', View)
registerElement('scrollview', Scroll)

function appearance() {
  return Application.systemAppearance?.() === 'dark' ? 'dark' : 'light'
}

function resolveInput(name) {
  if (name === 'systemAppearance') {
    return appearance()
  }
  return ApplicationSettings.hasKey(name) ? ApplicationSettings.getString(name) : null
}

let mountClaimed = false
let startupActivity = null

/**
 * Catch the stock Core lifecycle up to the activity's real state. The
 * installable activity deferred the runtime until its cold mount drew; by
 * then the Java lifecycle events already ran, so this replays them before the
 * entry's rootView is resolved.
 */
function attachActivity(activity) {
  if (!Application.android.nativeApp) {
    Application.android.init(activity.getApplication())
  }
  setActivityCallbacks(activity)
  const callbacks = Application.android.lifecycleCallbacks
  const state = activity.getLaunchState()
  callbacks.onActivityCreated(activity, state)
  if (activity.hasStarted()) {
    callbacks.onActivityStarted(activity)
  }
  if (activity.hasPostResumed()) {
    callbacks.onActivityResumed(activity)
  }
  activity._callbacks.onCreate(activity, state, activity.getIntent(), () => {})
  if (activity.hasStarted()) {
    activity._callbacks.onStart(activity, () => {})
  }
  if (activity.hasPostResumed()) {
    activity._callbacks.onPostResume(activity, () => {})
  }
}

function forwardLifecycle(activity, event) {
  const callbacks = activity._callbacks
  if (!callbacks) {
    return
  }
  if (event === 'start') {
    callbacks.onStart(activity, () => {})
  } else if (event === 'stop') {
    callbacks.onStop(activity, () => {})
  } else if (event === 'postresume') {
    callbacks.onPostResume(activity, () => {})
  } else if (event === 'destroy') {
    callbacks.onDestroy(activity, () => {})
  }
}

const Activity = org?.octanexplat?.prerender?.StartupMountActivity

if (global.isAndroid && Activity) {
  Activity.installBridge(
    new Activity.Bridge({
      onActivity(activity) {
        startupActivity = activity
        attachActivity(activity)
        activity.markBridgeReady()
      },
      onLifecycle(activity, event) {
        forwardLifecycle(activity, event)
      },
      onSaveState(activity, state) {
        activity._callbacks?.onSaveInstanceState(activity, state, () => {})
      },
      onNewIntent(activity, intent) {
        activity._callbacks?.onNewIntent(activity, intent, () => {}, () => {})
      },
    }),
  )
}

function readMount() {
  const activity = startupActivity
  if (!activity) {
    return null
  }

  const rejection = activity.getRejection()
  if (rejection != null) {
    return { activity, rejected: String(rejection) }
  }

  const viewport = activity.getViewport()
  const mount = activity.getMount()
  if (!viewport || !mount) {
    // A warm (recreated) activity carries no cold mount; render ordinarily.
    return null
  }

  const natives = []
  for (let index = 0; index < activity.getViewCount(); index++) {
    natives.push(activity.getView(index))
  }

  return {
    activity,
    viewport,
    mount,
    natives,
    theme: String(activity.getMountTheme()),
    bind: JSON.parse(activity.getMountBind()),
    restoreDefaults: () => activity.restoreDefaults(),
  }
}

function installHandoff() {}

function styleHost(host, mount, sheets) {
  host.width = '100%'
  host.height = '100%'
  host.className = 'ns-root ' + (appearance() === 'dark' ? 'ns-dark' : 'xds-light')
  if (sheets) {
    host.css = sheets.map((sheet) => (typeof sheet === 'string' ? sheet : sheet.css)).join('\n')
  }
}

function discardMount() {
  const viewport = startupActivity?.getViewport?.()
  try {
    const parent = viewport?.getParent?.()
    parent?.removeView?.(viewport)
  } catch {}
}

function releaseFailed(binding) {
  try {
    releaseAndroidMasonTree(binding.host, binding.wrappers)
  } finally {
    releaseAndroidMasonOwners(binding.host, binding.wrappers)
  }
}

/**
 * Ordinary app entry replacement: render `component` under `host` (the entry
 * Page), adopting the activity-mounted cold native tree when the packaged
 * startup artifact selects it and every check passes. See `startup.d.ts` and
 * the package README for the full contract.
 */
export function renderWithStartup(host, component, props, startup) {
  return renderWithStartupCore(host, component, props, startup, {
    appearance,
    resolveInput,
    readMount,
    installHandoff,
    consumed: () => mountClaimed,
    claimMount: () => {
      mountClaimed = true
    },
    bindTree: (nodes, mount) => bindAndroidMasonTree(nodes, mount.viewport, mount.natives),
    styleHost,
    discardMount,
    releaseFailed,
  })
}
