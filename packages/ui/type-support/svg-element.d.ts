export {}

// Renderer element typing is internal; it must not enter the public declaration graph.

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
