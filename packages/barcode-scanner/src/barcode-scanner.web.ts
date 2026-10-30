// Barcode scanner — web service leaf over the BarcodeDetector API. Live
// scanning is <BarcodeScanner> (getUserMedia + detector poll); this owns
// still-image decode and the availability flag.
import type { BarcodeFormat, BarcodeScannerService, PermissionResult, ScannedCode } from './types'
import { fromDetectorFormat, toDetectorFormats } from './format-map.web'

const detector = () => {
	const Detector = (globalThis as any).BarcodeDetector
	return typeof Detector === 'function' ? Detector : null
}

async function toImageSource(image: unknown): Promise<any> {
	if (typeof image === 'string') {
		const response = await fetch(image)
		return createImageBitmap(await response.blob())
	}
	return image
}

/** Headless barcode service — permission + still-image decode. See BarcodeScannerService. */
export const barcodeScanner: BarcodeScannerService = {
	supported: detector() !== null,

	ensure(): Promise<PermissionResult> {
		return Promise.resolve(detector() ? 'granted' : 'unsupported')
	},

	async scanImage(image: unknown, formats?: BarcodeFormat[]): Promise<ScannedCode[]> {
		const Detector = detector()
		if (!Detector) {
			throw new Error('unsupported: BarcodeDetector is not available')
		}
		let d: any
		try {
			d = new Detector({ formats: toDetectorFormats(formats) })
		} catch {
			d = new Detector()
		}
		const source = await toImageSource(image)
		const codes = await d.detect(source)
		return (codes ?? []).map((code: any) => ({
			type: fromDetectorFormat(code.format),
			data: String(code.rawValue ?? ''),
			bounds: code.boundingBox
				? {
						x: code.boundingBox.x,
						y: code.boundingBox.y,
						width: code.boundingBox.width,
						height: code.boundingBox.height,
					}
				: undefined,
		}))
	},
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.camera = () => barcodeScanner.ensure()
