import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { CaptureBackend } from './backend-types'
import { checkDimensions } from './options'
import type { NormalizedCaptureOptions } from './types'

const owned = new Set<string>()
function element(target: object): HTMLElement {
	if (
		typeof HTMLElement === 'undefined' ||
		!(target instanceof HTMLElement) ||
		!target.isConnected
	) {
		throw new TypeError('Capture target must be a connected HTML element from this document')
	}
	const bounds = target.getBoundingClientRect()
	if (bounds.width <= 0 || bounds.height <= 0) {
		throw new RangeError('Capture target has no laid-out area')
	}
	return target
}
function dimensions(host: HTMLElement, options: NormalizedCaptureOptions) {
	const bounds = host.getBoundingClientRect()
	const ratio = host.ownerDocument.defaultView?.devicePixelRatio ?? 1
	const sourceWidth = Math.ceil(bounds.width * ratio),
		sourceHeight = Math.ceil(bounds.height * ratio)
	checkDimensions(sourceWidth, sourceHeight)
	return {
		width: options.width ?? sourceWidth,
		height: options.height ?? sourceHeight,
		sourceWidth,
		sourceHeight,
	}
}
function assertOptions(options: NormalizedCaptureOptions) {
	if (options.fileName !== undefined) {
		throw new UnavailabilityError('Custom capture file names on web')
	}
	if (options.format === 'webp') {
		throw new UnavailabilityError('WebP in this browser capture subset')
	}
	if (options.snapshotContentContainer) {
		throw new UnavailabilityError('Full scroll-content capture in this browser subset')
	}
	if (options.handleGLSurfaceViewOnAndroid || options.useRenderInContext) {
		throw new UnavailabilityError('Native capture strategies on web')
	}
}
async function capture(target: object, options: NormalizedCaptureOptions): Promise<string> {
	assertOptions(options)
	const host = element(target)
	// Cross-origin/protected documents and hardware video cannot be faithfully
	// represented by this DOM engine. Refuse those descendants explicitly.
	if (
		host.matches('iframe, video, object, embed') ||
		host.querySelector('iframe, video, object, embed')
	) {
		throw new UnavailabilityError('Iframe/video surfaces in DOM view capture')
	}
	dimensions(host, options)
	const { default: render } = await import('html2canvas-pro')
	element(host)
	const size = dimensions(host, options)
	const bounds = host.getBoundingClientRect()
	let canvas: HTMLCanvasElement | undefined
	let output: HTMLCanvasElement | undefined
	try {
		canvas = await render(host, {
			backgroundColor: options.format === 'jpg' ? '#ffffff' : null,
			width: bounds.width,
			height: bounds.height,
			scale: host.ownerDocument.defaultView?.devicePixelRatio ?? 1,
			useCORS: true,
			allowTaint: false,
			logging: false,
		})
		element(host)
		checkDimensions(canvas.width, canvas.height)
		output = canvas
		if (canvas.width !== size.width || canvas.height !== size.height) {
			output = host.ownerDocument.createElement('canvas')
			output.width = size.width
			output.height = size.height
			const context = output.getContext('2d')
			if (!context) {
				throw new Error('Could not allocate a capture canvas')
			}
			if (options.format === 'jpg') {
				context.fillStyle = '#ffffff'
				context.fillRect(0, 0, output.width, output.height)
			}
			context.drawImage(canvas, 0, 0, output.width, output.height)
		}
		const mime = options.format === 'jpg' ? 'image/jpeg' : 'image/png'
		if (options.result !== 'tmpfile') {
			const uri = output.toDataURL(mime, options.quality)
			if (!uri.startsWith(`data:${mime};base64,`)) {
				throw new Error('Browser did not encode the requested image format')
			}
			return options.result === 'data-uri' ? uri : uri.slice(uri.indexOf(',') + 1)
		}
		const blob = await new Promise<Blob>((resolve, reject) =>
			output!.toBlob(
				(value) => {
					if (!value || value.type !== mime) {
						reject(new Error('Browser did not encode the requested image format'))
					} else {
						resolve(value)
					}
				},
				mime,
				options.quality,
			),
		)
		element(host)
		const uri = URL.createObjectURL(blob)
		owned.add(uri)
		return uri
	} finally {
		if (output && output !== canvas) {
			output.width = 0
			output.height = 0
		}
		if (canvas) {
			canvas.width = 0
			canvas.height = 0
		}
	}
}
export const backend: CaptureBackend = {
	capabilities: () => ({
		view: typeof document !== 'undefined' && typeof HTMLCanvasElement !== 'undefined',
		screen: false,
		formats: ['png', 'jpg'],
		scrollContent: false,
	}),
	validate(target) {
		element(target)
	},
	capture,
	async captureScreen() {
		throw new UnavailabilityError(
			'Native app-screen capture on web; pass an explicit element to captureRef',
		)
	},
	release(uri) {
		if (owned.has(uri)) {
			URL.revokeObjectURL(uri)
			owned.delete(uri)
		}
	},
	async waitForLayout(target, cancelled) {
		const start = Date.now()
		while (!cancelled()) {
			try {
				element(target)
				return
			} catch (error) {
				if (Date.now() - start >= 1500) {
					throw error
				}
			}
			await new Promise<void>((resolve) => setTimeout(resolve, 16))
		}
		throw new Error('ViewShot unmounted while waiting for layout')
	},
}
