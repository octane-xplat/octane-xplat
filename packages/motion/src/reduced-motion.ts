import { createSharedObserver, type SharedObserver } from './shared-observer'
import { Application, Device, Utils } from '@nativescript/core'

export function readReducedMotion(): boolean {
  const platform = globalThis as any

  if (Application.ios) {
    return Boolean(platform.UIAccessibilityIsReduceMotionEnabled?.())
  }

  if (!platform.android) {
    return false
  }

  if (
    Number(Device.sdkVersion) >= 26 &&
    platform.android.animation?.ValueAnimator?.areAnimatorsEnabled?.() === false
  ) {
    return true
  }

  // `Utils.android` is a {} stub in the pinned Windows core build.
  const context = (Utils.android as any).getApplicationContext()

  return (
    platform.android.provider.Settings.Global.getFloat(
      context.getContentResolver(),
      'animator_duration_scale',
      1,
    ) === 0
  )
}

// iOS posts a notification on preference change; Android has no event, so it
// polls only while subscribed (also catches developer-setting changes) and
// refreshes on resume.
function startObservation(notify: () => void): () => void {
  if (Application.ios) {
    const application = Application.ios
    const name = (globalThis as any).UIAccessibilityReduceMotionStatusDidChangeNotification
    const observer = application.addNotificationObserver(name, notify)

    return () => application.removeNotificationObserver(observer, name)
  }

  if (!(globalThis as any).android) {
    return () => {}
  }

  let previous = readReducedMotion()
  const check = () => {
    const next = readReducedMotion()

    if (next !== previous) {
      previous = next
      notify()
    }
  }

  const timer = setInterval(check, 500)

  Application.on(Application.resumeEvent, check)
  return () => {
    clearInterval(timer)
    Application.off(Application.resumeEvent, check)
  }
}

/** Share one platform observer across all mounted Motion readers. */
export const observeReducedMotion: SharedObserver = createSharedObserver(startObservation)
