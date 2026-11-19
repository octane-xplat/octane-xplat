import { createDesktopShell, type DesktopShell } from './service.js'

export type { DesktopShell } from './service.js'
export const shell: DesktopShell = createDesktopShell({})
