import { getWindowsOpener } from '../windows-host.windows.js'
import { createDesktopWindowService } from './service.js'
import type { DesktopWindowService } from './types.js'

export type * from './types.js'

/** Open and manage native secondary windows with the NativeScript Windows host. */
export const windows: DesktopWindowService = createDesktopWindowService(
  getWindowsOpener,
  {
    requestClose: (window) => window.requestClose(),
    present: (window) => window.present(),
    hide: (window) => window.hide(),
    isVisible: (window) => window.isVisible(),
  },
)
