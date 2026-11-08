import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { AppMenuHost } from './host-types.js'

// WinUI MenuBar support is pending a feasibility probe on the pinned
// NativeScript Windows runtime — popup surfaces have known pointer limits
// there, so support lands only after the probe proves it.
export const host: AppMenuHost = {
  platform: 'windows',
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
