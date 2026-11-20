import { getWindowsOpener, getWindowsPrimary, type WindowsWindow } from '../windows-host.windows.js'
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
    maximize: (window) => window.maximize(),
    unmaximize: (window) => window.unmaximize(),
    isMaximized: (window) => window.isMaximized(),
    isMinimized: (window) => window.isMinimized(),
    isFocused: (window) => window.isFocused(),
    observe: (window, onChange) => window.observe(onChange),
    bounds: {
      supported: (window) => window.supportsBounds(),
      get: (window) => window.getBounds(),
      set: (window, bounds) => window.setBounds(bounds),
    },
  },
  getWindowsPrimary,
)

/** Open and manage native secondary windows with the NativeScript Windows host. */
export const windows: DesktopWindowService = binding.windows
export const getWindowOwner: (parent: DesktopWindow) => WindowsWindow | undefined = binding.getWindowOwner
