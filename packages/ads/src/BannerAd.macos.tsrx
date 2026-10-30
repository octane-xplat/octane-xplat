/** @jsxImportSource @octane-xplat/jsx */
// Banner ad — AppKit stub. AdMob has no desktop product; renders nothing and
// reports once via onAdEvent error, matching the web leaf's honest contract.
import { useEffect } from 'octane'
import type { BannerAdProps } from './props'
import type { JSX } from 'octane/jsx-runtime'

export function BannerAd(props: BannerAdProps): JSX.Element @{
	useEffect(() => {
		props.onAdEvent?.({
			type: 'error',
			error: new Error('unsupported: AdMob is not available on macOS'),
		})
	}, [])

	<masonview style={props.style} className={props.className} />
}
