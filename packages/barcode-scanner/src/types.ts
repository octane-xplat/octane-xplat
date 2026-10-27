export type PermissionResult = 'granted' | 'denied' | 'unsupported'

/** Code symbologies — expo-camera spellings; each platform maps them onto
 *  its own detector vocabulary (ML Kit BarcodeFormats / BarcodeDetector). */
export type BarcodeFormat =
	| 'qr'
	| 'ean13'
	| 'ean8'
	| 'upc_a'
	| 'upc_e'
	| 'code128'
	| 'code39'
	| 'code93'
	| 'codabar'
	| 'itf'
	| 'datamatrix'
	| 'pdf417'
	| 'aztec'

export interface ScannedCode {
	/** The symbology, in our BarcodeFormat spelling. */
	type: string
	/** Decoded payload. */
	data: string
	/** Corner points / bounding rect where the detector reports it. */
	bounds?: { x: number; y: number; width: number; height: number }
}

/** Headless decode + permission service — the scanning view is
 *  `<BarcodeScanner>` from the same package. */
export interface BarcodeScannerService {
	readonly supported: boolean
	/** Ensure camera permission for live scanning. */
	ensure(): Promise<PermissionResult>
	/** Decode codes from a still image (platform image ref: a path or
	 *  ImageSource on native, Blob/HTMLImageElement/data URL on web).
	 *  Returns [] when the detector finds nothing. */
	scanImage(image: unknown, formats?: BarcodeFormat[]): Promise<ScannedCode[]>
}

export declare const barcodeScanner: BarcodeScannerService
