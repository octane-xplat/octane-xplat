import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { DesktopDialog } from './types.js'

export type * from './types.js'

export const dialog: DesktopDialog = {
  supported: false,
  async showOpenDialog() {
    throw new UnavailabilityError('dialog.showOpenDialog')
  },
}
