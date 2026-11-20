import { lookupGlobal } from '@octane-xplat/lib/capability'
import type Gtk from 'gi://Gtk?version=4.0'
import {
  createDesktopWindowService,
  type NativeWindowController,
  type NativeWindowOpener,
} from './service.js'
import type { DesktopWindow, DesktopWindowService } from './types.js'

export type * from './types.js'

const binding = createDesktopWindowService(
  () => {
    const open = lookupGlobal(['__octaneGtkHost', 'openWindow'])

    // This bridge is installed by the GTK renderer and returns its window controller.
    return typeof open === 'function' ? (open as NativeWindowOpener<Gtk.Window>) : undefined
  },
  {
    requestClose: (window) => window.close(),
    present: (window) => window.present(),
    hide: (window) => window.set_visible(false),
    isVisible: (window) => window.get_visible(),
    minimize: (window) => window.minimize(),
    restore: (window) => window.unminimize(),
    // The window manager applies these asynchronously and may refuse them.
    maximize: (window) => window.maximize(),
    unmaximize: (window) => window.unmaximize(),
    isMaximized: (window) => window.is_maximized(),
    isFocused: (window) => window.is_active,
    observe(window, onChange) {
      // Wayland exposes no position/size to clients — maximized is the only
      // observable window state; move/resize listeners cannot register here.
      const id = window.connect('notify::maximized', () => {
        onChange({ moved: false, resized: false })
      })

      return () => {
        window.disconnect(id)
      }
    },
  },
  () => {
    const primary = lookupGlobal(['__octaneGtkHost', 'primaryWindow'])

    // The GTK renderer installs this bridge to its main-window controller.
    if (typeof primary !== 'function') {
      return undefined
    }

    return primary() as NativeWindowController<Gtk.Window> | undefined
  },
)

/** Open and manage native secondary windows with the GTK host. */
export const windows: DesktopWindowService = binding.windows
export const getWindowOwner: (parent: DesktopWindow) => Gtk.Window | undefined = binding.getWindowOwner
