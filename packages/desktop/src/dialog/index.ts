import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { DesktopDialog } from './types.js'

export type * from './types.js'

export const dialog: DesktopDialog = {
  supported: false,
  supportsMessageBox: false,
  async showMessageBox() {
    throw new UnavailabilityError('dialog.showMessageBox')
  },
  async showOpenDialog() {
    throw new UnavailabilityError('dialog.showOpenDialog')
  },
  async showSaveDialog() {
    throw new UnavailabilityError('dialog.showSaveDialog')
  },
}
