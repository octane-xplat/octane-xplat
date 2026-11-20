import { UnavailabilityError } from '@octane-xplat/lib/capability'
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
export const windows: DesktopWindowService = {
  supported: false,
  open() {
    throw new UnavailabilityError('windows.open')
  },
  getAllWindows() {
    return []
  },
  getFocusedWindow() {
    return null
  },
}
