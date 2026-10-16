// thumbHashUri — native leaf (iOS/Android). Decodes `src` through ImageSource
// (same grammar as Image.placeholder/src), scales to ≤100px, extracts RGBA,
// and encodes via the vendored reference port.
//
// iOS draws through UIGraphicsImageContext first so UIImageOrientation (EXIF)
// normalizes, then into a CGBitmapContext of a fixed layout — premultiplied
// RGBA8 is the only alpha-preserving format bitmap contexts accept, so the
// bytes get unpremultiplied in JS (the encoder wants straight alpha).
// Android's Bitmap.getPixels returns packed premultiplied ARGB ints —
// same unpremultiply pass.
import { ImageSource, isAndroid, isIOS, knownFolders } from '@nativescript/core'
import { rgbaToThumbHashUri, thumbHashTargetSize, unpremultiplyRGBA } from './hash-image'

// Bound by the runtime's interop metadata; declared locally so the shared
// typecheck program compiles without iOS/Android ambient types (windows).
declare const interop: any
declare const NSMutableData: any
declare const android: any
declare const CGSizeMake: any
declare const CGRectMake: any
declare const UIGraphicsBeginImageContextWithOptions: any
declare const UIGraphicsGetImageFromCurrentImageContext: any
declare const UIGraphicsEndImageContext: any
declare const CGColorSpaceCreateDeviceRGB: any
declare const CGBitmapContextCreateWithData: any
declare const CGContextDrawImage: any

// kCGBitmapByteOrder32Big | kCGImageAlphaPremultipliedLast — R,G,B,A bytes.
const BITMAP_INFO_RGBA_PREMULTIPLIED = 16385

/** `src` grammar mirrors Image: data: base64, res://, ~/, file path, remote URL. */
async function loadImageSource(src: string): Promise<ImageSource> {
	const comma = src.indexOf(',')
	if (src.startsWith('data:') && comma > 0 && src.slice(0, comma).endsWith(';base64')) {
		return ImageSource.fromBase64Sync(src.slice(comma + 1))
	}

	if (src.startsWith('res://')) {
		return ImageSource.fromResourceSync(src.slice(6))
	}

	if (src.startsWith('~/')) {
		return ImageSource.fromFileSync(knownFolders.currentApp().path + '/' + src.slice(2))
	}

	if (/^https?:\/\//i.test(src)) {
		return ImageSource.fromUrl(src)
	}

	return ImageSource.fromFileSync(src)
}

function iosPixels(image: any): { w: number; h: number; rgba: Uint8Array } {
	const [w, h] = thumbHashTargetSize(image.size.width, image.size.height)

	// Pass 1: UIImage draw applies imageOrientation and scales to the target.
	UIGraphicsBeginImageContextWithOptions(CGSizeMake(w, h), false, 1)
	image.drawInRect(CGRectMake(0, 0, w, h))
	const normalized = UIGraphicsGetImageFromCurrentImageContext()
	UIGraphicsEndImageContext()
	const cg = normalized?.CGImage
	if (!cg) {
		throw new Error('thumbHashUri: image has no raster data')
	}

	// Pass 2: draw into a format I control — premultiplied RGBA8 rows.
	const data = NSMutableData.dataWithLength(w * h * 4)
	const context = CGBitmapContextCreateWithData(
		data.mutableBytes,
		w,
		h,
		8,
		w * 4,
		CGColorSpaceCreateDeviceRGB(),
		BITMAP_INFO_RGBA_PREMULTIPLIED,
		null,
		null,
	)
	CGContextDrawImage(context, CGRectMake(0, 0, w, h), cg)

	const rgba = new Uint8Array(interop.bufferFromData(data))
	unpremultiplyRGBA(rgba)
	return { w, h, rgba }
}

function androidPixels(bitmap: any): { w: number; h: number; rgba: Uint8Array } {
	const [w, h] = thumbHashTargetSize(bitmap.getWidth(), bitmap.getHeight())
	const scaled =
		w === bitmap.getWidth() && h === bitmap.getHeight()
			? bitmap
			: android.graphics.Bitmap.createScaledBitmap(bitmap, w, h, true)
	// Array.create('int', n) allocates a real java int[] (platform/random.ts).
	const pixels = (Array as any).create('int', w * h)
	scaled.getPixels(pixels, 0, w, 0, 0, w, h)

	const rgba = new Uint8Array(w * h * 4)
	for (let i = 0, j = 0; i < w * h; i++, j += 4) {
		const c = pixels[i] // packed ARGB_8888 int (premultiplied alpha)
		rgba[j] = (c >> 16) & 255
		rgba[j + 1] = (c >> 8) & 255
		rgba[j + 2] = c & 255
		rgba[j + 3] = (c >>> 24) & 255
	}

	unpremultiplyRGBA(rgba)
	return { w, h, rgba }
}

/** `src` → `thumbhash:<base64>` URI — decode, ≤100px scale, RGBA extract,
 *  encode. Same src grammar as `Image` (remote URL, data: URI, res://,
 *  ~/bundle-path, file path). Compute at pick/upload time and store the
 *  string beside the image; `Image.placeholder` accepts it verbatim. */
export async function thumbHashUri(src: string): Promise<string> {
	if (!isIOS && !isAndroid) {
		throw new Error('thumbHashUri: unsupported on this platform')
	}

	const source = await loadImageSource(src)
	const native = isIOS ? source?.ios : source?.android
	if (!native) {
		throw new Error('thumbHashUri: could not decode image source')
	}

	const pixels = isIOS ? iosPixels(native) : androidPixels(native)
	return rgbaToThumbHashUri(pixels.w, pixels.h, pixels.rgba)
}
