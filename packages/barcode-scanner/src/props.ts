import type { Octane } from 'octane/jsx-runtime'
import type { BarcodeFormat, ScannedCode } from './types'

export interface BarcodeScannerHandle {
	/** Pause/resume preview processing (not the camera feed itself). */
	setPaused(paused: boolean): void
	toggleCamera(): void
	/** The underlying MLKitView on native, the <video> element on web. */
	native: unknown
}

/** Live barcode/QR scanning view — ML Kit on native, BarcodeDetector on web.
 *  Decoding only: photo capture stays in `@octane-xplat/camera`, gallery
 *  picking in `@octane-xplat/media`. */
export interface BarcodeScannerProps {
	className?: any
	style?: any
	/** Restrict decoded symbologies — all supported formats by default. */
	formats?: BarcodeFormat[]
	/** Fires for each detected code (the OS may deliver batches). */
	onCodeScanned?: (e: { type: string; data: string; bounds?: ScannedCode['bounds'] }) => void
	/** Freeze detection; preview keeps running. Default false. */
	paused?: boolean
	/** Illuminate the camera torch while scanning. Default false. */
	torch?: boolean
	/** 'back' | 'front'. Default 'back'. */
	facing?: 'back' | 'front'
	onError?: (e: { message: string }) => void
	ref?: Octane.Ref<BarcodeScannerHandle>
	/** Platform escape hatches, applied after the shared props. */
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}
