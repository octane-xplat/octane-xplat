import type { AdEventListener, BannerAdSizeType } from './types'

/** AdMob banner — Google Mobile Ads on iOS/Android. Consent (UMP/ATT) stays
 *  in the permissions seam; requestOptions carries request-level flags
 *  (tagForChildDirectedTreatment etc.) straight through to the SDK. */
export interface BannerAdProps {
	/** Class list applied to the banner container. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Console ad-unit id for this banner slot. */
	adUnitId: string
	/** Banner format — 'anchoredAdaptive' resolves a device-fitting height. */
	size?: BannerAdSizeType
	/** Request-level flags forwarded to the ad request (e.g. test-device ids). */
	requestOptions?: Record<string, unknown>
	/** Lifecycle listener for this banner. */
	onAdEvent?: AdEventListener
	/** Platform escape hatches, applied after the shared props. */
	ios?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	android?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	web?: Record<string, any>
}
