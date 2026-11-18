import { AndroidApplication, Application, View } from '@nativescript/core'
import { android, androidx } from '@octane-xplat/platform/android'

import type { DismissalHost, ShellDismissal } from './dismissal.mobile'

export type { DismissalHost, ShellDismissal } from './dismissal.mobile'

// Android hardware Escape: unhandled key events bubble from the focused
// view to its ancestors, so a story view that consumes Escape keeps it and
// IME composition is handled before dispatch. Consuming the down and its
// paired up prevents any host-level Escape-to-back translation when the
// shell dismissed. The listener lives on this page's root view only.
export function installDismissal(host: DismissalHost): ShellDismissal {
  const { page, dismissAllowed, tryDismiss } = host

  const back = (event: any) => {
    // A story-owned modal keeps OS Back. Shell dismissal takes precedence
    // only on this page, never in an unrelated navigation root.
    if (dismissAllowed() && tryDismiss()) {
      event.cancel = true
    }
  }

  Application.android?.on(AndroidApplication.activityBackPressedEvent, back)

  const ViewCompat = androidx?.core?.view?.ViewCompat

  if (typeof ViewCompat?.addOnUnhandledKeyEventListener !== 'function') {
    return {
      sync() {},
      release() {
        Application.android?.off(AndroidApplication.activityBackPressedEvent, back)
      },
    }
  }

  let attached: android.view.View | undefined
  let escapeDown = false
  const listener = new androidx.core.view.ViewCompat.OnUnhandledKeyEventListenerCompat({
    onUnhandledKeyEvent(_view: android.view.View, event: android.view.KeyEvent): boolean {
      if (event.getKeyCode() !== android.view.KeyEvent.KEYCODE_ESCAPE) {
        return false
      }

      const action = event.getAction()

      if (action === android.view.KeyEvent.ACTION_DOWN) {
        // Repeats only dispatch while we hold the press.
        if (event.getRepeatCount() > 0) {
          return escapeDown
        }

        escapeDown = dismissAllowed() && tryDismiss()
        return escapeDown
      }

      if (action === android.view.KeyEvent.ACTION_UP) {
        const handled = escapeDown

        escapeDown = false
        return handled
      }

      return escapeDown
    },
  })

  const attach = () => {
    const native = page.android as android.view.View | undefined

    if (!native || attached === native) {
      return
    }

    ViewCompat.addOnUnhandledKeyEventListener(native, listener)
    attached = native
  }

  page.on(View.loadedEvent, attach)
  if (page.isLoaded) {
    attach()
  }

  return {
    sync() {},
    release() {
      page.off(View.loadedEvent, attach)
      Application.android?.off(AndroidApplication.activityBackPressedEvent, back)
      if (attached) {
        ViewCompat.removeOnUnhandledKeyEventListener(attached, listener)
        attached = undefined
      }
    },
  }
}
