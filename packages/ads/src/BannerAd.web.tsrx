/** @jsxImportSource @octane-xplat/jsx/dom */
// Banner ad — web leaf. AdMob has no web product (AdSense is a different
// integration); renders nothing and reports once via onAdEvent error.
import { useEffect } from 'octane'
import type { BannerAdProps } from './props'
import type { JSX } from 'octane/jsx-runtime'

export function BannerAd(props: BannerAdProps): JSX.Element @{
	useEffect(() => {
		props.onAdEvent?.({
			type: 'error',
			error: new Error('unsupported: AdMob is not available on web'),
		})
	}, [])

	<div style={props.style} className={props.className} />
}
