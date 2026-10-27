// Barcode scanner — macOS leaf. Vision's VNDetectBarcodesRequest is
// bridgeable but not wired; report unsupported rather than leaving a hole.
import type { BarcodeScannerService, PermissionResult } from './types'

export const barcodeScanner: BarcodeScannerService = {
	supported: false,
	ensure: async (): Promise<PermissionResult> => 'unsupported',
	scanImage: () => Promise.reject(new Error('unsupported: barcode scanning is not wired on macOS')),
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.camera = () => barcodeScanner.ensure()
