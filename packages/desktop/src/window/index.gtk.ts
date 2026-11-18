import { lookupGlobal } from '@octane-xplat/lib/capability'
import { createDesktopWindowService, type NativeWindowOpener } from './service.js'
import type { DesktopWindowService } from './types.js'

export type * from './types.js'

interface GtkWindow {
  close(): void
  present(): void
  set_visible(visible: boolean): void
  get_visible(): boolean
}

/** Open and manage native secondary windows with the GTK host. */
export const windows: DesktopWindowService = createDesktopWindowService(
  () => {
    const open = lookupGlobal(['__octaneGtkHost', 'openWindow'])

    // This bridge is installed by the GTK renderer and returns its window controller.
    return typeof open === 'function' ? (open as NativeWindowOpener<GtkWindow>) : undefined
  },
  {
    requestClose: (window) => window.close(),
    present: (window) => window.present(),
    hide: (window) => window.set_visible(false),
    isVisible: (window) => window.get_visible(),
  },
)
