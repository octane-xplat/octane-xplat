import encode, { init } from '@jsquash/webp/encode.js'
import wasmURL from '@jsquash/webp/codec/enc/webp_enc.wasm?url'
let initialized: Promise<unknown> | undefined

export async function encodeWebP(image: HTMLCanvasElement, quality: number): Promise<Blob> {
	initialized ??= init({ locateFile: () => wasmURL }).catch((error: unknown) => {
		initialized = undefined
		throw error
	})
	await initialized
	const context = image.getContext('2d')
	if (!context) {
		throw new Error('A 2D image canvas is unavailable')
	}
	const data = context.getImageData(0, 0, image.width, image.height)
	return new Blob([await encode(data, { quality: quality * 100 })], { type: 'image/webp' })
}
