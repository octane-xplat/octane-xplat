import { CameraCaptureError } from './types'
import type {
	CameraInterruptionReason,
	CameraPermissionKind,
	CameraPermissionStatus,
	CameraSession,
	CameraSessionCapabilities,
	CameraSessionConfig,
	CameraSessionEvent,
	CameraSessionSnapshot,
	CameraSelection,
	CaptureIssue,
	EffectiveCaptureConfig,
	MovieEndReason,
	MovieOutcome,
	MovieOutput,
	MovieOutputHandle,
	MovieTake,
	StartRecordingOptions,
} from './types'

/** Result an adapter reports when a capture attempt settles. Media
 *  metadata is already read from the finalized movie by the adapter. */
export type BackendSettle =
	| {
			kind: 'clip'
			output: MovieOutput
			mimeType: string
			durationMs: number
			width: number
			height: number
			orientation: EffectiveCaptureConfig['orientation']
			hasAudio: boolean
			/** Native duration-limit enforcement ended the take. */
			limitReached?: boolean
			/** Adapter-driven endings when no earlier app/lifecycle cause exists. */
			endReason?: MovieEndReason
			warning?: CaptureIssue
	  }
	| {
			kind: 'failed'
			stage: 'preparation' | 'capture' | 'finalization' | 'storage'
			issue: CaptureIssue
	  }

/** Per-attempt callbacks handed to `startCapture`. */
export interface BackendCaptureSink {
	/** Native capture actually began; exactly once per settled attempt. */
	started(config: EffectiveCaptureConfig): void
	/** Capture has ended; metadata verification and storage still own the attempt. */
	finishing(reason?: MovieEndReason): void
	/** Terminal result; exactly once per admitted attempt. */
	settled(result: BackendSettle): void
}

export interface BackendCaptureRequest {
	audio: boolean
	orientation: EffectiveCaptureConfig['orientation'] | undefined
	maximumDurationMs: number | undefined
	/** Resolved writable path for native adapters. */
	destinationPath: string | undefined
}

/** Adapter-owned preview attach. `listener` reports preview lifecycle;
 *  returns the detach function. */
export interface BackendPreviewListener {
	onReady?: () => void
	onError?: (issue: CaptureIssue) => void
}

/** Platform adapter surface driven by the shared session core. Adapters
 *  own permission policy, capability discovery, capture, and local output
 *  access; the core owns states, ordering, causes, and outcomes. */
export interface CameraSessionBackend {
	readonly platform: string
	/** False when the adapter cannot capture on this host; the core
	 *  rejects `startRecording` with `unsupportedPlatform`. */
	readonly supported: boolean
	checkPermission(kind: CameraPermissionKind): Promise<CameraPermissionStatus>
	requestPermission(kind: CameraPermissionKind): Promise<CameraPermissionStatus>
	getCapabilities(): Promise<CameraSessionCapabilities>
	/** An active, ready preview is attached and the camera source is
	 *  running — the admission requirement for `startRecording`. */
	previewReady(): boolean
	/** Attach the shared-source preview to a platform view. */
	attachPreview(host: unknown, listener?: BackendPreviewListener): () => void
	/** Replace configuration while idle; throws CameraCaptureError. */
	configure?(config: CameraSessionConfig): void
	/** Synchronous platform-specific admission checks; creates no attempt on failure. */
	validateStart?(options: StartRecordingOptions): void
	/** Begin capture for an admitted attempt. Async failures settle via
	 *  `sink.settled`; a synchronous throw settles as a preparation failure. */
	startCapture(request: BackendCaptureRequest, sink: BackendCaptureSink): void
	/** Request capture stop; settlement still arrives via the sink. */
	stopCapture(): void
	/** Elapsed capture time in ms for the in-flight attempt. */
	elapsedMs(): number
	openOutput(output: MovieOutput): Promise<MovieOutputHandle>
	/** Release camera ownership. The core calls this only after any
	 *  in-flight attempt has settled. */
	release(): Promise<void>
	/** Reattach/reconfigure bookkeeping when the preview view is detached
	 *  while an attempt is settling — the adapter keeps hardware until
	 *  settlement, then stops. */
	onPreviewDetached?(): void
	/** Lifecycle observations the adapter emits at any time. */
	setObserver(observer: BackendObserver | undefined): void
}

export interface BackendObserver {
	interruption(phase: 'began' | 'ended', reason?: CameraInterruptionReason): void
	availability(available: boolean): void
	/** Preview became ready/unready (session running state changed). */
	previewReady(ready: boolean): void
}

let attemptCounter = 0

const issue = (
	kind: CaptureIssue['kind'],
	operation: string,
	message: string,
	extra?: Partial<CaptureIssue>,
): CameraCaptureError => new CameraCaptureError({ kind, operation, message, ...extra })

/** The concrete session object wrapping a platform backend. Internal to
 *  the package; `CameraSession` is the public shape. */
export class SharedCameraSession implements CameraSession {
	private backend: CameraSessionBackend
	private config: CameraSessionConfig
	private listeners = new Set<(event: CameraSessionEvent) => void>()
	private state: CameraSessionSnapshot['state'] = 'idle'
	private permission: Record<CameraPermissionKind, CameraPermissionStatus> = {
		camera: 'unknown',
		microphone: 'unknown',
	}
	private cameraAvailable = true
	private previewAttached = false
	private interrupted = false
	private disposeRequested = false
	private disposed = false
	private lastCapabilities: CameraSessionCapabilities | undefined
	private requestChains = new Map<CameraPermissionKind, Promise<CameraPermissionStatus>>()

	private attempt:
		| {
				id: string
				state: 'starting' | 'recording' | 'finalizing' | 'settled'
				stopRequested: boolean
				cause?: MovieEndReason
				startedAt?: number
				configuration?: EffectiveCaptureConfig
				resolve: (outcome: MovieOutcome) => void
				completion: Promise<MovieOutcome>
				limitTimer?: ReturnType<typeof setTimeout>
		  }
		| undefined

	constructor(backend: CameraSessionBackend, config: CameraSessionConfig) {
		this.backend = backend
		this.config = { ...config }
		backend.setObserver({
			interruption: (phase, reason) => this.handleInterruption(phase, reason),
			availability: (available) => this.handleAvailability(available),
			previewReady: () => {
				this.emit({ type: 'stateChanged', snapshot: this.snapshot() })
			},
		})
	}

	/** Package-internal: attach a preview host to this session. */
	attach(host: unknown, listener?: BackendPreviewListener): () => void {
		if (this.disposed || this.disposeRequested) {
			throw issue('invalidState', 'attachPreview', 'CameraSession is disposed')
		}

		if (this.previewAttached) {
			throw issue('invalidState', 'attachPreview', 'CameraSession already has a preview')
		}

		const detach = this.backend.attachPreview(host, {
			onReady: listener?.onReady,
			onError: (captureIssue) => {
				listener?.onError?.(captureIssue)
			},
		})

		this.previewAttached = true
		this.emit({ type: 'stateChanged', snapshot: this.snapshot() })
		return () => {
			this.detachInternal(detach)
		}
	}

	get attached(): boolean {
		return this.previewAttached
	}

	private detachInternal(detach: () => void) {
		if (!this.previewAttached) {
			return
		}

		this.previewAttached = false
		const attempt = this.attempt
		if (attempt && (attempt.state === 'starting' || attempt.state === 'recording')) {
			this.requestStop('previewReleased')
		}

		detach()
		this.backend.onPreviewDetached?.()
		this.emit({ type: 'stateChanged', snapshot: this.snapshot() })
	}

	private emit(event: CameraSessionEvent) {
		for (const listener of this.listeners) {
			try {
				listener(event)
			} catch {
				// Listener exceptions must not change capture behavior.
			}
		}
	}

	private setState(state: CameraSessionSnapshot['state']) {
		if (this.state === state) {
			return
		}

		this.state = state
		this.emit({ type: 'stateChanged', snapshot: this.snapshot() })
	}

	snapshot(): CameraSessionSnapshot {
		const attempt = this.attempt
		return {
			state: this.state,
			permission: { ...this.permission },
			cameraAvailable: this.cameraAvailable,
			previewAttached: this.previewAttached,
			interrupted: this.interrupted,
			attempt:
				attempt && attempt.state !== 'settled'
					? {
							id: attempt.id,
							state: attempt.state,
							elapsedMs: this.backend.elapsedMs(),
							configuration: attempt.configuration,
						}
					: undefined,
		}
	}

	subscribe(listener: (event: CameraSessionEvent) => void): () => void {
		this.listeners.add(listener)
		return () => {
			this.listeners.delete(listener)
		}
	}

	async permissions() {
		const [camera, microphone] = await Promise.all([
			this.backend.checkPermission('camera'),
			this.backend.checkPermission('microphone'),
		])

		this.permission = { camera, microphone }
		this.emit({ type: 'stateChanged', snapshot: this.snapshot() })
		return { ...this.permission }
	}

	requestPermission(kind: CameraPermissionKind): Promise<CameraPermissionStatus> {
		const chain = (
			this.requestChains.get(kind) ?? Promise.resolve('unknown' as CameraPermissionStatus)
		).then(async () => {
			if (this.disposed) {
				return this.permission[kind]
			}

			const status = await this.backend.requestPermission(kind)
			this.permission = { ...this.permission, [kind]: status }
			this.emit({ type: 'stateChanged', snapshot: this.snapshot() })
			return status
		})

		this.requestChains.set(kind, chain)
		return chain
	}

	async capabilities(): Promise<CameraSessionCapabilities> {
		const capabilities = await this.backend.getCapabilities()
		this.lastCapabilities = capabilities
		return capabilities
	}

	async configure(next: Partial<CameraSessionConfig>): Promise<void> {
		if (this.disposed || this.disposeRequested) {
			throw issue('invalidState', 'configure', 'CameraSession is disposed')
		}

		if (this.state !== 'idle') {
			throw issue('invalidState', 'configure', `CameraSession cannot configure while ${this.state}`)
		}

		const merged: CameraSessionConfig = { ...this.config, ...next }
		const capabilities = await this.capabilities()
		this.validateCameraSelection(merged.camera, capabilities)
		this.config = merged
		this.backend.configure?.(merged)
	}

	private validateCameraSelection(
		camera: CameraSelection | undefined,
		capabilities: CameraSessionCapabilities,
	) {
		if (camera && typeof camera === 'object' && 'deviceId' in camera) {
			const known = capabilities.cameras.some((entry) => entry.id === camera.deviceId)
			if (!known) {
				throw issue(
					'unsupportedConfiguration',
					'configure',
					`Camera device '${camera.deviceId}' is not available`,
				)
			}
		} else if (camera === 'front' || camera === 'back') {
			const known = capabilities.cameras.some((entry) => entry.facing === camera)
			if (!known && capabilities.cameras.length > 0) {
				throw issue(
					'unsupportedConfiguration',
					'configure',
					`No ${camera}-facing camera is available`,
				)
			}
		}
	}

	private requestStop(cause: MovieEndReason) {
		const attempt = this.attempt
		if (!attempt || attempt.state === 'finalizing' || attempt.state === 'settled') {
			return
		}

		attempt.stopRequested = true
		attempt.cause ??= cause
		if (attempt.state === 'recording') {
			this.setState('finalizing')
			attempt.state = 'finalizing'
			try {
				this.backend.stopCapture()
			} catch {
				// A stop failure still resolves through the settle path or a
				// backend timeout; nothing more to do here.
			}
		}
	}

	private handleInterruption(phase: 'began' | 'ended', reason?: CameraInterruptionReason) {
		this.interrupted = phase === 'began'
		this.emit({ type: 'interruption', phase, reason })
		if (phase === 'began') {
			const cause: MovieEndReason =
				reason === 'background'
					? 'backgrounded'
					: reason === 'cameraInUse'
						? 'cameraUnavailable'
						: 'interrupted'

			this.requestStop(cause)
		}

		this.emit({ type: 'stateChanged', snapshot: this.snapshot() })
	}

	private handleAvailability(available: boolean) {
		if (this.cameraAvailable === available) {
			return
		}

		this.cameraAvailable = available
		this.emit({ type: 'availability', available })
		if (!available) {
			this.requestStop('cameraUnavailable')
		}

		this.emit({ type: 'stateChanged', snapshot: this.snapshot() })
	}

	startRecording(options: StartRecordingOptions = {}): MovieTake {
		const operation = 'startRecording'
		if (this.disposed || this.disposeRequested) {
			throw issue('invalidState', operation, 'CameraSession is disposed')
		}

		if (!this.backend.supported) {
			throw issue(
				'unsupportedPlatform',
				operation,
				'Movie recording is unsupported on this platform',
			)
		}

		if (this.state !== 'idle' || this.attempt) {
			throw issue('busy', operation, `CameraSession is ${this.state}`)
		}

		if (options.maximumDurationMs !== undefined) {
			const value = options.maximumDurationMs
			if (!Number.isFinite(value) || value <= 0) {
				throw issue(
					'invalidArgument',
					operation,
					'maximumDurationMs must be a positive finite number of milliseconds',
				)
			}
		}

		if (
			options.destinationFileUrl !== undefined &&
			!options.destinationFileUrl.startsWith('file://')
		) {
			throw issue('invalidArgument', operation, 'destinationFileUrl must be a local file:// URL')
		}

		if (
			options.orientation !== undefined &&
			options.orientation !== 'unspecified' &&
			this.lastCapabilities &&
			!this.lastCapabilities.orientations.includes(options.orientation)
		) {
			throw issue(
				'unsupportedConfiguration',
				'startRecording',
				`Orientation '${options.orientation}' is not advertised by this camera`,
			)
		}

		if (this.interrupted || !this.cameraAvailable || !this.backend.previewReady()) {
			throw issue(
				'unavailable',
				operation,
				this.interrupted
					? 'Camera session is interrupted'
					: !this.cameraAvailable
						? 'Camera is unavailable'
						: 'An active, ready preview is required before recording',
			)
		}

		this.backend.validateStart?.(options)

		attemptCounter += 1
		const id = `take-${Date.now()}-${attemptCounter}`
		let resolveCompletion!: (outcome: MovieOutcome) => void
		const completion = new Promise<MovieOutcome>((resolve) => {
			resolveCompletion = resolve
		})

		const attempt: {
			id: string
			state: 'starting' | 'recording' | 'finalizing' | 'settled'
			stopRequested: boolean
			cause?: MovieEndReason
			startedAt?: number
			configuration?: EffectiveCaptureConfig
			resolve: (outcome: MovieOutcome) => void
			completion: Promise<MovieOutcome>
			limitTimer?: ReturnType<typeof setTimeout>
		} = {
			id,
			state: 'starting',
			stopRequested: false,
			resolve: resolveCompletion,
			completion,
		}

		this.attempt = attempt
		this.setState('starting')

		const capabilities = this.lastCapabilities
		const sink: BackendCaptureSink = {
			started: (configuration) => {
				const current = this.attempt
				if (!current || current.id !== id || current.state === 'settled') {
					return
				}

				current.configuration = configuration
				current.startedAt = Date.now()
				if (current.state === 'starting') {
					current.state = 'recording'
					this.setState('recording')
					this.emit({ type: 'started', attemptId: id, configuration })
					if (
						options.maximumDurationMs !== undefined &&
						capabilities?.durationLimit === 'bestEffort'
					) {
						const limit = options.maximumDurationMs
						const checkLimit = () => {
							if (this.attempt?.id !== id || current.state !== 'recording') {
								return
							}

							const remaining = limit - this.backend.elapsedMs()
							if (remaining > 0) {
								current.limitTimer = setTimeout(checkLimit, Math.min(remaining, 2_147_483_647))
							} else {
								this.requestStop('maximumDuration')
							}
						}

						current.limitTimer = setTimeout(checkLimit, Math.min(limit, 2_147_483_647))
					}

					if (current.stopRequested) {
						this.requestStop(current.cause ?? 'stopped')
					}
				}
			},
			finishing: (reason) => {
				const current = this.attempt
				if (!current || current.id !== id || current.state === 'settled') {
					return
				}

				current.cause ??= reason
				current.state = 'finalizing'
				this.setState('finalizing')
			},
			settled: (result) => {
				const current = this.attempt
				if (!current || current.id !== id || current.state === 'settled') {
					return
				}

				if (current.limitTimer) {
					clearTimeout(current.limitTimer)
				}

				current.state = 'settled'
				const cause = current.cause ?? (result.kind === 'clip' ? result.endReason : undefined)
				const outcome: MovieOutcome =
					result.kind === 'clip'
						? {
								kind: 'clip',
								clip: {
									output: result.output,
									mimeType: result.mimeType,
									durationMs: result.durationMs,
									width: result.width,
									height: result.height,
									orientation: result.orientation,
									hasAudio: result.hasAudio,
								},
								endReason: cause ?? (result.limitReached ? 'maximumDuration' : 'stopped'),
								partial: cause !== undefined && cause !== 'stopped' && cause !== 'maximumDuration',
								warning: result.warning,
							}
						: {
								kind: 'failed',
								endReason: cause ?? 'captureError',
								stage: result.stage,
								error: new CameraCaptureError(result.issue),
							}

				this.attempt = undefined
				current.resolve(outcome)
				this.emit({ type: 'finished', attemptId: id, outcome })
				if (this.disposeRequested) {
					void this.finishDispose()
				} else {
					this.setState('idle')
				}
			},
		}

		const request: BackendCaptureRequest = {
			audio: this.config.audio === true,
			orientation: options.orientation,
			maximumDurationMs: options.maximumDurationMs,
			destinationPath: options.destinationFileUrl?.startsWith('file://')
				? decodeURIComponent(options.destinationFileUrl.slice('file://'.length))
				: undefined,
		}

		try {
			this.backend.startCapture(request, sink)
		} catch (cause) {
			sink.settled({
				kind: 'failed',
				stage: 'preparation',
				issue:
					cause instanceof CameraCaptureError
						? cause
						: {
								kind: 'captureFailed',
								operation: 'startRecording',
								message: cause instanceof Error ? cause.message : String(cause),
								cause,
							},
			})
		}

		const backend = this.backend
		const take: MovieTake = {
			id,
			get state() {
				return attempt.state
			},
			get elapsedMs() {
				return attempt.state === 'recording' || attempt.state === 'finalizing'
					? backend.elapsedMs()
					: 0
			},
			completion,
			stop: () => {
				if (this.attempt?.id === id) {
					this.requestStop('stopped')
				}

				return completion
			},
		}

		return take
	}

	openOutput(output: MovieOutput): Promise<MovieOutputHandle> {
		return this.backend.openOutput(output)
	}

	async dispose(): Promise<void> {
		if (this.disposed) {
			return
		}

		this.disposeRequested = true
		const attempt = this.attempt
		if (attempt && attempt.state !== 'settled') {
			this.requestStop('disposed')
			await attempt.completion
		}

		await this.finishDispose()
	}

	private async finishDispose() {
		if (this.disposed) {
			return
		}

		this.disposed = true
		this.backend.setObserver(undefined)
		try {
			await this.backend.release()
		} finally {
			this.setState('disposed')
		}
	}
}
