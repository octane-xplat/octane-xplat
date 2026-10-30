// Maps — macOS service leaf. MKMapView bridging is not wired; MapView renders
// its stub and reports via onError.
import type { Maps } from './types'

/** Maps service — backend/permissions facade. */
export const maps: Maps = {
	supported: false,
	init: () => {},
}
