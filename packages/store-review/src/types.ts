/** Options bag for storeReview.configure(). */
export interface StoreReviewConfig {
	/** App Store numeric id (`id123456789`) — required for an iOS storeUrl. */
	iosAppStoreId?: string
	/** Android package name — defaults to the app's own package on native. */
	androidPackageName?: string
}

/** Store-review façade: availability probes plus the OS review prompt.
 *  Both stores throttle actual display and report no outcome, so
 *  requestReview() success only means the request was handed to the OS. */
export interface StoreReview {
	/** Synchronous fast check — the in-app review class exists. */
	readonly supported: boolean
	/** Authoritative availability probe: on Android the Play review flow only
	 *  exists for Play-installed builds; on iOS mirrors `supported`. */
	isAvailable(): Promise<boolean>
	/** Present the OS review prompt. Fire-and-forget per the OS contract —
	 *  both stores throttle display and report no outcome. Rejects with
	 *  'unsupported:' when the platform has no review flow. */
	requestReview(): Promise<void>
	/** Android: a market intent resolves (in-app review or store page is
	 *  reachable). iOS: always true when supported. */
	hasAction(): Promise<boolean>
	/** Store page URL for the configured ids — falls back to the app's own
	 *  package name on Android; empty string when nothing is known. */
	storeUrl(): string
	/** Set the store ids used by storeUrl(). */
	configure(options: StoreReviewConfig): void
}
