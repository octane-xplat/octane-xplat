import { BannerAd } from '@nativescript/google-mobile-ads'
import type { Attributes } from '@nativescript-community/octane/intrinsics'

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatbannerad: Attributes<typeof BannerAd>
	}
}
