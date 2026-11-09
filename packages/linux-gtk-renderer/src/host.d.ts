/// <reference path="./gi.d.ts" />
import type Gtk from 'gi://Gtk?version=4.0'
import type { GtkContainer, GtkRoot, GtkView } from './index.js'

export interface GtkAppOptions {
  /** Reverse-DNS app id, e.g. `dev.xplat.demo`. */
  applicationId: string
  title?: string
  defaultWidth?: number
  defaultHeight?: number
  /** Gio.ApplicationFlags — defaults to FLAGS_NONE. */
  flags?: number
}

export interface GtkAppMount {
  app: Gtk.Application
  window: Gtk.ApplicationWindow
  content: GtkView
  container: GtkContainer
  root: GtkRoot
}

/** Install the app-level content resolver for `openWindow` windows —
 *  the macOS host's `setWindowContentResolver` counterpart.
 *
 *  @example
 *  ```ts
 *  import { setWindowContentResolver } from '@octane-xplat/linux-gtk/host'
 *
 *  setWindowContentResolver((data) =>
 *    (data as { win?: string })?.win === 'inspector' ? Inspector : null)
 *  ``` */
export declare function setWindowContentResolver(
  resolve: ((data: unknown, controller: unknown) => unknown) | null,
): void

/** Create the application window, mount a universal root on a vertical
 *  Gtk.Box content widget, and hand both to `mount` before presenting.
 *  `mount` may return a cleanup function called exactly once,
 *  synchronously on the Gtk.Application `shutdown` signal, before the
 *  mounted root is released.
 *
 *  @example
 *  ```ts
 *  import { runGtkApp } from '@octane-xplat/linux-gtk/host'
 *
 *  runGtkApp({ applicationId: 'dev.xplat.demo', title: 'Demo' }, ({ root }) => {
 *    root.render(App, {})
 *    return () => tray?.destroy()
 *  })
 *  ``` */
export declare function runGtkApp(
  options: GtkAppOptions,
  mount: (target: GtkAppMount) => void | (() => void),
): number
