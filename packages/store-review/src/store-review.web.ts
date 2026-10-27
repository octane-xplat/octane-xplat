// Store review — web leaf. There is no in-app review prompt on the web; the
// store-page URL helpers still work when the app configures ids, so the leaf
// reports unsupported rather than breaking the import graph.
import type { StoreReview, StoreReviewConfig } from './types'

let config: StoreReviewConfig = {}

const unsupported = () => Promise.reject(new Error('unsupported: no in-app review prompt on web'))

export const storeReview: StoreReview = {
	supported: false,
	isAvailable: async () => false,
	requestReview: unsupported,
	hasAction: async () => false,
	storeUrl(): string {
		if (config.iosAppStoreId) {
			return `https://apps.apple.com/app/id${config.iosAppStoreId}`
		}
		return config.androidPackageName
			? `https://play.google.com/store/apps/details?id=${config.androidPackageName}`
			: ''
	},
	configure(options: StoreReviewConfig): void {
		config = { ...config, ...options }
	},
}
