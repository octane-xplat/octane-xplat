// Store review — macOS leaf. SKStoreReviewController exists on macOS 10.14+;
// the native facade is compiled from platforms/macos/src (same loader as
// @octane-xplat/geolocation's XplatGeolocation).
import type { StoreReview, StoreReviewConfig } from './types'

declare const XplatStoreReview:
	| {
			isAvailable(): boolean
			requestReview(): void
	  }
	| undefined

const native = () => (typeof XplatStoreReview === 'undefined' ? null : XplatStoreReview)

let config: StoreReviewConfig = {}

export const storeReview: StoreReview = {
	supported: native()?.isAvailable() ?? false,

	async isAvailable(): Promise<boolean> {
		return native()?.isAvailable() ?? false
	},

	async requestReview(): Promise<void> {
		if (!native()?.isAvailable()) {
			throw new Error('unsupported: SKStoreReviewController is not available')
		}
		native()!.requestReview()
	},

	async hasAction(): Promise<boolean> {
		return native()?.isAvailable() ?? false
	},

	storeUrl(): string {
		return config.iosAppStoreId ? `https://apps.apple.com/app/id${config.iosAppStoreId}` : ''
	},

	configure(options: StoreReviewConfig): void {
		config = { ...config, ...options }
	},
}
