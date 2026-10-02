export {}

// Keep import() references self-contained in generated augmentation declarations.

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		svgview: import('@nativescript-community/octane/intrinsics').Attributes<
			typeof import('@nativescript/core').View
		> & {
			src?: string | Promise<string>
			stretch?: 'none' | 'fill' | 'aspectFit' | 'aspectFill'
		}
	}
}
