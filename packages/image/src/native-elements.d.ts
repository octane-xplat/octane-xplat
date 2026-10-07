import { Img } from '@nativescript-community/ui-image'
import type { Attributes } from '@nativescript-community/octane/intrinsics'

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		cachedimage: Attributes<typeof Img>
	}
}
