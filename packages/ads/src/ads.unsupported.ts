// Ads — bounded unsupported stub shared by web and Windows
// (AdMob is native-only).
// supported: false rather than fake parity.
import type { Ads } from './types'

const unsupported = () => {
  throw new Error('unsupported: AdMob is not available on this platform')
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
