// Geolocation — AppKit host leaf. CoreLocation is not bridged on the dev host.
import type { Capability, GeolocationImpl } from './types'

export const geolocation: Capability<GeolocationImpl> = {
	supported: false,
	ensure: async () => 'unsupported',
	impl: null,
}
