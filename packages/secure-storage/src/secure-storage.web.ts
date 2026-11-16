// Browsers have no native secure-storage trust boundary.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Service } from '@octane-xplat/lib/capability'
import type { SecureStore } from './types'

const unavailable = () => Promise.reject(new UnavailabilityError('secureStorage'))

export const secureStorage: Service<SecureStore> = {
  supported: false,
  isAvailable: async () => false,
  get: unavailable,
  set: unavailable,
  remove: unavailable,
}
