import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { ConversionBackend } from './backend-types'

export const backend: ConversionBackend = {
  isAvailable: async () => false,
  convert: async () => {
    throw new UnavailabilityError('MediaConverter')
  },
  release: () => {},
}
