// Windows leaf — @nativescript/geolocation ships no windows entry, so the
// capability reports unsupported rather than breaking the import graph.
import type { Capability, GeolocationImpl } from './types'

export const geolocation: Capability<GeolocationImpl> = {
	supported: false,
	ensure: async () => 'unsupported',
	impl: null,
}
