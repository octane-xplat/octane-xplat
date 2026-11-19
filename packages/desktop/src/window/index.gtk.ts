import { lookupGlobal } from '@octane-xplat/lib/capability'
import type Gtk from 'gi://Gtk?version=4.0'
import { createDesktopWindowService, type NativeWindowOpener } from './service.js'
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
  },
)

/** Open and manage native secondary windows with the GTK host. */
export const windows: DesktopWindowService = binding.windows
export const getWindowOwner: (parent: DesktopWindow) => Gtk.Window | undefined = binding.getWindowOwner
