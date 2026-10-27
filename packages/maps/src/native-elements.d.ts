import { MapView } from '@nativescript/google-maps'
import type { Attributes } from '@nativescript-community/octane/intrinsics'

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatmapview: Attributes<typeof MapView>
	}
}
