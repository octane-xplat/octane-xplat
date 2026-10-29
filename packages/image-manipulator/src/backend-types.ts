import type {
	CropRect,
	ExtentOptions,
	FlipType,
	ImageLoadOptions,
	ImageResult,
	SaveOptions,
} from './types'

export interface Size {
	width: number
	height: number
}

export type Operation =
	| { kind: 'resize'; width: number | null; height: number | null }
	| { kind: 'rotate'; degrees: number }
	| { kind: 'flip'; axis: FlipType }
	| ({ kind: 'crop' } & CropRect)
	| ({ kind: 'extent' } & ExtentOptions)

export interface Frame<T> extends Size {
	image: T
}

/** Transformations must produce independent pixels; the input remains immutable. */
export interface ImageBackend<T> {
	isAvailable(): boolean
	load(uri: string, options: ImageLoadOptions): Promise<Frame<T>>
	transform(frame: Frame<T>, operation: Operation): Frame<T> | Promise<Frame<T>>
	save(frame: Frame<T>, options: Required<SaveOptions>): Promise<ImageResult>
	release(frame: Frame<T>): void
	releaseResult(uri: string): void
}
