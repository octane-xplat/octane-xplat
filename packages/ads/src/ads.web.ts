// Ads — web leaf. AdMob is native-only (AdSense is a different product);
// supported: false rather than fake parity.
import type { Ads } from './types'

const unsupported = () => {
	throw new Error('unsupported: AdMob is not available on web')
}

/** Google Mobile Ads service — see Ads for the contract. */
export const ads: Ads = {
	supported: false,
	initialize: async () => {},
	createInterstitial: unsupported,
	createRewardedAd: unsupported,
	createRewardedInterstitialAd: unsupported,
	createAppOpenAd: unsupported,
}
