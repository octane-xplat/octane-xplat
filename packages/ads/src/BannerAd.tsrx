/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useCallback, useRef } from 'octane'
import { isAndroid } from '@nativescript/core'
import { registerElement } from '@nativescript-community/octane'
import { BannerAd as NativeBannerAd, BannerAdSize } from '@nativescript/google-mobile-ads'
import type { BannerAdProps } from './props'

registerElement('xplatbannerad', NativeBannerAd)

const SIZES: Record<string, any> = {
	banner: () => (BannerAdSize as any).BANNER,
	largeBanner: () => (BannerAdSize as any).LARGE_BANNER,
	mediumRectangle: () => (BannerAdSize as any).MEDIUM_RECTANGLE,
	fullBanner: () => (BannerAdSize as any).FULL_BANNER,
	leaderboard: () => (BannerAdSize as any).LEADERBOARD,
	adaptiveBanner: () => (BannerAdSize as any).getCurrentOrientationAnchoredAdaptiveBannerAdSize?.(),
	anchoredAdaptive: () => (BannerAdSize as any).getCurrentOrientationAnchoredAdaptiveBannerAdSize?.(),
	fluid: () => (BannerAdSize as any).FLUID,
}

/** AdMob banner — the plugin view owns its own load() on mount. */
export function BannerAd(props: BannerAdProps) @{
	const host = useRef<any>(null)
	const bindHost = useCallback((v: any) => {
		host.current = v
	}, [])

	useEffect(() => {
		const v = host.current
		if (!v) {
			return
		}
		if (props.onAdEvent) {
			v.onAdEvent((type: any, error?: any, data?: any) =>
				props.onAdEvent?.({ type: String(type) as any, error, reward: data }),
			)
		}
		const bag = isAndroid ? props.android : props.ios
		if (bag) {
			Object.assign(v, bag)
		}
	}, [])

	useEffect(() => {
		const v = host.current
		if (v && props.size) {
			v.size = SIZES[props.size]?.() ?? (BannerAdSize as any).BANNER
		}
	}, [props.size])

	<xplatbannerad ref={bindHost} unitId={props.adUnitId} style={props.style} className={props.className} />
}
