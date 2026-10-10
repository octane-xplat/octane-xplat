/** Shared camera-session and movie-recording contract.
 *
 *  A `CameraSession` owns one camera acquisition shared between a
 *  `CameraView` preview and at most one movie-recording attempt. Recording
 *  settles with an immutable `MovieOutcome` only after the local movie is
 *  finalized and its metadata is known — a returned clip is always
 *  reopenable through `openOutput`.
 *
 *  This module is platform-pure: adapters implement
 *  `CameraSessionBackend` per host. Adapters that do not support capture
 *  yet report `supported: false` and reject `startRecording` with
 *  `unsupportedPlatform` instead of fabricating behavior.
 */

/** Permission resource a `CameraSession` can inspect or request. */
export type CameraPermissionKind = 'camera' | 'microphone'

/** Portable authorization state. Checking never prompts. `blocked` and
 *  `unknown` exist so hosts that cannot distinguish user denial from
 *  policy refusal do not fabricate `restricted`. */
export type CameraPermissionStatus =
	| 'notDetermined'
	| 'granted'
	| 'denied'
	| 'restricted'
	| 'blocked'
	| 'unknown'
	| 'unavailable'

/** Portable error categories. `unsupported*` covers missing host features,
 *  devices, or capture configurations — including adapters that are not
 *  implemented yet during staged delivery. */
export type CameraCaptureErrorKind =
	| 'permissionDenied'
	| 'permissionRestricted'
	| 'permissionBlocked'
	| 'unsupportedPlatform'
	| 'unsupportedConfiguration'
	| 'unavailable'
	| 'busy'
	| 'invalidState'
	| 'invalidArgument'
	| 'destinationUnavailable'
	| 'insufficientStorage'
	| 'noMedia'
	| 'captureFailed'
	| 'finalizationFailed'
	| 'storageFailed'
	| 'configurationMissing'

/** Structured diagnostic carried by failures and non-fatal warnings. */
export interface CaptureIssue {
	kind: CameraCaptureErrorKind
	/** Operation being attempted, e.g. 'startRecording', 'finalize'. */
	operation: string
	message: string
	permission?: CameraPermissionKind
	/** Host-specific detail for logging; never required for control flow. */
	cause?: unknown
}

/** Error thrown or settled by the session API. Satisfies `CaptureIssue`
 *  so `error.kind` drives control flow without unwrapping. */
export class CameraCaptureError extends Error implements CaptureIssue {
	kind: CameraCaptureErrorKind
	operation: string
	permission?: CameraPermissionKind
	cause?: unknown

	constructor(issue: Omit<CaptureIssue, 'cause'> & { cause?: unknown }) {
		super(issue.message)
		this.name = 'CameraCaptureError'
		this.kind = issue.kind
		this.operation = issue.operation
		this.permission = issue.permission
		this.cause = issue.cause
	}
}

export type CameraFacing = 'front' | 'back'

export type CameraOrientation =
	| 'portrait'
	| 'portraitUpsideDown'
	| 'landscapeLeft'
	| 'landscapeRight'
	| 'unspecified'

/** Camera selection for `CameraSessionConfig.camera`. Desktop and browser
 *  hosts expose device identities instead of front/back semantics. */
export type CameraSelection = 'default' | 'front' | 'back' | { deviceId: string }

export interface CameraSessionConfig {
	/** Lens or device identity. Default `'default'`: rear when available. */
	camera?: CameraSelection
	/** Include an audio track; requires microphone permission. Default
	 *  false — silent capture is a deliberate app choice, never a
	 *  fallback from denied microphone access. */
	audio?: boolean
	/** Capture profile. `'standard'` targets 720p at 30 fps and may select
	 *  a device-supported alternative; the started attempt discloses the
	 *  actual configuration. */
	profile?: 'standard'
}

/** Resolution/frame-rate combination advertised by capability discovery.
 *  Entries are supported combinations, not independent lists. */
export interface CameraProfileCapability {
	profile: 'standard'
	width: number
	height: number
	frameRate: number
}

export interface CameraDeviceInfo {
	id: string
	label: string
	facing?: CameraFacing
}

/** What the session's host can do right now. `supported: false` means the
 *  adapter or host cannot record (reason explains); `available` reflects
 *  current hardware/permission state and changes over time. */
export interface CameraSessionCapabilities {
	supported: boolean
	/** Why capture is unsupported or currently unavailable. */
	reason?: string
	available: boolean
	cameras: CameraDeviceInfo[]
	profiles: CameraProfileCapability[]
	/** The session can add an audio track when permission allows. */
	audio: boolean
	/** Fixed orientations the source can lock for a take. */
	orientations: CameraOrientation[]
	/** `native` enforcement can still overshoot at media boundaries;
	 *  `bestEffort` limits are scheduled and may overshoot more. */
	durationLimit: 'native' | 'bestEffort'
	/** Where `elapsedMs` comes from while recording. */
	elapsedTime: 'nativeMedia' | 'estimated'
	output: {
		mimeType: string
		container: string
		/** `appPrivateFile` output survives dispose and app restart;
		 *  `originLocal` is browser storage subject to site-data clearing. */
		storage: 'appPrivateFile' | 'originLocal'
		/** Accepts an app-supplied `destinationFileUrl` on start. */
		destinationFileUrl: boolean
	}
}

export type CameraRecorderState = 'idle' | 'starting' | 'recording' | 'finalizing' | 'disposed'

/** Frozen capture configuration reported once capture actually begins. */
export interface EffectiveCaptureConfig {
	cameraId: string
	facing?: CameraFacing
	audio: boolean
	width: number
	height: number
	frameRate: number
	orientation: CameraOrientation
	mimeType: string
	container: string
}

export interface CameraSessionSnapshot {
	state: CameraRecorderState
	/** Non-prompting last-known authorization, refreshed by `permissions()`
	 *  and `requestPermission()`. */
	permission: Record<CameraPermissionKind, CameraPermissionStatus>
	/** Camera hardware/driver availability, separate from recorder state. */
	cameraAvailable: boolean
	/** An active preview view is attached to this session. */
	previewAttached: boolean
	interrupted: boolean
	attempt?: {
		id: string
		state: 'starting' | 'recording' | 'finalizing'
		elapsedMs: number
		configuration?: EffectiveCaptureConfig
	}
}

/** What ended a capture attempt. `interrupted` covers system suspension
 *  and preview teardown; `previewReleased` distinguishes an app-driven
 *  deactivation from an OS interruption. */
export type MovieEndReason =
	| 'stopped'
	| 'maximumDuration'
	| 'interrupted'
	| 'backgrounded'
	| 'cameraUnavailable'
	| 'previewReleased'
	| 'disposed'
	| 'captureError'

/** Portable completed-output reference. `resourceId` reopens the clip
 *  through `openOutput`; `fileUrl` additionally guarantees file-backed
 *  native output. `synthetic` marks test-seam clips. */
export type MovieOutput =
	| {
			kind: 'nativeFile'
			resourceId: string
			fileUrl: string
			synthetic?: boolean
	  }
	| {
			kind: 'browserStorage'
			resourceId: string
			retention: 'persistent' | 'bestEffort'
			synthetic?: boolean
	  }

export interface MovieClip {
	output: MovieOutput
	mimeType: string
	/** Authoritative duration read from the finalized movie. */
	durationMs: number
	/** Presentation dimensions after the orientation transform. */
	width: number
	height: number
	orientation: CameraOrientation
	/** Whether the finalized movie actually contains an audio track.
	 *  Missing requested audio is a failure, not silent capture. */
	hasAudio: boolean
}

/** One immutable terminal result per admitted attempt. `partial` marks a
 *  usable clip ended early by an external condition — still a success;
 *  app review decides whether to keep it. */
export type MovieOutcome =
	| {
			kind: 'clip'
			clip: MovieClip
			endReason: MovieEndReason
			partial: boolean
			warning?: CaptureIssue
	  }
	| {
			kind: 'failed'
			endReason: MovieEndReason
			stage: 'preparation' | 'capture' | 'finalization' | 'storage'
			error: CaptureIssue
	  }

/** Ordered lifecycle observation, correlated to an attempt when relevant. */
export type CameraSessionEvent =
	| { type: 'stateChanged'; snapshot: CameraSessionSnapshot }
	| { type: 'started'; attemptId: string; configuration: EffectiveCaptureConfig }
	| { type: 'finished'; attemptId: string; outcome: MovieOutcome }
	| {
			type: 'interruption'
			phase: 'began' | 'ended'
			reason?: CameraInterruptionReason
	  }
	| { type: 'availability'; available: boolean }

export type CameraInterruptionReason =
	| 'background'
	| 'audioInUse'
	| 'cameraInUse'
	| 'multitasking'
	| 'systemPressure'
	| 'unknown'

export interface StartRecordingOptions {
	/** Positive finite milliseconds. Enforcement precision comes from
	 *  `capabilities().durationLimit`; the final duration is read from
	 *  the movie and may overshoot. */
	maximumDurationMs?: number
	/** Fixed orientation for the take. Must appear in
	 *  `capabilities().orientations`; omit for the source default. */
	orientation?: CameraOrientation
	/** App-supplied writable local `file://` URL (native hosts only,
	 *  where `capabilities().output.destinationFileUrl` is true).
	 *  Existing files are never overwritten. */
	destinationFileUrl?: string
}

/** One admitted capture attempt. `completion` is available immediately and
 *  settles exactly once with the terminal outcome; repeated `stop()`
 *  joins the same finalization. */
export interface MovieTake {
	readonly id: string
	readonly state: 'starting' | 'recording' | 'finalizing' | 'settled'
	/** Elapsed capture time in milliseconds; excludes preparation and
	 *  finalization. Source identified by `capabilities().elapsedTime`. */
	readonly elapsedMs: number
	readonly completion: Promise<MovieOutcome>
	/** Requests stop and joins finalization. Returns `completion`. */
	stop(): Promise<MovieOutcome>
}

/** Reopened access to a stored clip. `release()` frees temporary access;
 *  it never deletes the clip. */
export interface MovieOutputHandle {
	/** Playable/readable location for the clip. */
	readonly url: string
	readonly fileUrl?: string
	release(): void
}

export interface CameraSession {
	/** Non-prompting permission inspection; may return `unknown` when the
	 *  host cannot observe authorization. */
	permissions(): Promise<Record<CameraPermissionKind, CameraPermissionStatus>>
	/** Runs the system authorization flow for one kind. Calls are
	 *  serialized; a status other than `notDetermined` returns without
	 *  prompting. */
	requestPermission(kind: CameraPermissionKind): Promise<CameraPermissionStatus>
	capabilities(): Promise<CameraSessionCapabilities>
	snapshot(): CameraSessionSnapshot
	/** Ordered lifecycle events. A caller never loses a result by
	 *  subscribing late — `completion` is authoritative. Listener
	 *  exceptions do not change capture. */
	subscribe(listener: (event: CameraSessionEvent) => void): () => void
	/** Replaces configuration while idle. Validates against current
	 *  capabilities and rejects with `invalidState` during an attempt. */
	configure(config: Partial<CameraSessionConfig>): Promise<void>
	/** Admits one capture attempt. Throws `CameraCaptureError` before
	 *  admission for invalid arguments, busy, invalid state, or
	 *  unavailable camera — no attempt is created. */
	startRecording(options?: StartRecordingOptions): MovieTake
	/** Reopens a stored output for playback or reading. */
	openOutput(output: MovieOutput): Promise<MovieOutputHandle>
	/** Requests stop on any active attempt, awaits finalization, then
	 *  releases camera ownership. */
	dispose(): Promise<void>
}
