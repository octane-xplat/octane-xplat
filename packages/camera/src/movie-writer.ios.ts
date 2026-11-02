import { CameraCaptureError } from './types'
import type { BackendCameraSwitch } from './session-core'
import type { CameraDeviceInfo } from './types'

/** Native candidate protocol. Kept internal until physical qualification. */
export interface IOSMovieWriter {
	install(session: unknown): string | null
	observeSource(callback: (ready: boolean) => void): void
	setPreviewLayer(layer: unknown): void
	expectCamera(id: string): void
	startAudioOrientationMaximumDurationMsReply(
		path: string,
		audio: boolean,
		orientation: number,
		limit: number,
		callback: (type: string, payload: string) => void,
	): void
	switchToReply(id: string, callback: (problem: string | null) => void): void
	confirmSwitch(id: string): void
	cancelSwitch(): void
	stop(): void
	elapsedMs(): number
	releaseWithReply(callback: () => void): void
}

const problem = (kind: 'invalidState' | 'unavailable', message: string) =>
	new CameraCaptureError({ kind, operation: 'switchCamera', message })

/** Retires callbacks before terminal delivery: listeners may admit another take. */
export class IOSMovieWriterDriver {
	private epoch = 0
	private active = false
	private stopping = false
	private released = false
	private releasing: Promise<void> | undefined
	private provisional: { token: object; reject: (error: Error) => void } | undefined
	private pending: { reject: (error: Error) => void; token: object } | undefined
	private native: IOSMovieWriter

	constructor(native: IOSMovieWriter) {
		this.native = native
	}

	start(
		path: string,
		audio: boolean,
		orientation: number,
		limit: number,
		event: (type: string, payload: string) => void,
	): void {
		if (this.released || this.active) {
			throw problem('invalidState', 'The writer is disposed or already recording')
		}
		const epoch = ++this.epoch
		this.active = true
		this.stopping = false
		try {
			this.native.startAudioOrientationMaximumDurationMsReply(
				path,
				audio,
				orientation,
				limit,
				(type, payload) => {
					if (!this.active || this.released || epoch !== this.epoch) {
						return
					}
					if (['finishing', 'limit', 'sourceLost', 'finished', 'failed'].includes(type)) {
						this.stopping = true
						this.cancelSwitch()
					}
					if (type === 'finished' || type === 'failed') {
						this.active = false
						this.cancelSwitch()
					}
					event(type, payload)
				},
			)
		} catch (error) {
			this.active = false
			throw error
		}
	}

	switchCamera(camera: CameraDeviceInfo): BackendCameraSwitch {
		if (!this.active || this.stopping || this.released || this.pending || this.provisional) {
			throw problem('invalidState', 'The writer cannot switch now')
		}
		const token = {}
		const completion = new Promise<CameraDeviceInfo>((resolve, reject) => {
			this.pending = { token, reject }
			try {
				this.native.switchToReply(camera.id, (message) => {
					if (this.pending?.token !== token || this.released) {
						return
					}
					this.pending = undefined
					if (message) {
						reject(problem('unavailable', message))
					} else {
						this.provisional = { token, reject }
						resolve({ ...camera })
					}
				})
			} catch (error) {
				this.pending = undefined
				reject(error)
			}
		})
		return {
			completion,
			commit: () => {
				if (this.provisional?.token !== token || this.stopping || this.released) {
					throw problem('invalidState', 'Camera switching was cancelled before commit')
				}
				this.native.confirmSwitch(camera.id)
				this.provisional = undefined
			},
			cancel: () => {
				if (this.pending?.token === token || this.provisional?.token === token) {
					this.cancelSwitch()
				}
			},
		}
	}

	private cancelSwitch(): void {
		const pending = this.pending ?? this.provisional
		this.pending = undefined
		this.provisional = undefined
		if (!pending) {
			return
		}
		pending.reject(problem('invalidState', 'Camera switching was cancelled'))
		try {
			this.native.cancelSwitch()
		} catch {
			/* Stop/finalization retain ownership. */
		}
	}

	stop(): void {
		this.stopping = true
		this.cancelSwitch()
		this.native.stop()
	}

	release(): Promise<void> {
		this.releasing ??= this.releaseNative()
		return this.releasing
	}

	private async releaseNative(): Promise<void> {
		this.released = true
		this.epoch++
		this.cancelSwitch()
		await new Promise<void>((resolve) => this.native.releaseWithReply(resolve))
	}
}
