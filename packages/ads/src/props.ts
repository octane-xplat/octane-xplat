import type { AdEventListener, BannerAdSizeType } from './types'

/** AdMob banner — Google Mobile Ads on iOS/Android. Consent (UMP/ATT) stays
 *  in the permissions seam; requestOptions carries request-level flags
 *  (tagForChildDirectedTreatment etc.) straight through to the SDK. */
export interface BannerAdProps {
	className?: any
	style?: any
	adUnitId: string
	size?: BannerAdSizeType
	requestOptions?: Record<string, unknown>
	onAdEvent?: AdEventListener
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}
