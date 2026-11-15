/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useState } from 'octane'
import { Application, Screen } from '@nativescript/core'
import { android } from '@octane-xplat/platform/android'

/**
 * Current device safe-area insets in dips — `{ top, right, bottom, left }`.
 */
export interface SafeAreaInsets {
  /** Inset at the top edge, in dips. */
  top: number
  /** Inset at the right edge, in dips. */
  right: number
  /** Inset at the bottom edge, in dips. */
  bottom: number
  /** Inset at the left edge, in dips. */
  left: number
}

function androidActivity(): any {
  return Application.android?.foregroundActivity ?? Application.android?.startActivity
}

function androidWindowManager(): any {
  const manager = androidActivity()?.getWindowManager?.()
  if (manager) {
    return manager
  }
  const context =
    Application.android?.context ?? Application.android?.nativeApp?.getApplicationContext?.()
  return context?.getSystemService?.(android.content.Context.WINDOW_SERVICE)
}

function readAndroidInsets(): SafeAreaInsets {
  const decorView = androidActivity()?.getWindow?.()?.getDecorView?.()
  const scale = Screen.mainScreen.scale || 1

  if (android.os.Build.VERSION.SDK_INT >= 30) {
    // WindowMetrics insets are available before the first decor-view dispatch;
    // getRootWindowInsets returns null until then and would read as zero.
    const insets =
      androidWindowManager()?.getCurrentWindowMetrics?.()?.getWindowInsets?.() ??
      decorView?.getRootWindowInsets?.()

    if (!insets) {
      return { top: 0, right: 0, bottom: 0, left: 0 }
    }

    const systemBars =
      android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout()

    const i = insets.getInsets(systemBars)

    return {
      top: i.top / scale,
      right: i.right / scale,
      bottom: i.bottom / scale,
      left: i.left / scale,
    }
  }

  const insets = decorView?.getRootWindowInsets?.()

  if (!insets) {
    return { top: 0, right: 0, bottom: 0, left: 0 }
  }

  return {
    top: insets.getSystemWindowInsetTop() / scale,
    right: insets.getSystemWindowInsetRight() / scale,
    bottom: insets.getSystemWindowInsetBottom() / scale,
    left: insets.getSystemWindowInsetLeft() / scale,
  }
}

function measure(): SafeAreaInsets {
  // The native startup producer answers this read from its declared
  // environment; real NativeScript has no such member and falls through.
  const declared = (Application as { safeAreaInsets?: SafeAreaInsets }).safeAreaInsets
  if (declared) {
    return declared
  }

  const view = Application.ios?.rootController?.view
  const insets = view?.safeAreaInsets

  if (insets) {
    return { top: insets.top, right: insets.right, bottom: insets.bottom, left: insets.left }
  }

  if (Application.android) {
    return readAndroidInsets()
  }

  return { top: 0, right: 0, bottom: 0, left: 0 }
}

/** Reads the window's insets; reads before window attachment may be zero. */
export function useSafeAreaInsets(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>(measure)

  useEffect(() => {
    const update = () => setInsets(measure())

    Application.on(Application.orientationChangedEvent, update)
    Application.on(Application.resumeEvent, update)
    update()
    return () => {
      Application.off(Application.orientationChangedEvent, update)
      Application.off(Application.resumeEvent, update)
    }
  }, [])

  return insets
}
