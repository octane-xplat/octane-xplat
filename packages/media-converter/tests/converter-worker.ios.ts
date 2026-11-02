// GIF→MP4 conversion engine running in a NativeScript iOS worker isolate.
// Same ImageIO decode, CVPixelBuffer drawing, H.264 backpressure, timing and
// cleanup contract as the packaged Apple engine, driven from JS so the frame
// loop stays off the main/UI queue. One worker per conversion; the host
// terminates it on settle or cancel.
//
// Bridge notes (verified on an iOS 27 simulator, NativeScript 9.1):
//   - ObjC getter selectors are not readable properties: use
//     input.readyForMoreMediaData, not input.isReadyForMoreMediaData, and
//     url.scheme === 'file', not url.isFileURL (unbridged).
//   - A bridged completion block only runs when this isolate is idle, so a
//     synchronous wait on finishWritingWithCompletionHandler would deadlock.
//     The writer status is a synchronous native read — poll it instead.
//   - Methods whose selector ends in `Error:` throw the NSError as a JS
//     exception, e.g. removeItemAtURLError — wrap cleanup that may fail.

// CoreVideo/CoreMedia C symbols are absent from the bundled iOS declarations.
declare const kCVPixelBufferPixelFormatTypeKey: string
declare const kCVPixelFormatType_32ARGB: number
declare const kCVPixelBufferWidthKey: string
declare const kCVPixelBufferHeightKey: string
declare const kCVPixelBufferCGImageCompatibilityKey: string
declare const kCVPixelBufferCGBitmapContextCompatibilityKey: string
declare const kCMTimeZero: any
declare function CMTimeMake(value: number, timescale: number): any
declare function CVPixelBufferPoolCreatePixelBuffer(
	allocator: unknown,
	pool: unknown,
	pixelBufferOut: interop.Reference<unknown>,
): number
declare function CVPixelBufferLockBaseAddress(pixelBuffer: unknown, lockFlags: number): number
declare function CVPixelBufferUnlockBaseAddress(pixelBuffer: unknown, unlockFlags: number): number
declare function CVPixelBufferGetBaseAddress(pixelBuffer: unknown): interop.Pointer | null
declare function CVPixelBufferGetBytesPerRow(pixelBuffer: unknown): number

for (const framework of ['AVFoundation', 'ImageIO', 'CoreVideo', 'CoreMedia']) {
	try {
		NSBundle.bundleWithPath(`/System/Library/Frameworks/${framework}.framework`).load()
	} catch {
		// Symbol presence is what matters; a missing framework fails below.
	}
}

const LIMIT_BYTES: number = 64 * 1024 * 1024
const MAX_FRAMES: number = 1000
const MAX_PIXELS: number = 4_194_304
const MAX_DURATION_MS: number = 60_000
const READY_DEADLINE_MS: number = 30_000
const FINISH_TIMEOUT_MS: number = 60_000

function post(event: Record<string, unknown>): void {
	const postMessage = Reflect.get(globalThis, 'postMessage')
	if (typeof postMessage === 'function') {
		postMessage(event)
	}
}

function convert(request: {
	source: string
	backgroundColor: string
	bitrate: number
}): { uri: string; width: number; height: number; duration: number; mimeType: string } {
	const invalid = (message: string) => new Error(message)
	const uri = request.source
	const url = uri.startsWith('/') ? NSURL.fileURLWithPath(uri) : NSURL.URLWithString(uri)
	if (!url || String(url.scheme) !== 'file') {
		throw invalid('GIF source must be an absolute file path or file URL')
	}
	const attributes = NSFileManager.defaultManager.attributesOfItemAtPathError(url.path ?? '')
	const size = Number(attributes?.objectForKey('NSFileSize') ?? Number.MAX_SAFE_INTEGER)
	if (size > LIMIT_BYTES) {
		throw invalid('GIF exceeds 64 MiB')
	}
	const source = CGImageSourceCreateWithURL(url, null)
	if (!source || String(CGImageSourceGetType(source)) !== 'com.compuserve.gif') {
		throw invalid('Source must be a decodable GIF')
	}
	const count = CGImageSourceGetCount(source)
	const properties = CGImageSourceCopyPropertiesAtIndex(source, 0, null)
	const rawWidth = Number(properties?.objectForKey(kCGImagePropertyPixelWidth) ?? 0)
	const rawHeight = Number(properties?.objectForKey(kCGImagePropertyPixelHeight) ?? 0)
	if (!count || count > MAX_FRAMES || !rawWidth || !rawHeight || rawWidth * rawHeight > MAX_PIXELS) {
		throw invalid(`GIF must have 1–${MAX_FRAMES} frames and at most ${MAX_PIXELS} pixels`)
	}
	const delays: number[] = []
	for (let index = 0; index < count; index++) {
		const frame = CGImageSourceCopyPropertiesAtIndex(source, index, null)
		const gif = frame?.objectForKey(kCGImagePropertyGIFDictionary)
		const seconds =
			Number(gif?.objectForKey(kCGImagePropertyGIFUnclampedDelayTime) ?? 0) ||
			Number(gif?.objectForKey(kCGImagePropertyGIFDelayTime) ?? 0)
		delays.push(seconds > 0 ? Math.max(10, Math.round(seconds * 1000)) : 100)
	}
	const duration = delays.reduce((total, value) => total + value, 0)
	if (duration > MAX_DURATION_MS) {
		throw invalid('GIF traversal exceeds 60 seconds')
	}
	const width = rawWidth + (rawWidth % 2)
	const height = rawHeight + (rawHeight % 2)
	const output = NSFileManager.defaultManager.temporaryDirectory.URLByAppendingPathComponent(
		`xplat-video-${NSUUID.UUID().UUIDString}.mp4`,
	)
	if (!output) {
		throw invalid('Could not create an output location')
	}
	// The host deletes a partial output if it terminates the worker mid-encode.
	post({ output: String(output.absoluteString) })
	const writer = AVAssetWriter.alloc().initWithURLFileTypeError(output, AVFileTypeMPEG4, undefined)
	if (!writer) {
		throw invalid('Could not create the video writer')
	}
	writer.movieTimeScale = 1000
	const settings = {
		[AVVideoCodecKey]: AVVideoCodecTypeH264,
		[AVVideoWidthKey]: width,
		[AVVideoHeightKey]: height,
		[AVVideoCompressionPropertiesKey]: { [AVVideoAverageBitRateKey]: request.bitrate },
	} as unknown as NSDictionary<string, unknown>
	if (!writer.canApplyOutputSettingsForMediaType(settings, AVMediaTypeVideo)) {
		throw invalid('H.264 encoder does not support these dimensions')
	}
	const input = AVAssetWriterInput.alloc().initWithMediaTypeOutputSettings(AVMediaTypeVideo, settings)
	input.mediaTimeScale = 1000
	const adapter = AVAssetWriterInputPixelBufferAdaptor.alloc()
		.initWithAssetWriterInputSourcePixelBufferAttributes(input, {
			[kCVPixelBufferPixelFormatTypeKey]: kCVPixelFormatType_32ARGB,
			[kCVPixelBufferWidthKey]: width,
			[kCVPixelBufferHeightKey]: height,
			[kCVPixelBufferCGImageCompatibilityKey]: true,
			[kCVPixelBufferCGBitmapContextCompatibilityKey]: true,
		} as unknown as NSDictionary<string, unknown>)
	if (!writer.canAddInput(input)) {
		throw invalid('Could not add video track')
	}
	writer.addInput(input)
	const rgb = Number.parseInt(request.backgroundColor.slice(1), 16) || 0
	let succeeded = false
	try {
		if (!writer.startWriting()) {
			throw writer.error ?? invalid('Could not start video encoding')
		}
		writer.startSessionAtSourceTime(kCMTimeZero)
		let time = 0
		for (let index = 0; index < count; index++) {
			const deadline = Date.now() + READY_DEADLINE_MS
			while (!input.readyForMoreMediaData) {
				if (writer.status === 3 /* AVAssetWriterStatusFailed */ || Date.now() > deadline) {
					throw writer.error ?? invalid('Video encoder timed out')
				}
				NSThread.sleepForTimeInterval(0.001)
			}
			const image = CGImageSourceCreateImageAtIndex(source, index, null)
			const pool = adapter.pixelBufferPool
			if (!image || !pool) {
				throw invalid('Could not decode a GIF frame')
			}
			const ref = new interop.Reference<unknown>()
			if (CVPixelBufferPoolCreatePixelBuffer(null, pool, ref) !== 0 || !ref.value) {
				throw invalid('Could not allocate frame pixels')
			}
			const pixel = ref.value
			CVPixelBufferLockBaseAddress(pixel, 0)
			try {
				const context = CGBitmapContextCreate(
					CVPixelBufferGetBaseAddress(pixel),
					width,
					height,
					8,
					CVPixelBufferGetBytesPerRow(pixel),
					CGColorSpaceCreateDeviceRGB(),
					2 as CGBitmapInfo /* kCGImageAlphaInfoNoneSkipFirst */,
				)
				if (!context) {
					throw invalid('Could not draw a video frame')
				}
				CGContextSetRGBFillColor(
					context,
					((rgb >> 16) & 255) / 255,
					((rgb >> 8) & 255) / 255,
					(rgb & 255) / 255,
					1,
				)
				CGContextFillRect(context, CGRectMake(0, 0, width, height))
				CGContextDrawImage(context, CGRectMake(0, height - rawHeight, rawWidth, rawHeight), image)
				if (!adapter.appendPixelBufferWithPresentationTime(pixel, CMTimeMake(time, 1000))) {
					throw writer.error ?? invalid('Could not append video frame')
				}
			} finally {
				CVPixelBufferUnlockBaseAddress(pixel, 0)
			}
			time += delays[index]!
			post({ progress: (index + 1) / count })
		}
		writer.endSessionAtSourceTime(CMTimeMake(duration, 1000))
		input.markAsFinished()
		writer.finishWritingWithCompletionHandler(() => {})
		const deadline = Date.now() + FINISH_TIMEOUT_MS
		while (writer.status !== 2 && writer.status !== 3 && writer.status !== 4 && Date.now() < deadline) {
			NSThread.sleepForTimeInterval(0.01)
		}
		if (writer.status !== 2 /* AVAssetWriterStatusCompleted */) {
			throw writer.error ?? invalid('Video encoding failed')
		}
		succeeded = true
		return {
			uri: String(output.absoluteString),
			width,
			height,
			duration,
			mimeType: 'video/mp4',
		}
	} finally {
		if (!succeeded) {
			writer.cancelWriting()
			try {
				NSFileManager.defaultManager.removeItemAtURLError(output)
			} catch {
				// Best-effort cleanup; the host removes partial outputs too.
			}
		}
	}
}

interface WorkerRequest {
	source: string
	backgroundColor: string
	bitrate: number
}

Reflect.set(globalThis, 'onmessage', (event: { data: unknown }) => {
	const request = event.data as WorkerRequest
	try {
		post({ result: convert(request) })
	} catch (error) {
		post({ error: error instanceof Error ? error.message : String(error) })
	}
})
