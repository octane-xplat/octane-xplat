// Maps — native service leaf. The API key lives in app metadata on native
// (iOS Info.plist / Android manifest meta-data); init() exists for the web
// contract and is a no-op here.
import type { Maps } from './types'

/** Maps service — backend/permissions facade. */
export const maps: Maps = {
	supported: true,
	init: () => {},
}
