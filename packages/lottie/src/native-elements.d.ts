import { LottieView } from './vendor/ui-lottie'
import type { Attributes } from '@nativescript-community/octane/intrinsics'

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatlottie: Attributes<typeof LottieView>
	}
}
