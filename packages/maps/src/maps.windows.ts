// Windows leaf — no maps engine; report unsupported.
import type { Maps } from './types'

/** Maps service — backend/permissions facade. */
export const maps: Maps = {
	supported: false,
	init: () => {},
}
