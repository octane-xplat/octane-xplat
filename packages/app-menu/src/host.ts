import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { AppMenuHost } from './host-types.js'

// Default leaf — iOS, Android and unknown hosts have no application menu bar
// (iPadOS UIMenuBuilder is not exposed to this runtime).
export const host: AppMenuHost = {
  platform: null,
  supported() {
    return false
  },
  defer(fn) {
    setTimeout(fn, 0)
  },
  install() {
    throw new UnavailabilityError('appMenu')
  },
}
