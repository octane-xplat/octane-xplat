import { MLKitView } from '@nativescript/mlkit-core'
import type { Attributes } from '@nativescript-community/octane/intrinsics'

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatbarcodescanner: Attributes<typeof MLKitView>
	}
}
