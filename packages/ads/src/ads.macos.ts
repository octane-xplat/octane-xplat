// Ads — AppKit leaf. AdMob has no desktop product and the `.web` source is a
// macOS bundle boundary violation, so this leaf is an explicit unsupported
// facade rather than a re-export (see the §3 services decisions).
import type { Ads } from './types'

const unsupported = () => {
	throw new Error('unsupported: AdMob is not available on macOS')
}

export const ads: Ads = {
	supported: false,
	initialize: async () => {},
	createInterstitial: unsupported,
	createRewardedAd: unsupported,
	createRewardedInterstitialAd: unsupported,
	createAppOpenAd: unsupported,
}
