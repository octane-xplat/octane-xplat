// Windows leaf — no maps engine; report unsupported.
import type { Maps } from './types'

export const maps: Maps = {
	supported: false,
	init: () => {},
}
