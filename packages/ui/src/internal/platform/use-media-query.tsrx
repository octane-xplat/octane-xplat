import { Application, Device, Screen, Utils } from '@nativescript/core'
import { useEffect, useState } from 'octane'

import { evaluateNativeMediaQuery } from './media-query-native'

/** Read the OS reduce-motion preference (iOS accessibility switch, Android
 *  animator-duration scale). Same mechanism @octane-xplat/motion uses. */
function readReducedMotion(): boolean {
  const platform = globalThis as Record<string, any>
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

  // `Utils.android` is a {} stub outside a real Android runtime.
  const context = (Utils.android as any).getApplicationContext()
  return (
    platform.android.provider.Settings.Global.getFloat(
      context.getContentResolver(),
      'animator_duration_scale',
      1,
    ) === 0
  )
}

/** iOS posts a notification on reduce-motion change; Android has no event,
 *  so it re-reads on resume (also catches developer-setting changes). */
function observeReducedMotion(notify: () => void): () => void {
  if (Application.ios) {
    const name = (globalThis as Record<string, any>)
      .UIAccessibilityReduceMotionStatusDidChangeNotification

    const observer = Application.ios.addNotificationObserver(name, notify)
    return () => Application.ios.removeNotificationObserver(observer, name)
  }

  Application.on(Application.resumeEvent, notify)
  return () => Application.off(Application.resumeEvent, notify)
}

function evaluate(query: string): boolean {
  return evaluateNativeMediaQuery(query, {
    width: Screen.mainScreen.widthDIPs,
    height: Screen.mainScreen.heightDIPs,
    coarse: true,
    hover: false,
    reducedMotion: readReducedMotion(),
  })
}

/** `useMediaQuery` (Astryx), iOS/Android leaf — evaluates a restricted
 *  media-query grammar (`(max|min)-(width|height)`, `pointer`, `any-pointer`,
 *  `hover`, `any-hover`, `orientation`, `prefers-reduced-motion`,
 *  `and`/`or`/`,`/`not`) against the main screen, fixed touch traits, and the
 *  OS reduce-motion preference, re-evaluating on orientation change,
 *  resume, and (iOS) reduce-motion changes. Unsupported features evaluate
 *  to `false` — record gaps, don't guess. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => evaluate(query))
  useEffect(() => {
    const update = () => setMatches(evaluate(query))
    update()
    Application.on('orientationChanged', update)
    const releaseMotion = observeReducedMotion(update)
    return () => {
      Application.off('orientationChanged', update)
      releaseMotion()
    }
  }, [query])

  return matches
}
