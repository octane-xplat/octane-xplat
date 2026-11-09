// GJS application host for the GTK renderer — owns the GtkApplication, the
// window, and the content widget a universal root mounts into. The app entry
// bundles this module and calls runGtkApp; `gjs -m` executes the bundle.
import Gtk from 'gi://Gtk?version=4.0'
import Gio from 'gi://Gio'
import { createGtkRoot } from './index.js'
import type { GtkContainer, GtkRoot, GtkView } from './index.js'

export { setWindowContentResolver } from './index.js'

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
  // `activate` on the running app. Only mount once; later activations just
  // re-present the existing window.
  let mounted: GtkAppMount | null = null
  let shutdownRan = false
  let mountCleanup: (() => void) | undefined

  // runMacOSApp parity: on shutdown run the mount's cleanup exactly once,
  // then release the mounted root. Connected once — the cleanup guard does
  // not depend on mount returning a function.
  app.connect('shutdown', () => {
    if (shutdownRan) return
    shutdownRan = true
    try {
      mountCleanup?.()
    } finally {
      mounted?.root.unmount()
    }
  })

  app.connect('activate', () => {
    if (mounted !== null) {
      mounted.window.present()
      return
    }

    const window = new Gtk.ApplicationWindow({
      application: app,
      title: options.title ?? 'Octane App',
      default_width: options.defaultWidth ?? 560,
      default_height: options.defaultHeight ?? 420,
    })

    const content = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 0 })

    window.set_child(content)

    const { root, container } = createGtkRoot(content)

    mounted = { app, window, content, container, root }
    mountCleanup = mount(mounted) ?? undefined
    window.present()
  })

  return app.run(null)
}
