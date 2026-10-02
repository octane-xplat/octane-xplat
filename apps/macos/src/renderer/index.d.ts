import '@nativescript/macos-node-api'

export * from 'octane/universal/native'
export interface MacOSRootOptions {
	/** Default font family for this root and its renderer-hosted overlays. */
	fontFamily?: string
}

/** Map an application-registered family to its weighted native faces. */
export declare function registerFontFamily(
	family: string,
	faces: readonly { weight: number; descriptor: NSFontDescriptor }[],
): void

export declare function createMacOSRoot(
	hostView: NSView,
	options?: MacOSRootOptions,
): import('octane/universal/native').UniversalRoot
