/** Ad lifecycle event kinds — Google Mobile Ads event vocabulary normalized
 *  to shared spellings. */
export type AdEventType =
	| 'loaded'
	| 'failed_to_load'
	| 'opened'
	| 'closed'
	| 'clicked'
	| 'impression'
	| 'earned_reward'
	| 'error'

/** One ad lifecycle event delivered to a LoadedAd listener. */
export interface AdEvent {
	/** Which lifecycle transition fired. */
	type: AdEventType
	/** The underlying error for 'failed_to_load'/'error'. */
	error?: Error
	/** Earned reward payload for 'earned_reward' (rewarded formats only). */
	reward?: { amount: number; type: string }
}

/** Callback for ad lifecycle events. */
export type AdEventListener = (event: AdEvent) => void

/** Handle for a created fullscreen/rewarded ad — load() then show().
 *  Fullscreen ads are one-shot: after 'closed', create a new one. */
export interface LoadedAd {
	/** Console ad-unit id this ad belongs to. */
	readonly adUnitId: string
	/** True once 'loaded' has fired and show() can present. */
	readonly loaded: boolean
	/** Request the ad content. */
	load(): void
	/** Attach a lifecycle listener (loaded/opened/closed/…). */
	onAdEvent(listener: AdEventListener): void
	/** Present the ad once loaded. */
	show(options?: Record<string, unknown>): void
}

/** Banner format vocabulary — GAM/AdMob size spellings including the
 *  adaptive anchored variants that resolve to real heights per device. */
export type BannerAdSizeType =
	| 'banner'
	| 'largeBanner'
	| 'mediumRectangle'
	| 'fullBanner'
	| 'leaderboard'
	| 'adaptiveBanner'
	| 'anchoredAdaptive'
	| 'fluid'

/** Google Mobile Ads façade; `supported` is false on non-mobile leaves. */
export interface Ads {
	/** Google Mobile Ads SDK exists on this leaf (false off mobile). */
	readonly supported: boolean
	/** Initialize the Google Mobile Ads SDK — call once at app start. */
	initialize(): Promise<void>
	/** Create a fullscreen interstitial ad — call load() then show() on the handle. */
	createInterstitial(adUnitId: string, requestOptions?: Record<string, unknown>): LoadedAd
	/** Create a rewarded video ad — call load() then show() on the handle. */
	createRewardedAd(adUnitId: string, requestOptions?: Record<string, unknown>): LoadedAd
	/** Create a rewarded interstitial ad — call load() then show() on the handle. */
	createRewardedInterstitialAd(adUnitId: string, requestOptions?: Record<string, unknown>): LoadedAd
	/** Create a app-open ad — call load() then show() on the handle. */
	createAppOpenAd(adUnitId: string, requestOptions?: Record<string, unknown>): LoadedAd
}

export declare const ads: Ads
