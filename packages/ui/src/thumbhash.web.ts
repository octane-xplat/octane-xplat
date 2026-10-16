import { rgbaToThumbHashUri, thumbHashTargetSize } from './hash-image'

/** `src` (any <img> URL — http(s), data:, blob:) → `thumbhash:<base64>` URI.
 *  Decode rides the browser's image pipeline, then canvas scales to ≤100px
 *  and reads straight-alpha RGBA — exactly what `rgbaToThumbHash` wants.
 *  Remote sources must be CORS-readable: a tainted canvas makes getImageData
 *  throw, and that failure surfaces to the caller unaltered. */
export async function thumbHashUri(src: string): Promise<string> {
	if (typeof document === 'undefined' || typeof Image === 'undefined') {
		throw new Error('thumbHashUri: DOM image decode unavailable on this platform')
	}

	const image = new Image()
	image.src = src
	await image.decode()

	const [w, h] = thumbHashTargetSize(image.naturalWidth, image.naturalHeight)
	const canvas = document.createElement('canvas')
	canvas.width = w
	canvas.height = h
	const context = canvas.getContext('2d')
	context!.drawImage(image, 0, 0, w, h)
	return rgbaToThumbHashUri(w, h, context!.getImageData(0, 0, w, h).data)
}
