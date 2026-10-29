/** Dimensions are final image pixels. Omit both for the host's native pixel scale. */
export interface CaptureOptions {
	fileName?: string
	width?: number
	height?: number
	format?: 'png' | 'jpg' | 'webp' | 'raw'
	quality?: number
	result?: 'tmpfile' | 'base64' | 'data-uri' | 'zip-base64'
	snapshotContentContainer?: boolean
	handleGLSurfaceViewOnAndroid?: boolean
	useRenderInContext?: boolean
}

/** An actual host object or a standard Octane ref to one; numeric React handles are not accepted. */
export type CaptureTarget = object | { readonly current: object | null } | null

export interface CaptureCapabilities {
	readonly view: boolean
	readonly screen: boolean
	readonly formats: readonly ('png' | 'jpg' | 'webp')[]
	readonly scrollContent: boolean
}

/** The imperative handle returned through a ViewShot ref. */
export interface ViewShotRef {
	capture(): Promise<string>
}

export interface NormalizedCaptureOptions {
	readonly fileName?: string
	readonly width?: number
	readonly height?: number
	readonly format: 'png' | 'jpg' | 'webp'
	readonly quality: number
	readonly result: 'tmpfile' | 'base64' | 'data-uri'
	readonly snapshotContentContainer: boolean
	readonly handleGLSurfaceViewOnAndroid: boolean
	readonly useRenderInContext: boolean
}
