// Barcode scanner — macOS leaf. Still images decode through Vision's
// VNDetectBarcodesRequest; live camera scanning is not available on macOS,
// so ensure() reports 'unsupported'.
import {
	CGImageGetHeight,
	CGImageGetWidth,
	NSImage,
	NSURL,
	VNDetectBarcodesRequest,
	VNImageRequestHandler,
} from '@octane-xplat/platform/macos'
import type { BarcodeFormat, BarcodeScannerService, PermissionResult, ScannedCode } from './types'

// String literals, not the bound constants — the generated metadata targets
// macOS 11 and omits VNBarcodeSymbologyCodabar.
const VISION_PREFIX = 'VNBarcodeSymbology'
const SYMBOLOGIES: Record<BarcodeFormat, readonly string[]> = {
	qr: ['QR'],
	ean13: ['EAN13'],
	ean8: ['EAN8'],
	upc_a: ['EAN13'],
	upc_e: ['UPCE'],
	code128: ['Code128'],
	code39: ['Code39', 'Code39Checksum', 'Code39FullASCII', 'Code39FullASCIIChecksum'],
	code93: ['Code93', 'Code93i'],
	codabar: ['Codabar'],
	itf: ['I2of5', 'I2of5Checksum', 'ITF14'],
	datamatrix: ['DataMatrix'],
	pdf417: ['PDF417'],
	aztec: ['Aztec'],
}

// Vision → our vocabulary. EAN13 resolves to ean13; UPC-A is an EAN-13 with
// a leading 0 and is rewritten on the payload (see below).
const FORMATS: Record<string, string> = {}
for (const [format, names] of Object.entries(SYMBOLOGIES)) {
	for (const name of names) FORMATS[VISION_PREFIX + name] ??= format
}

/** The deduplicated, prefixed union for the requested formats — every entry
 *  when `formats` is missing or empty, so results stay inside our vocabulary. */
function symbologiesFor(formats?: BarcodeFormat[]): string[] {
	const wanted = formats?.length ? formats : (Object.keys(SYMBOLOGIES) as BarcodeFormat[])
	const out = new Set<string>()
	for (const format of wanted) {
		for (const name of SYMBOLOGIES[format] ?? []) out.add(VISION_PREFIX + name)
	}
	return [...out]
}

/** request.results may be a JS array or an NSArray — count/objectAtIndex. */
function observations(results: any): any[] {
	if (!results) return []
	if (Array.isArray(results)) return results
	const out: any[] = []
	for (let i = 0, count = Number(results.count ?? 0); i < count; i++) {
		out.push(results.objectAtIndex(i))
	}
	return out
}

/** Headless barcode service — permission + still-image decode. See BarcodeScannerService. */
export const barcodeScanner: BarcodeScannerService = {
	supported: true,
	ensure: async (): Promise<PermissionResult> => 'unsupported',
	scanImage: async (image: unknown, formats?: BarcodeFormat[]): Promise<ScannedCode[]> => {
		let source: any
		if (typeof image === 'string' || (image != null && typeof (image as any).uri === 'string')) {
			const input = typeof image === 'string' ? image : (image as any).uri
			if (/^file:/i.test(input)) {
				source = NSImage.alloc().initWithContentsOfURL(NSURL.URLWithString(input))
			} else if (/^[a-z][a-z0-9+.-]*:/i.test(input)) {
				throw new Error('barcodeScanner.scanImage: macOS decodes local files; download remote images first')
			} else {
				source = NSImage.alloc().initWithContentsOfURL(NSURL.fileURLWithPath(input))
			}
		} else if (image != null && typeof (image as any).CGImageForProposedRectContextHints === 'function') {
			source = image
		} else {
			throw new Error('barcodeScanner.scanImage: expected a file path, file URL, {uri} ref, or NSImage')
		}

		const cg = source?.CGImageForProposedRectContextHints?.(null, null, null)
		if (!cg) {
			throw new Error('barcodeScanner.scanImage: could not read the image')
		}

		const request = VNDetectBarcodesRequest.alloc().init()
		request.symbologies = symbologiesFor(formats)
		const handler = VNImageRequestHandler.alloc().initWithCGImageOptions(cg, {})
		if (!handler.performRequestsError([request], null)) {
			throw new Error('barcodeScanner.scanImage: Vision could not process the image')
		}

		// Vision reports UPC-A as EAN-13 with a leading 0.
		const wantsUpcA = !formats?.length || formats.includes('upc_a')
		const wantsEan13 = !formats?.length || formats.includes('ean13')
		const W = Number(CGImageGetWidth(cg))
		const H = Number(CGImageGetHeight(cg))
		const codes: ScannedCode[] = []
		for (const observation of observations(request.results)) {
			const symbology = String(observation?.symbology ?? '')
			let type =
				FORMATS[symbology] ??
				(symbology.startsWith(VISION_PREFIX) ? symbology.slice(VISION_PREFIX.length) : symbology)
			let data = String(observation?.payloadStringValue ?? '')
			if (type === 'ean13') {
				if (data.length === 13 && data.startsWith('0') && wantsUpcA) {
					type = 'upc_a'
					data = data.slice(1)
				} else if (!wantsEan13) {
					continue
				}
			}

			const code: ScannedCode = { type, data }
			const box = observation?.boundingBox
			if (box) {
				const ox = Number(box.origin?.x)
				const oy = Number(box.origin?.y)
				const width = Number(box.size?.width)
				const height = Number(box.size?.height)
				if (Number.isFinite(ox) && Number.isFinite(oy) && Number.isFinite(width) && Number.isFinite(height)) {
					// Vision bounds are normalized with a bottom-left origin.
					code.bounds = {
						x: ox * W,
						y: (1 - oy - height) * H,
						width: width * W,
						height: height * H,
					}
				}
			}

			codes.push(code)
		}
		return codes
	},
}
