// Shared BarcodeFormat ↔ native-vocabulary mapping.
import { BarcodeFormats } from '@nativescript/mlkit-core'
import type { BarcodeFormat } from './types'

const TO_MLKIT: Record<BarcodeFormat, BarcodeFormats> = {
	qr: BarcodeFormats.QR_CODE,
	ean13: BarcodeFormats.EAN_13,
	ean8: BarcodeFormats.EAN_8,
	upc_a: BarcodeFormats.UPC_A,
	upc_e: BarcodeFormats.UPC_E,
	code128: BarcodeFormats.CODE_128,
	code39: BarcodeFormats.CODE_39,
	code93: BarcodeFormats.CODE_93,
	codabar: BarcodeFormats.CODABAR,
	itf: BarcodeFormats.ITF,
	datamatrix: BarcodeFormats.DATA_MATRIX,
	pdf417: BarcodeFormats.PDF417,
	aztec: BarcodeFormats.AZTEC,
}

const FROM_MLKIT: Record<string, string> = Object.fromEntries(
	Object.entries(TO_MLKIT).map(([ours, theirs]) => [String(theirs), ours]),
)

export function toNativeFormats(formats?: BarcodeFormat[]): BarcodeFormats[] {
	return formats?.length ? formats.map((f) => TO_MLKIT[f]) : [BarcodeFormats.ALL]
}

export function fromNativeFormat(format: unknown): string {
	return FROM_MLKIT[String(format)] ?? String(format ?? 'unknown')
}
