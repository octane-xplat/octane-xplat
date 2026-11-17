import { createDesktopWindowService } from './service.js'
import type { DesktopWindowService } from './types.js'

export type * from './types.js'

/**
 * Native secondary windows. Check supported and install the native host's window content resolver before opening.
 * @example
 * ```ts
 * import { windows } from '@octane-xplat/desktop'
 * export function openInspector(hasUnsavedEdits: () => boolean) {
 *   if (!windows.supported) return
 *   const inspector = windows.open({ title: 'Inspector', data: { screen: 'inspector' } })
 *   inspector.on('close', (event) => {
 *     if (hasUnsavedEdits()) event.preventDefault()
 *   })
 * }
 * ```
 */
export const windows: DesktopWindowService = createDesktopWindowService(() => undefined, () => {})
