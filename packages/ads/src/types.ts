export type AdEventType =
	| 'loaded'
	| 'failed_to_load'
	| 'opened'
	| 'closed'
	| 'clicked'
	| 'impression'
	| 'earned_reward'
	| 'error'

export interface AdEvent {
	type: AdEventType
	error?: Error
	reward?: { amount: number; type: string }
}

export type AdEventListener = (event: AdEvent) => void

export interface LoadedAd {
	readonly adUnitId: string
	readonly loaded: boolean
	load(): void
	onAdEvent(listener: AdEventListener): void
	show(options?: Record<string, unknown>): void
}

export type BannerAdSizeType =
	| 'banner'
	| 'largeBanner'
	| 'mediumRectangle'
	| 'fullBanner'
	| 'leaderboard'
	| 'adaptiveBanner'
	| 'anchoredAdaptive'
	| 'fluid'

export interface Ads {
	readonly supported: boolean
	/** Initialize the Google Mobile Ads SDK — call once at app start. */
	initialize(): Promise<void>
	createInterstitial(adUnitId: string, requestOptions?: Record<string, unknown>): LoadedAd
	createRewardedAd(adUnitId: string, requestOptions?: Record<string, unknown>): LoadedAd
	createRewardedInterstitialAd(adUnitId: string, requestOptions?: Record<string, unknown>): LoadedAd
	createAppOpenAd(adUnitId: string, requestOptions?: Record<string, unknown>): LoadedAd
}

export declare const ads: Ads
