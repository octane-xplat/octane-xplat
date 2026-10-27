// Banner ad — web leaf. AdMob has no web product (AdSense is a different
// integration); renders nothing and reports once via onAdEvent error.
import { useEffect } from 'octane'
import type { BannerAdProps } from './props'

export function BannerAd(props: BannerAdProps) @{
	useEffect(() => {
		props.onAdEvent?.({ type: 'error', error: new Error('unsupported: AdMob is not available on web') })
	}, [])

	<div style={props.style} className={props.className} />
}
