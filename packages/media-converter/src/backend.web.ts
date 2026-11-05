import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { parseGIF, decompressFrame } from 'gifuct-js'
import {
	BufferTarget,
	CanvasSource,
	Mp4OutputFormat,
	Output,
	WebMOutputFormat,
	canEncodeVideo,
} from 'mediabunny'
import { aborted } from './backend-types'
import type { ConversionBackend } from './backend-types'

export const backend: ConversionBackend = {
	async isAvailable(format) {
		if (
			typeof document === 'undefined' ||
			typeof VideoEncoder === 'undefined' ||
			typeof URL.createObjectURL !== 'function'
		) {
			return false
		}
		return canEncodeVideo(format === 'mp4' ? 'avc' : 'vp9')
	},
	async convert(source, request, control) {
		const controller = new AbortController()
		control.onCancel(() => controller.abort())
		const response = await fetch(source, { signal: controller.signal })
		if (!response.ok) {
			throw new Error(`Could not read GIF (${response.status})`)
		}
		const bytes = await response.arrayBuffer()
		if (bytes.byteLength > 64 * 1024 * 1024) {
			throw new RangeError('GIF exceeds 64 MiB')
		}
		const gif = parseGIF(bytes)
		if (gif.header.signature !== 'GIF') {
			throw new TypeError('Source must be a GIF')
		}
		const frames = gif.frames.filter((frame) => 'image' in frame)
		const { width, height } = gif.lsd
		if (!width || !height || width * height > 4_194_304 || !frames.length || frames.length > 1000) {
			throw new RangeError('GIF must have 1–1000 frames and at most 4194304 pixels')
		}
		for (const frame of frames) {
			const d = frame.image.descriptor
			if (!d.width || !d.height || d.left + d.width > width || d.top + d.height > height) {
				throw new TypeError('GIF frame lies outside its canvas')
			}
		}
		const delays = frames.map((frame) => (frame.gce?.delay ? frame.gce.delay * 10 : 100))
		const duration = delays.reduce((sum, value) => sum + value, 0)
		if (duration > 60_000) {
			throw new RangeError('GIF traversal exceeds 60 seconds')
		}
		const outputWidth = width + (width % 2),
			outputHeight = height + (height % 2)
		const codec = request.format === 'mp4' ? 'avc' : 'vp9'
		if (
			!(await canEncodeVideo(codec, {
				width: outputWidth,
				height: outputHeight,
				bitrate: request.bitrate,
			}))
		) {
			throw new UnavailabilityError(`GIF encoder at ${outputWidth}×${outputHeight}`)
		}
		const canvas = document.createElement('canvas'),
			composition = document.createElement('canvas'),
			patch = document.createElement('canvas')
		canvas.width = outputWidth
		canvas.height = outputHeight
		composition.width = width
		composition.height = height
		const ctx = canvas.getContext('2d')!,
			layers = composition.getContext('2d')!,
			patchContext = patch.getContext('2d')!
		if (!ctx || !layers || !patchContext) {
			throw new UnavailabilityError('MediaConverter canvas')
		}
		const target = new BufferTarget()
		const output = new Output({
			format: request.format === 'mp4' ? new Mp4OutputFormat() : new WebMOutputFormat(),
			target,
		})
		const video = new CanvasSource(canvas, { codec, bitrate: request.bitrate })
		output.addVideoTrack(video)
		let timestamp = 0
		try {
			await output.start()
			for (let index = 0; index < frames.length; index++) {
				if (control.cancelled()) {
					throw aborted()
				}
				const frame = decompressFrame(frames[index]!, gif.gct, true)
				const d = frame.dims
				if (d.left + d.width > width || d.top + d.height > height || !d.width || !d.height) {
					throw new TypeError('GIF frame lies outside its canvas')
				}
				const previous =
					frame.disposalType === 3 ? layers.getImageData(0, 0, width, height) : undefined
				patch.width = d.width
				patch.height = d.height
				patchContext.putImageData(
					new ImageData(new Uint8ClampedArray(frame.patch), d.width, d.height),
					0,
					0,
				)
				layers.drawImage(patch, d.left, d.top)
				ctx.fillStyle = request.backgroundColor
				ctx.fillRect(0, 0, outputWidth, outputHeight)
				ctx.drawImage(composition, 0, 0)
				await video.add(timestamp / 1000, delays[index]! / 1000)
				timestamp += delays[index]!
				if (frame.disposalType === 2) {
					layers.clearRect(d.left, d.top, d.width, d.height)
				} else if (previous) {
					layers.putImageData(previous, 0, 0)
				}
				control.progress((index + 1) / frames.length)
				// Yield so cancellation and UI work can run between decoding frames.
				await new Promise<void>((resolve) => setTimeout(resolve, 0))
			}
			video.close()
			if (control.cancelled()) {
				throw aborted()
			}
			await output.finalize()
			if (!target.buffer) {
				throw new Error('Video encoding produced no bytes')
			}
			const mimeType = request.format === 'mp4' ? 'video/mp4' : 'video/webm'
			return {
				uri: URL.createObjectURL(new Blob([target.buffer], { type: mimeType })),
				width: outputWidth,
				height: outputHeight,
				duration,
				mimeType,
			}
		} catch (error) {
			await output.cancel()
			throw error
		} finally {
			canvas.width = composition.width = patch.width = 0
		}
	},
	release: (uri) => URL.revokeObjectURL(uri),
}
