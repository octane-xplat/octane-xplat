// Shared BarcodeFormat ↔ web BarcodeDetector-vocabulary mapping.
import type { BarcodeFormat } from './types'

const TO_DETECTOR: Record<BarcodeFormat, string> = {
	qr: 'qr_code',
	ean13: 'ean_13',
	ean8: 'ean_8',
	upc_a: 'upc_a',
	upc_e: 'upc_e',
	code128: 'code_128',
	code39: 'code_39',
	code93: 'code_93',
	codabar: 'codabar',
	itf: 'itf',
	datamatrix: 'data_matrix',
	pdf417: 'pdf417',
	aztec: 'aztec',
}

const FROM_DETECTOR: Record<string, string> = Object.fromEntries(
	Object.entries(TO_DETECTOR).map(([ours, theirs]) => [theirs, ours]),
)

export function toDetectorFormats(formats?: BarcodeFormat[]): string[] | undefined {
	return formats?.length ? formats.map((f) => TO_DETECTOR[f]) : undefined
}

export function fromDetectorFormat(format: unknown): string {
	return FROM_DETECTOR[String(format)] ?? String(format ?? 'unknown')
}
