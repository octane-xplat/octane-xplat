// thumbHashUri — macOS leaf. AppKit/Foundation/CoreGraphics names are host
// globals under the AppKit/JSC runtime (same convention as media.macos.ts).
// Decode normalizes through a self-owned CGBitmapContext — RGBA8,
// premultiplied-last is the only alpha-preserving layout bitmap contexts
// offer, so bytes get unpremultiplied in JS. Verified on the real host:
// NSGraphicsContext.graphicsContextWithBitmapImageRep returns null here,
// hence the raw CGContext path.
import { rgbaToThumbHashUri, thumbHashTargetSize, unpremultiplyRGBA } from './hash-image'

const host = globalThis as Record<string, any>

// kCGBitmapByteOrder32Big | kCGImageAlphaPremultipliedLast — R,G,B,A bytes.
const BITMAP_INFO_RGBA_PREMULTIPLIED = 16385

function imageDataSync(src: string): any {
	const match = /^data:[^,]*;base64,(.+)$/s.exec(src)
	if (match) {
		return host.NSData.alloc().initWithBase64EncodedStringOptions(match[1], 0)
	}

	if (src.startsWith('~/')) {
		return host.NSData.dataWithContentsOfFile(host.NSBundle.mainBundle.resourcePath + '/' + src.slice(2))
	}

	if (src.startsWith('file://')) {
		return host.NSData.dataWithContentsOfURL(host.NSURL.URLWithString(src))
	}

	if (src && !/^[a-z][a-z\d+.-]*:/i.test(src)) {
		return host.NSData.dataWithContentsOfFile(src)
	}

	return null
}

/** `src` → image bytes. data:/file:/~/ are synchronous; res:// goes through
 *  imageNamed → TIFF; http(s) fetches via NSURLSession. */
async function imageData(src: string): Promise<any> {
	if (src.startsWith('res://')) {
		return host.NSImage.imageNamed(src.slice(6))?.TIFFRepresentation ?? null
	}

	if (/^https?:\/\//i.test(src)) {
		return await new Promise((resolve) => {
			host.NSURLSession.sharedSession
				.dataTaskWithURLCompletionHandler(host.NSURL.URLWithString(src), (data: any, _response: any, error: any) => {
					resolve(error ? null : data)
				})
				.resume()
		})
	}

	return imageDataSync(src)
}

/** `src` → `thumbhash:<base64>` URI — decode, ≤100px scale, RGBA extract,
 *  encode. Same src grammar as `Image`. Compute at pick/upload time and
 *  store the string beside the image; `Image.placeholder` accepts it. */
export async function thumbHashUri(src: string): Promise<string> {
	const data = await imageData(src)
	const rep = data && host.NSBitmapImageRep.imageRepWithData(data)
	if (!rep || !(rep.pixelsWide > 0 && rep.pixelsHigh > 0)) {
		throw new Error('thumbHashUri: could not decode image source')
	}

	const [w, h] = thumbHashTargetSize(rep.pixelsWide, rep.pixelsHigh)
	const buffer = host.NSMutableData.dataWithLength(w * h * 4)
	const context = host.CGBitmapContextCreateWithData(
		buffer.mutableBytes,
		w,
		h,
		8,
		w * 4,
		host.CGColorSpaceCreateDeviceRGB(),
		BITMAP_INFO_RGBA_PREMULTIPLIED,
		null,
		null,
	)
	if (!context) {
		throw new Error('thumbHashUri: could not allocate bitmap context')
	}

	host.CGContextDrawImage(
		context,
		{ origin: { x: 0, y: 0 }, size: { width: w, height: h } },
		rep.CGImage,
	)
	const rgba = new Uint8Array(host.interop.bufferFromData(buffer)).subarray(0, w * h * 4)
	unpremultiplyRGBA(rgba)
	return rgbaToThumbHashUri(w, h, rgba)
}
