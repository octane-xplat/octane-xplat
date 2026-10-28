// Windows leaf — no in-app review flow exists; report unsupported rather than
// breaking the import graph.
import type { StoreReview } from './types'

const unsupported = () =>
	Promise.reject(new Error('unsupported: no in-app review prompt on windows'))

export const storeReview: StoreReview = {
	supported: false,
	isAvailable: async () => false,
	requestReview: unsupported,
	hasAction: async () => false,
	storeUrl: () => '',
	configure: () => {},
}
