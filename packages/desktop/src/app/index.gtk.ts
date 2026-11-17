import Gio from 'gi://Gio'
import { TrayError } from '../tray/errors.js'
import type { AppResidency } from './types.js'

export type * from './types.js'

interface GtkWindowLike {
  present(): void
  set_visible(visible: boolean): void
  get_visible(): boolean
  set_hide_on_close(hide: boolean): void
  get_hide_on_close(): boolean
}

interface GtkApplicationLike {
  hold(): void
  release(): void
  get_windows(): GtkWindowLike[]
}

// The shared Gio declaration omits the default application's window/lifetime API.
type DesktopGio = Omit<typeof Gio, 'Application'> & {
  Application: { get_default(): GtkApplicationLike | null }
}

const gio = Gio as unknown as DesktopGio

function requireGtkApplication(hint: string): GtkApplicationLike {
  const app: GtkApplicationLike | null = gio.Application.get_default()

  if (!app || typeof app.get_windows !== 'function') {
    throw new TrayError(
      'invalid-options',
      `${hint} needs a running Gtk.Application (gio.Application.get_default() returned none)`,
    )
  }

  return app
}

/** Reveal and focus the app's windows; `false` when no app window exists to show. */
export function showAppWindows(): boolean {
  const app = requireGtkApplication('showAppWindows')
  const windows = app.get_windows()

  if (!windows.length) {
    return false
  }

  for (const window of windows) {
    try {
      window.present()
    } catch (error) {
      console.error('[desktop] presenting an app window failed', error)
    }
  }

  return true
}

/** Hide the app's visible windows. */
export function hideAppWindows(): void {
  const app = requireGtkApplication('hideAppWindows')

  for (const window of app.get_windows()) {
    try {
      window.set_visible(false)
    } catch (error) {
      console.error('[desktop] hiding an app window failed', error)
    }
  }
}

/** Whether any app window is currently visible. */
export function areAppWindowsVisible(): boolean {
  const app = requireGtkApplication('areAppWindowsVisible')

  return app.get_windows().some((window) => {
    try {
      return window.get_visible()
    } catch {
      return false
    }
  })
}

/** Toggle window visibility; returns the visibility after toggling. */
export function toggleAppWindows(): boolean {
  if (areAppWindowsVisible()) {
    hideAppWindows()
    return false
  }

  return showAppWindows()
}

/** Keep the app running without visible windows until the returned residency releases. */
export function keepAppResident(options?: { hideWindowsOnClose?: boolean }): AppResidency {
  const app = requireGtkApplication('keepAppResident')

  app.hold()

  const hideOnClose = options?.hideWindowsOnClose === true
  const restored: { window: GtkWindowLike; hideOnClose: boolean }[] = []

  if (hideOnClose) {
    for (const window of app.get_windows()) {
      try {
        restored.push({ window, hideOnClose: window.get_hide_on_close() })
        window.set_hide_on_close(true)
      } catch {
        // Windows that reject the flag keep their own behavior.
      }
    }
  }

  let released = false

  return {
    release() {
      if (released) {
        return
      }

      released = true
      for (const entry of restored) {
        try {
          entry.window.set_hide_on_close(entry.hideOnClose)
        } catch {
          // A closed window may already be gone.
        }
      }

      restored.length = 0
      try {
        app.release()
      } catch {
        // Releasing a quitting app is best-effort.
      }
    },
  }
}
