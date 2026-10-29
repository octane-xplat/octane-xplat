/** File encodings accepted by saveAsync. Encoding availability depends on the host. */
export const SaveFormat = { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' } as const
export type SaveFormat = (typeof SaveFormat)[keyof typeof SaveFormat]

/** The axis to reflect; use two operations to reflect both axes. */
export const FlipType = { Horizontal: 'horizontal', Vertical: 'vertical' } as const
export type FlipType = (typeof FlipType)[keyof typeof FlipType]

/** Optional bounds for the initial, orientation-normalized working image. */
export interface ImageLoadOptions {
	maxWidth?: number
	maxHeight?: number
}

/** Dimensions in physical image pixels; omit one side to preserve aspect ratio. */
export interface ResizeOptions {
	width?: number | null
	height?: number | null
}

/** A rectangle in the current image's physical pixel coordinates. */
export interface CropRect {
	originX: number
	originY: number
	width: number
	height: number
}

/** Canvas dimensions and the position of the current image within that canvas. */
export interface ExtentOptions extends CropRect {
	backgroundColor: string | null
}

/** Output encoding; JPEG and full quality are the defaults. */
export interface SaveOptions {
	format?: SaveFormat
	/** Encoding quality in [0, 1]; PNG remains lossless. */
	compress?: number
	/** Include encoded bytes without a data-URI prefix. */
	base64?: boolean
}

/** A separately owned encoded file. Releasing its ImageRef does not delete it. */
export interface ImageResult {
	uri: string
	width: number
	height: number
	base64?: string
}

/** Immutable rendered pixels, independent of later context operations. */
export interface ImageRef {
	readonly width: number
	readonly height: number
	readonly nativeRefType: 'image'
	/** Save a new output; unsupported encodings reject instead of changing format. */
	saveAsync(options?: SaveOptions): Promise<ImageResult>
	/** Release this reference. Already-started saves retain their pixels until settled. */
	release(): void
}

/** A sequential image operation queue. All transformation methods return this context. */
export interface ImageManipulatorContext {
	resize(size: ResizeOptions): ImageManipulatorContext
	/** Positive angles rotate clockwise. The output bounds contain the rotated image. */
	rotate(degrees: number): ImageManipulatorContext
	flip(axis: FlipType): ImageManipulatorContext
	crop(rect: CropRect): ImageManipulatorContext
	/** Place the image on a new canvas; available on web, as in Expo. */
	extent(options: ExtentOptions): ImageManipulatorContext
	/** Discard queued transformations and restore the originally loaded pixels. */
	reset(): ImageManipulatorContext
	/** Capture the operations queued at this call; subsequent edits do not change the result. */
	renderAsync(): Promise<ImageRef>
	/** Release this context and its queued pixels. Rendered refs and saved files survive. */
	release(): void
}

/** Expo-shaped image operations with Xplat capability discovery. */
export interface ImageManipulatorModule {
	readonly supported: boolean
	isAvailable(): Promise<boolean>
	/** Accepts a URI or an unreleased ImageRef from this package. Does not mutate the source. */
	manipulate(source: string | ImageRef, options?: ImageLoadOptions): ImageManipulatorContext
}
