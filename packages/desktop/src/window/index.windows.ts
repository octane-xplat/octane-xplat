import { getWindowsOpener, type WindowsWindow } from '../windows-host.windows.js'
import { createDesktopWindowService } from './service.js'
import type { DesktopWindow, DesktopWindowService } from './types.js'

export type * from './types.js'

const binding = createDesktopWindowService(
  getWindowsOpener,
  {
    requestClose: (window) => window.requestClose(),
    present: (window) => window.present(),
    hide: (window) => window.hide(),
    isVisible: (window) => window.isVisible(),
    minimize: (window) => window.minimize(),
    restore: (window) => window.restore(),
    bounds: {
      supported: (window) => window.supportsBounds(),
      get: (window) => window.getBounds(),
      set: (window, bounds) => window.setBounds(bounds),
    },
  },
)

/** Open and manage native secondary windows with the NativeScript Windows host. */
export const windows: DesktopWindowService = binding.windows
export const getWindowOwner: (parent: DesktopWindow) => WindowsWindow | undefined = binding.getWindowOwner
