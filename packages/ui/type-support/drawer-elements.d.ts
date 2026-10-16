import type { Attributes } from '@nativescript-community/octane/intrinsics'
import type { Drawer } from '@nativescript-community/ui-drawer'

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		drawer: Attributes<typeof Drawer>
	}
}
