import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Frame, ImageBackend, Operation } from './backend-types'
import { initialSize, loadOptions, resizeOperation, saveOptions, validateRect } from './geometry'
import type {
	CropRect,
	ExtentOptions,
	FlipType,
	ImageLoadOptions,
	ImageManipulatorContext,
	ImageManipulatorModule,
	ImageRef,
	ImageResult,
	ResizeOptions,
	SaveOptions,
} from './types'

function released(): Error {
	return Object.assign(new Error('Image manipulator resource was released'), {
		code: 'ERR_IMAGE_MANIPULATOR_RELEASED',
	})
}

/** Each backend owns one API instance; frames cannot accidentally cross renderers. */
export function createImageManipulator<T>(backend: ImageBackend<T>): {
	ImageManipulator: ImageManipulatorModule
	releaseImage: (result: ImageResult) => void
} {
	type Owned = { frame: Frame<T>; readers: number }
	const refs = new WeakMap<ImageRef, { pixels: Owned; released: boolean }>()
	const outputs = new Set<string>()
	const own = (frame: Frame<T>): Owned => ({ frame, readers: 1 })
	const hold = (value: Owned): Owned => {
		value.readers++
		return value
	}
	const drop = (value: Owned): void => {
		if (--value.readers === 0) {
			backend.release(value.frame)
		}
	}
	const dropTask = (task: Promise<Owned>): void => {
		void task.then(drop, () => {})
	}
	const observe = (task: Promise<Owned>): Promise<Owned> => {
		void task.catch(() => {})
		return task
	}

	const imageRef = (pixels: Owned): ImageRef => {
		const state = { pixels, released: false }
		const assertLive = () => {
			if (state.released) {
				throw released()
			}
		}
		const ref: ImageRef = {
			nativeRefType: 'image',
			get width() {
				assertLive()
				return pixels.frame.width
			},
			get height() {
				assertLive()
				return pixels.frame.height
			},
			async saveAsync(options?: SaveOptions) {
				assertLive()
				const normalized = saveOptions(options)
				hold(pixels)
				try {
					const result = await backend.save(pixels.frame, normalized)
					outputs.add(result.uri)
					return result
				} finally {
					drop(pixels)
				}
			},
			release() {
				if (state.released) {
					return
				}
				state.released = true
				drop(pixels)
			},
		}
		refs.set(ref, state)
		return ref
	}

	const ImageManipulator: ImageManipulatorModule = {
		get supported() {
			return backend.isAvailable()
		},
		isAvailable: async () => backend.isAvailable(),
		manipulate(input: string | ImageRef, options?: ImageLoadOptions): ImageManipulatorContext {
			if (!backend.isAvailable()) {
				throw new UnavailabilityError('ImageManipulator')
			}
			const normalized = loadOptions(options)
			let source: Promise<Owned>
			if (typeof input === 'string') {
				if (!input.trim()) {
					throw new TypeError('Image source URI must not be empty')
				}
				source = observe(
					Promise.resolve()
						.then(() => backend.load(input, normalized))
						.then(own),
				)
			} else {
				const state = refs.get(input)
				if (!state || state.released) {
					throw released()
				}
				const pixels = hold(state.pixels)
				const size = initialSize(pixels.frame, normalized)
				if (size.width === pixels.frame.width && size.height === pixels.frame.height) {
					source = Promise.resolve(pixels)
				} else {
					source = observe(
						Promise.resolve().then(async () => {
							try {
								return own(await backend.transform(pixels.frame, { kind: 'resize', ...size }))
							} finally {
								drop(pixels)
							}
						}),
					)
				}
			}
			let current = observe(source.then(hold))
			let disposed = false
			const assertLive = () => {
				if (disposed) {
					throw released()
				}
			}
			const enqueue = (operation: Operation) => {
				assertLive()
				current = observe(
					current.then(async (value) => {
						try {
							return own(await backend.transform(value.frame, operation))
						} finally {
							drop(value)
						}
					}),
				)
				return context
			}
			const context: ImageManipulatorContext = {
				resize(size: ResizeOptions) {
					assertLive()
					return enqueue(resizeOperation(size))
				},
				rotate(degrees: number) {
					assertLive()
					if (!Number.isFinite(degrees)) {
						throw new RangeError('Rotation must be finite')
					}
					return enqueue({ kind: 'rotate', degrees: ((degrees % 360) + 360) % 360 })
				},
				flip(axis: FlipType) {
					assertLive()
					if (axis !== 'horizontal' && axis !== 'vertical') {
						throw new TypeError('Unknown flip axis')
					}
					return enqueue({ kind: 'flip', axis })
				},
				crop(rect: CropRect) {
					assertLive()
					validateRect(rect)
					return enqueue({ kind: 'crop', ...rect })
				},
				extent(options: ExtentOptions) {
					assertLive()
					validateRect(options, true)
					if (options.backgroundColor !== null && typeof options.backgroundColor !== 'string') {
						throw new TypeError('backgroundColor must be a color or null')
					}
					return enqueue({ kind: 'extent', ...options })
				},
				reset() {
					assertLive()
					dropTask(current)
					current = observe(source.then(hold))
					return context
				},
				async renderAsync() {
					assertLive()
					return imageRef(hold(await current))
				},
				release() {
					if (disposed) {
						return
					}
					disposed = true
					dropTask(current)
					dropTask(source)
				},
			}
			return context
		},
	}
	return {
		ImageManipulator,
		releaseImage(result: ImageResult): void {
			if (!outputs.has(result.uri)) {
				return
			}
			backend.releaseResult(result.uri)
			outputs.delete(result.uri)
		},
	}
}
