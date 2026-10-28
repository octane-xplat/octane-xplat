// Ads — native leaf over @nativescript/google-mobile-ads. Banner lives in
// BannerAd.tsrx (a view); this service owns SDK init + fullscreen formats.
import {
	InterstitialAd,
	MobileAds,
	RewardedAd,
	RewardedInterstitialAd,
} from '@nativescript/google-mobile-ads'

import type { AdEventListener, Ads, LoadedAd } from './types'

const EVENT: Record<string, string> = {
	loaded: 'loaded',
	failed_to_load: 'failed_to_load',
	load_failed: 'failed_to_load',
	opened: 'opened',
	closed: 'closed',
	clicked: 'clicked',
	impression: 'impression',
	earned_reward: 'earned_reward',
	error: 'error',
}

function wrap<
	T extends {
		adUnitId: string
		loaded: boolean
		load(): void
		onAdEvent(l: any): void
		show(o?: any): void
	},
>(ad: T): LoadedAd {
	return {
		adUnitId: ad.adUnitId,
		get loaded() {
			return ad.loaded
		},
		load: () => ad.load(),
		onAdEvent: (listener: AdEventListener) =>
			ad.onAdEvent((type: any, error?: any, data?: any) =>
				listener({
					type: (EVENT[String(type)] ?? String(type)) as any,
					error: error instanceof Error ? error : error ? new Error(String(error)) : undefined,
					reward: data ? { amount: data.amount ?? 0, type: data.type ?? '' } : undefined,
				}),
			),
		show: (options) => ad.show(options),
	}
}

export const ads: Ads = {
	supported: true,

	async initialize(): Promise<void> {
		// The plugin's method is spelled `initalize` upstream — try both.
		const m = MobileAds as any
		await (m.initalize?.() ?? m.initialize?.())
	},

	createInterstitial: (adUnitId, requestOptions) =>
		wrap(InterstitialAd.createForAdRequest(adUnitId, requestOptions as any)),
	createRewardedAd: (adUnitId, requestOptions) =>
		wrap(RewardedAd.createForAdRequest(adUnitId, requestOptions as any)),
	createRewardedInterstitialAd: (adUnitId, requestOptions) =>
		wrap(RewardedInterstitialAd.createForAdRequest(adUnitId, requestOptions as any)),
	// Upstream ships no AppOpenAd wrapper — the format is a documented gap,
	// not silently aliased to interstitial.
	createAppOpenAd: () => {
		throw new Error('unsupported: @nativescript/google-mobile-ads has no AppOpenAd')
	},
}
