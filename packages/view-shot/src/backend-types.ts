import type { CaptureCapabilities, NormalizedCaptureOptions } from './types'
export interface CaptureBackend {
	capabilities(): CaptureCapabilities
	/** Validate the concrete host and attachment before allocating or performing capture. */
	validate(target: object): void
	capture(target: object, options: NormalizedCaptureOptions): Promise<string>
	captureScreen(options: NormalizedCaptureOptions): Promise<string>
	/** Deletes/revokes only an exact URI owned by this backend; foreign URIs are ignored. */
	release(uri: string): void
	/** Called by automatic component capture, not by the manual service. */
	waitForLayout(target: object, cancelled: () => boolean): Promise<void>
}
