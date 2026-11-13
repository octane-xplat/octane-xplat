import { Application } from '@nativescript/core/application'
import { setActivityCallbacks } from '@nativescript/core/ui/frame'

const check = (value, reason) => {
  if (!value) throw new Error(reason)
}
// Native super has already executed in this split native/JS host.
const nativeSuperCompleted = () => {}
let session
const lifecycle = { ready: 0, opened: 0, attached: 0, detached: 0, created: 0, destroyed: 0 }
if (XPLAT_PRERENDER_HOME_APPLICATION) {
  Application.on(Application.readyEvent, () => lifecycle.ready++)
  Application.on(Application.windowOpenEvent, ({ window }) => {
    check(!session, 'Home opened a second window session')
    session = window
    lifecycle.opened++
    for (const [event, key] of [
      ['attached', 'attached'],
      ['detached', 'detached'],
      ['activityCreated', 'created'],
      ['activityDestroyed', 'destroyed'],
    ])
      window.on(event, () => lifecycle[key]++)
  })
  Application.run()
}

export function prepareHomeApplication(activity) {
  activity.enableApplicationHandoff()
  let window = Application.android._getWindowForActivity(activity)
  if (!window) {
    check(!activity.isWarmActivity(), 'Warm Home missed Core lifecycle registration')
    // Version-pinned seam: catch up only Core's own observer for the cold host.
    const callbacks = Application.android.lifecycleCallbacks
    check(callbacks, 'Core lifecycle observer unavailable')
    callbacks.onActivityCreated(activity, activity.getLaunchState())
    if (activity.hasStarted()) callbacks.onActivityStarted(activity)
    if (activity.hasPostResumed()) callbacks.onActivityResumed(activity)
    window = Application.android._getWindowForActivity(activity)
  }
  check(
    window && window === session && window === Application.primaryWindow,
    'Home primary window session differs',
  )
  setActivityCallbacks(activity)
  return window
}

export function acceptHomeApplication(activity, host, window) {
  // Generic NativeWindow.setContent uses a non-Activity context first. Use
  // Android's actual content pipeline, as qualified by the two-label control.
  activity._callbacks.resetActivityContent(activity, host)
  if (activity.hasStarted()) activity._callbacks.onStart(activity, nativeSuperCompleted)
  if (activity.hasPostResumed()) activity._callbacks.onPostResume(activity, nativeSuperCompleted)
  check(
    Application.getRootView() === host &&
      window.rootView === host &&
      host.getNativeWindow() === window,
    'Home Application/window/root owners differ',
  )
  check(
    Application.android._getWindows().length === 1 &&
      lifecycle.ready === 1 &&
      lifecycle.opened === 1,
    'Home Application/window initialized more than once',
  )
  activity.recordHomeProof(
    JSON.stringify({
      phase: 'application',
      windowId: window.id,
      registrySize: Application.android._getWindows().length,
      sameRoot: true,
      active: Application.activeWindow === window,
      foregroundActivity: Application.android.foregroundActivity === activity,
      lifecycle: { ...lifecycle },
      catchUp: !activity.isWarmActivity(),
      componentStatePreserved: false,
      normalEntry: false,
    }),
  )
}

export function destroyHomeApplication(activity, host) {
  check(!host.isLoaded, 'Core stop did not unload Home')
  activity._callbacks.onDestroy(activity, nativeSuperCompleted)
}

export function forwardHomeLifecycle(activity, event) {
  const callbacks = activity._callbacks
  check(callbacks, 'Home Activity callback owner missing')
  if (event === 'start') callbacks.onStart(activity, nativeSuperCompleted)
  else if (event === 'stop') callbacks.onStop(activity, nativeSuperCompleted)
  else if (event === 'postResume') callbacks.onPostResume(activity, nativeSuperCompleted)
  else throw new Error('Unexpected Home lifecycle event: ' + event)
}
