import { CameraCaptureError } from './types'
import type {
  CameraInterruptionReason,
  CameraDeviceInfo,
  CameraPermissionKind,
  CameraPermissionStatus,
  CameraPreviewPoint,
  CameraSession,
  CameraSessionCapabilities,
  CameraSessionConfig,
  CameraSessionEvent,
  CameraSessionSnapshot,
  CameraSelection,
  CameraZoomState,
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
  /** The session can admit `startRecording` — recording-admission
   *  readiness, not a displayed-frame signal. */
  onReady?: () => void
  /** The attached surface displayed its first live camera frame — a
   *  display-readiness signal, separate from `onReady` admission.
   *  Adapters fire it on each transition into displayed state; hosts
   *  without a distinct display signal never fire it. */
  onDisplayReady?: () => void
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
  /** Live camera-only swap. The adapter holds recorded video and keeps
   *  audio/output alive. Cancellation must retire late hardware callbacks. */
  switchCamera?(camera: CameraSelection): BackendCameraSwitch
  /** Meter one autofocus/auto-exposure pass at a normalized preview-space
   *  point — the tap-to-focus primitive. Absent means the adapter cannot
   *  meter at a point; the core turns it into a no-op. */
  focusAtPoint?(point: CameraPreviewPoint): void
  /** Live zoom state of the bound device; absent or `undefined` means the
   *  adapter exposes no zoom control. */
  zoomState?(): CameraZoomState | undefined
  /** Write a zoom ratio already clamped by the core. Absent means the
   *  adapter exposes no zoom control. */
  setZoom?(ratio: number): void
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

export interface BackendCameraSwitch {
  completion: Promise<CameraDeviceInfo>
  /** Commit a provisionally acquired source after the lifecycle recheck.
   *  Cancellation must remain effective until this synchronous handoff. */
  commit?(): void
  cancel(): void
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

/** Collapse '.' and '..' segments without touching the filesystem — the
 *  adapters' app-private containment checks compare against this canonical
 *  form, so a '..' inside the requested path can never keep the root
 *  prefix while escaping it. */
export const canonicalizePath = (raw: string, separator = '/'): string => {
  const rooted = raw.startsWith(separator)
  const parts: string[] = []
  for (const part of raw.split(separator)) {
    if (part === '' || part === '.') {
      continue
    }

    if (part === '..') {
      if (parts.length > 0 && parts[parts.length - 1] !== '..') {
        parts.pop()
      } else if (!rooted) {
        parts.push(part)
      }

      continue
    }

    parts.push(part)
  }

  return (rooted ? separator : '') + parts.join(separator)
}

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
  private pendingOnReady: (() => void) | undefined
  private disposeRequested = false
  private disposed = false
  private lastCapabilities: CameraSessionCapabilities | undefined
  private requestChains = new Map<CameraPermissionKind, Promise<CameraPermissionStatus>>()
  private activeCamera: CameraDeviceInfo | undefined
  private cameraSwitch: { cancelled: boolean; cancel?: () => void; abort: () => void } | undefined

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
      previewReady: (ready) => {
        // A retracted readiness signal invalidates a pending onReady;
        // a delivered one retries admission.
        if (!ready) {
          this.pendingOnReady = undefined
        }

        this.flushPendingReady()
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
      onReady: listener?.onReady
        ? () => {
            if (this.state !== 'idle' || this.cameraSwitch) {
              return
            }
            this.pendingOnReady = listener.onReady
            this.flushPendingReady()
          }
        : undefined,
      onError: (captureIssue) => {
        listener?.onError?.(captureIssue)
      },
      onDisplayReady: listener?.onDisplayReady
        ? () => {
            if (!this.disposed) {
              listener.onDisplayReady!()
            }
          }
        : undefined,
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
    this.pendingOnReady = undefined
    const attempt = this.attempt
    if (attempt && (attempt.state === 'starting' || attempt.state === 'recording')) {
      this.requestStop('previewReleased')
    }

    detach()
    this.backend.onPreviewDetached?.()
    this.emit({ type: 'stateChanged', snapshot: this.snapshot() })
  }

  /** `onReady` means "recording can start": it is delivered only while
   *  the session would actually admit `startRecording`. Adapters emit
   *  their availability/interruption observations in their own order, so
   *  a ready signal that arrives before those updates settles pends
   *  until the next lifecycle event makes admission possible — or is
   *  dropped if readiness is retracted first. */
  private flushPendingReady() {
    const pending = this.pendingOnReady
    if (!pending || this.interrupted || !this.cameraAvailable || !this.backend.previewReady()) {
      return
    }

    this.pendingOnReady = undefined
    pending()
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
      switchingCamera: this.cameraSwitch !== undefined,
      activeCamera: this.activeCamera ? { ...this.activeCamera } : undefined,
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

  async permissions(): Promise<{
    camera: CameraPermissionStatus
    microphone: CameraPermissionStatus
  }> {
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

    // Store a swallowed continuation — a rejected backend call must not
    // poison the chain and refuse every later request with the original
    // error. The caller still receives the real rejection.
    this.requestChains.set(
      kind,
      chain.catch(() => 'unknown' as CameraPermissionStatus),
    )

    return chain
  }

  async capabilities(): Promise<CameraSessionCapabilities> {
    const capabilities = await this.backend.getCapabilities()
    this.lastCapabilities = capabilities
    return capabilities
  }

  focusAtPoint(point: CameraPreviewPoint): void {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw issue('invalidArgument', 'focusAtPoint', 'point.x and point.y must be finite numbers')
    }

    if (this.disposed || this.disposeRequested) {
      return
    }

    this.backend.focusAtPoint?.({
      x: Math.min(1, Math.max(0, point.x)),
      y: Math.min(1, Math.max(0, point.y)),
    })
  }

  zoomState(): CameraZoomState | undefined {
    if (this.disposed || this.disposeRequested) {
      return undefined
    }

    return this.backend.zoomState?.()
  }

  setZoom(ratio: number): void {
    if (!Number.isFinite(ratio)) {
      throw issue('invalidArgument', 'setZoom', 'ratio must be a finite number')
    }

    const state = this.zoomState()
    if (!state || !this.backend.setZoom) {
      return
    }

    this.backend.setZoom(Math.min(state.maxZoom, Math.max(state.minZoom, ratio)))
  }

  private assertConfigurable() {
    if (this.cameraSwitch) {
      throw issue('busy', 'configure', 'A camera switch is still settling')
    }
    if (this.disposed || this.disposeRequested) {
      throw issue('invalidState', 'configure', 'CameraSession is disposed')
    }

    if (this.state !== 'idle') {
      throw issue('invalidState', 'configure', `CameraSession cannot configure while ${this.state}`)
    }
  }

  async switchCamera(camera: CameraSelection): Promise<void> {
    const attempt = this.attempt
    if (this.disposeRequested || this.disposed || this.state !== 'recording' || !attempt) {
      throw issue('invalidState', 'switchCamera', 'Camera switching requires an active recording')
    }

    if (this.cameraSwitch) {
      throw issue('busy', 'switchCamera', 'A camera switch is already pending')
    }

    const pending = {
      cancelled: false,
      cancel: undefined as (() => void) | undefined,
      abort: () => {},
    }
    const aborted = new Promise<never>((_resolve, reject) => {
      pending.abort = () => {
        if (pending.cancelled) {
          return
        }
        pending.cancelled = true
        try {
          pending.cancel?.()
        } catch {
          // Cancellation cannot prevent stop/finalization ownership.
        }
        reject(issue('invalidState', 'switchCamera', 'Camera switching was cancelled'))
      }
    })
    this.cameraSwitch = pending
    this.emit({ type: 'stateChanged', snapshot: this.snapshot() })
    const check = () => {
      if (pending.cancelled || this.attempt !== attempt || this.state !== 'recording') {
        throw issue('invalidState', 'switchCamera', 'The recording is no longer active')
      }
    }
    try {
      await Promise.race([
        (async () => {
          const capabilities = await this.capabilities()
          check()
          if (!capabilities.cameraSwitchDuringRecording || !this.backend.switchCamera) {
            throw issue(
              'unsupportedConfiguration',
              'switchCamera',
              'Live camera switching is unavailable on this host',
            )
          }
          this.validateCameraSelection(camera, capabilities, 'switchCamera')
          if (
            (typeof camera === 'object' && camera.deviceId === this.activeCamera?.id) ||
            (camera !== 'default' && camera === this.activeCamera?.facing)
          ) {
            return
          }

          const operation = this.backend.switchCamera(camera)
          pending.cancel = () => operation.cancel()
          if (pending.cancelled) {
            operation.cancel()
          }
          const selected = await operation.completion
          check()
          try {
            operation.commit?.()
          } catch (error) {
            try {
              operation.cancel()
            } catch {
              /* Preserve the original commit error. */
            }

            throw error
          }
          this.config = { ...this.config, camera }
          this.activeCamera = selected
        })(),
        aborted,
      ])
    } finally {
      if (this.cameraSwitch === pending) {
        this.cameraSwitch = undefined
        this.emit({ type: 'stateChanged', snapshot: this.snapshot() })
      }
    }
  }

  async configure(next: Partial<CameraSessionConfig>): Promise<void> {
    this.assertConfigurable()
    const merged: CameraSessionConfig = { ...this.config, ...next }
    const capabilities = await this.capabilities()
    // Preview readiness can admit auto-recording (or the owner can
    // dispose) while capability discovery is pending. Never reconfigure
    // that live attempt using an earlier idle-state observation.
    this.assertConfigurable()
    this.validateCameraSelection(merged.camera, capabilities)
    this.config = merged
    this.backend.configure?.(merged)
  }

  private validateCameraSelection(
    camera: CameraSelection | undefined,
    capabilities: CameraSessionCapabilities,
    operation = 'configure',
  ) {
    if (camera && typeof camera === 'object' && 'deviceId' in camera) {
      const known = capabilities.cameras.some((entry) => entry.id === camera.deviceId)
      if (!known) {
        throw issue(
          'unsupportedConfiguration',
          operation,
          `Camera device '${camera.deviceId}' is not available`,
        )
      }
    } else if (camera === 'front' || camera === 'back') {
      const known = capabilities.cameras.some((entry) => entry.facing === camera)
      if (!known && capabilities.cameras.some((entry) => entry.facing !== undefined)) {
        throw issue(
          'unsupportedConfiguration',
          operation,
          `No ${camera}-facing camera is available`,
        )
      }
    }
  }

  private requestStop(cause: MovieEndReason) {
    this.cameraSwitch?.abort()
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

    this.flushPendingReady()
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

    this.flushPendingReady()
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

    if (this.state !== 'idle' || this.attempt || this.cameraSwitch) {
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

    let destinationPath: string | undefined
    if (options.destinationFileUrl !== undefined) {
      if (!options.destinationFileUrl.startsWith('file://')) {
        throw issue('invalidArgument', operation, 'destinationFileUrl must be a local file:// URL')
      }

      try {
        destinationPath = decodeURIComponent(options.destinationFileUrl.slice('file://'.length))
      } catch (cause) {
        throw issue(
          'invalidArgument',
          operation,
          'destinationFileUrl is not valid percent-encoding',
          { cause },
        )
      }
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
        this.activeCamera = {
          id: configuration.cameraId,
          label:
            this.lastCapabilities?.cameras.find((camera) => camera.id === configuration.cameraId)
              ?.label ?? configuration.cameraId,
          facing: configuration.facing,
        }
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

        this.cameraSwitch?.abort()
        current.cause ??= reason
        current.state = 'finalizing'
        this.setState('finalizing')
      },
      settled: (result) => {
        const current = this.attempt
        if (!current || current.id !== id || current.state === 'settled') {
          return
        }
        this.cameraSwitch?.abort()

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
      destinationPath,
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
    this.pendingOnReady = undefined
    this.backend.setObserver(undefined)
    try {
      await this.backend.release()
    } finally {
      this.setState('disposed')
    }
  }
}
