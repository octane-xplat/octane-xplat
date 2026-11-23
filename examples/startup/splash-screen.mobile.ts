import { Page } from '@nativescript/core'
import { SplashScreen, hide, preventAutoHideAsync } from '@octane-xplat/splash-screen'

// 1. Import this module before Application.run() and check whether the screen can be held.
const supported = SplashScreen.capabilities.hold

// 2. Keep the launch screen visible while the app prepares.
if (supported) {
  void preventAutoHideAsync().catch(() => {
    console.warn('The launch screen could not be held')
  })
}

// 3. Hide the screen once the root Page has loaded.
/** Call after constructing/rendering the root Page, before navigating to it. */
export function revealWhenLoaded(page: Page): void {
  if (!supported) {
    return
  }

  const reveal = () => hide()

  if (page.isLoaded) {
    reveal()
  } else {
    page.once(Page.loadedEvent, reveal)
  }
}
