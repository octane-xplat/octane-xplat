// Windows leaf — no ML Kit/BarcodeDetector backend; report unsupported.
import type { BarcodeScannerService, PermissionResult } from './types'

export const barcodeScanner: BarcodeScannerService = {
	supported: false,
	ensure: async (): Promise<PermissionResult> => 'unsupported',
	scanImage: () =>
		Promise.reject(new Error('unsupported: barcode scanning is not available on windows')),
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.camera = () => barcodeScanner.ensure()
