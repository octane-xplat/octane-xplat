// GJS application host for the GTK renderer — owns the GtkApplication, the
// window, and the content widget a universal root mounts into. The app entry
// bundles this module and calls runGtkApp; `gjs -m` executes the bundle.
import Gtk from 'gi://Gtk?version=4.0'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import { closeGtkWindows, liveGtkWindows } from './window-service.js'
import { createGtkRoot } from './index.js'
import type { GtkContainer, GtkRoot, GtkView } from './index.js'

export { setWindowContentResolver } from './index.js'

const quitGuards = new Set<() => boolean>()
const activateHandlers = new Set<(hasVisibleWindows: boolean) => boolean>()
let didFinish = false
let quitApplication: (() => void) | undefined
let resolveReady!: () => void
const ready = new Promise<void>((resolve) => {
  resolveReady = resolve
})

const lifecycle = {
  isReady: () => didFinish,
  whenReady: () => ready,
  quit() {
    if (!didFinish) {
      throw new Error('Wait for app.whenReady() before requesting quit')
    }

    quitApplication?.()
  },
  addActivateHandler(handler: (hasVisibleWindows: boolean) => boolean) {
    activateHandlers.add(handler)
    return () => activateHandlers.delete(handler)
  },
  addQuitGuard(guard: () => boolean) {
    quitGuards.add(guard)
    return () => quitGuards.delete(guard)
  },
}

declare global {
  var __xplatGtkLifecycle: typeof lifecycle | undefined
}

globalThis.__xplatGtkLifecycle = lifecycle

export interface GtkAppOptions {
  /** Reverse-DNS app id, e.g. `dev.xplat.demo`. */
  applicationId: string
  title?: string
  defaultWidth?: number
  defaultHeight?: number
  /** Gio.ApplicationFlags — defaults to FLAGS_NONE (primary-instance
   *  semantics; a second launch activates the running window). */
  flags?: number
}

export interface GtkAppMount {
  app: Gtk.Application
  window: Gtk.ApplicationWindow
  /** The Gtk.Box the universal root mounts into. */
  content: GtkView
  container: GtkContainer
  root: GtkRoot
}

/** Create the application window, mount a universal root on a vertical
 *  Gtk.Box content widget, and hand both to `mount` before presenting.
 *  Returns GtkApplication.run's exit status — call it as the app entry's
 *  last expression.
 *
 *  `mount` may return a cleanup function; the host calls it exactly once,
 *  synchronously on the Gtk.Application `shutdown` signal, before the
 *  mounted root is released — matching the macOS host's
 *  `runMacOSApp` mount-cleanup contract.
 *
 *  @example
 *  ```ts
 *  import { runGtkApp, setWindowContentResolver } from '@octane-xplat/linux-gtk/host'
 *
 *  setWindowContentResolver((data) => (data as { win?: string })?.win === 'inspector'
 *    ? Inspector : null)
 *
 *  runGtkApp({ applicationId: 'dev.xplat.demo', title: 'Demo' }, ({ root }) => {
 *    root.render(App, {})
 *    return () => tray?.destroy()
 *  })
 *  ``` */
export function runGtkApp(
  options: GtkAppOptions,
  mount: (target: GtkAppMount) => void | (() => void),
): number {
  const app = new Gtk.Application({
    application_id: options.applicationId,
    flags: options.flags ?? Gio.ApplicationFlags.FLAGS_NONE,
  })

  // FLAGS_NONE keeps primary-instance semantics — a second launch re-fires
  // `activate` on the running app. Only mount once; later activations can
  // re-present the existing window.
  let mounted: GtkAppMount | null = null
  let shutdownRan = false
  let mountCleanup: (() => void) | undefined

  let quitPending = false

  function requestQuit() {
    if (quitPending || shutdownRan) {
      return
    }

    quitPending = true
    try {
      for (const guard of Array.from(quitGuards)) {
        if (!guard()) {
          quitPending = false
          return
        }
      }

      for (const controller of liveGtkWindows()) {
        if (controller.onCloseRequested?.() === false) {
          quitPending = false
          return
        }
      }
    } catch (error) {
      quitPending = false
      console.error('[linux-gtk] quit guard failed', error)
      return
    }

    closeGtkWindows()

    GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
      app.quit()
      return GLib.SOURCE_REMOVE
    })
  }

  // runMacOSApp parity: on shutdown run the mount's cleanup exactly once,
  // then release the mounted root. Connected once — the cleanup guard does
  // not depend on mount returning a function.
  app.connect('shutdown', () => {
    if (shutdownRan) {
      return
    }

    shutdownRan = true
    quitApplication = undefined
    closeGtkWindows()
    try {
      mountCleanup?.()
    } finally {
      mounted?.root.unmount()
    }
  })

  app.connect('activate', () => {
    if (mounted !== null) {
      const hasVisibleWindows = app.get_windows().some((window) => window.get_visible())
      let allowDefault = true
      for (const handler of Array.from(activateHandlers)) {
        if (!handler(hasVisibleWindows)) allowDefault = false
      }
      if (allowDefault) mounted.window.present()
      return
    }

    const window = new Gtk.ApplicationWindow({
      application: app,
      title: options.title ?? 'Octane App',
      default_width: options.defaultWidth ?? 560,
      default_height: options.defaultHeight ?? 420,
    })

    // Gtk4 only renders the app menubar when asked — without this,
    // GApplication.set_menubar builds a model nothing displays and the
    // menu is invisible to users and AT-SPI.
    window.set_show_menubar(true)

    const content = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 0 })

    window.set_child(content)

    const { root, container } = createGtkRoot(content)

    mounted = { app, window, content, container, root }
    mountCleanup = mount(mounted) ?? undefined
    window.present()
    quitApplication = requestQuit
    didFinish = true
    resolveReady()
  })

  return app.run(null)
}
