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
  /** Error category discriminator. */
  kind: CameraCaptureErrorKind
  /** Operation being attempted, e.g. 'startRecording', 'finalize'. */
  operation: string
  /** Human-readable failure description. */
  message: string
  /** Camera/mic authorization state. */
  permission?: CameraPermissionKind
  /** Underlying platform error when one exists — diagnostic only, never required for control flow. */
  cause?: unknown
}

/** Error thrown or settled by the session API. Satisfies `CaptureIssue`
 *  so `error.kind` drives control flow without unwrapping. */
export class CameraCaptureError extends Error implements CaptureIssue {
  kind: CameraCaptureErrorKind
  operation: string
  permission?: CameraPermissionKind
  /** Underlying platform error when one exists — diagnostic only. */
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

/** Lens direction vocabulary. */
export type CameraFacing = 'front' | 'back'

/** A normalized position on the live preview as the user sees it:
 *  `{x: 0, y: 0}` is the top-left corner and `{x: 1, y: 1}` is
 *  bottom-right, independent of sensor orientation and front-camera
 *  mirroring. The `CameraView` `onTap` event and
 *  `CameraSession.focusAtPoint` share this space. */
export interface CameraPreviewPoint {
  /** Focus/exposure point x, normalized 0-1. */
  x: number
  /** Focus/exposure point y, normalized 0-1. */
  y: number
}

/** Normalized pinch on the preview: `scale` is cumulative from gesture
 *  start (1 = no change) and `focus` is the focal point in the same
 *  preview space as `CameraPreviewPoint`. */
export interface CameraPinchEvent {
  /** Scale factor relative to gesture start. */
  scale: number
  /** Gesture phase — began → moved → ended/cancelled. */
  state: 'began' | 'moved' | 'ended' | 'cancelled'
  /** Focal point normalized to the preview; falls back to the center when
   *  the platform does not report one. */
  focus: CameraPreviewPoint
}

/** Capture orientation vocabulary. */
export type CameraOrientation =
  | 'portrait'
  | 'portraitUpsideDown'
  | 'landscapeLeft'
  | 'landscapeRight'
  | 'unspecified'

/** Camera selection for `CameraSessionConfig.camera`. Desktop and browser
 *  hosts expose device identities instead of front/back semantics. */
export type CameraSelection = 'default' | 'front' | 'back' | { deviceId: string }

/** Configuration for opening a session. */
export interface CameraSessionConfig {
  /** Lens or device identity. Default `'default'`: rear when available. */
  camera?: CameraSelection
  /** Include an audio track; requires microphone permission. Default
   *  false — silent capture is a deliberate app choice, never a
   *  fallback from denied microphone access. */
  audio?: boolean
  /** iOS only: allow haptics AND system sounds while this session owns microphone
   *  capture (including preview). Other platforms ignore this iOS audio-session
   *  policy. Defaults to leaving the existing app policy unchanged. The previous
   *  value is restored after the last opted-in camera owner stops audio capture.
   *  External audio-session owners must coordinate policy changes with the app. */
  ios?: { allowHapticsAndSystemSoundsDuringRecording?: boolean }
  /** Capture profile. `'standard'` targets 720p at 30 fps and may select
   *  a device-supported alternative; the started attempt discloses the
   *  actual configuration. */
  profile?: 'standard'
}

/** Resolution/frame-rate combination advertised by capability discovery.
 *  Entries are supported combinations, not independent lists. */
export interface CameraProfileCapability {
  /** Capture profile (resolution/framerate preset). */
  profile: 'standard'
  /** Frame width in pixels. */
  width: number
  /** Frame height in pixels. */
  height: number
  /** Frames per second. */
  frameRate: number
}

/** Live zoom state of the active camera. Ratios are relative to the
 *  device's unzoomed field of view: `1` is no zoom. Bounds belong to the
 *  currently bound device — a camera swap can change them. */
export interface CameraZoomState {
  /** Current zoom ratio. */
  zoom: number
  /** Minimum ratio the active device accepts (1, or below 1 when the
   *  device switches to a wider constituent camera). */
  minZoom: number
  /** Maximum ratio the active device accepts. */
  maxZoom: number
}

/** One usable camera device. */
export interface CameraDeviceInfo {
  /** Device-stable camera identifier. */
  /** Store-assigned id. */

  id: string
  /** Human-readable device name. */
  label: string
  /** Lens direction. */
  facing?: CameraFacing
}

/** What the session's host can do right now. `supported: false` means the
 *  adapter or host cannot record (reason explains); `available` reflects
 *  current hardware/permission state and changes over time. */
export interface CameraSessionCapabilities {
  /** A camera backend exists on this leaf. */
  supported: boolean
  /** Why capture is unsupported or currently unavailable. */
  reason?: string
  /** At least one usable camera is present. */
  available: boolean
  /** Detected camera devices. */
  cameras: CameraDeviceInfo[]
  /** Capture profiles the session can run. */
  profiles: CameraProfileCapability[]
  /** The session can add an audio track when permission allows. */
  audio: boolean
  /** Live `switchCamera` preserves the take, continuous requested audio,
   *  held video during acquisition, and one output file. False means
   *  camera selection is available only through idle `configure`. */
  cameraSwitchDuringRecording: boolean
  /** `focusAtPoint` can move autofocus metering on the active camera —
   *  false on fixed-focus devices (common for front cameras) and on
   *  platforms without point-of-interest metering. */
  focusPointOfInterest: boolean
  /** `focusAtPoint` can move auto-exposure metering on the active
   *  camera. */
  exposurePointOfInterest: boolean
  /** The active camera reports live zoom control through `zoomState`
   *  and `setZoom` (`zoomState().maxZoom > minZoom`). */
  zoom: boolean
  /** Fixed orientations the source can lock for a take. */
  orientations: CameraOrientation[]
  /** `native` enforcement can still overshoot at media boundaries;
   *  `bestEffort` limits are scheduled and may overshoot more. */
  durationLimit: 'native' | 'bestEffort'
  /** Where `elapsedMs` comes from while recording. */
  elapsedTime: 'nativeMedia' | 'estimated'
  /** Where the clip was written. */
  output: {
    /** Output MIME type. */
    mimeType: string
    /** File container format. */
    container: string
    /** `appPrivateFile` output survives dispose and app restart;
     *  `originLocal` is browser storage subject to site-data clearing. */
    storage: 'appPrivateFile' | 'originLocal'
    /** Accepts an app-supplied `destinationFileUrl` on start. */
    destinationFileUrl: boolean
  }
}

/** Recorder lifecycle states. */
export type CameraRecorderState = 'idle' | 'starting' | 'recording' | 'finalizing' | 'disposed'

/** Frozen capture configuration reported once capture actually begins. */
export interface EffectiveCaptureConfig {
  /** The CameraDeviceInfo.id in use. */
  cameraId: string
  /** Lens direction. */
  facing?: CameraFacing
  /** Whether audio capture is enabled for video. */
  audio: boolean
  /** Frame width in pixels. */
  width: number
  /** Frame height in pixels. */
  height: number
  /** Frames per second. */
  frameRate: number
  /** Capture orientation. */
  orientation: CameraOrientation
  /** Output MIME type. */
  mimeType: string
  /** File container format. */
  container: string
}

/** Observable session state. */
export interface CameraSessionSnapshot {
  /** A live switch is pending. Recorder state remains `recording`. */
  switchingCamera: boolean
  /** Latest camera confirmed by a started take or successful live switch.
   *  The attempt configuration remains the immutable starting config. */
  activeCamera?: CameraDeviceInfo
  /** Current lifecycle state. */
  state: CameraRecorderState
  /** Non-prompting last-known authorization, refreshed by `permissions()`
   *  and `requestPermission()`. */
  permission: Record<CameraPermissionKind, CameraPermissionStatus>
  /** Camera hardware/driver availability, separate from recorder state. */
  cameraAvailable: boolean
  /** An active preview view is attached to this session. */
  previewAttached: boolean
  /** Interrupted by the OS (call, route change, …). */
  interrupted: boolean
  /** Retry count for the current operation. */
  attempt?: {
    /** Device-stable camera identifier. */
    id: string
    /** Current lifecycle state. */
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
      /** Error category discriminator. */
      kind: 'nativeFile'
      /** Store handle for the clip (gallery/native ref). */
      resourceId: string
      /** Filesystem URL of the written clip. */
      /** Filesystem URL of the written clip. */

      fileUrl: string
      /** True for generated/test clips, not real captures. */
      synthetic?: boolean
    }
  | {
      /** Error category discriminator. */
      kind: 'browserStorage'
      /** Store handle for the clip (gallery/native ref). */
      resourceId: string
      retention: 'persistent' | 'bestEffort'
      /** True for generated/test clips, not real captures. */
      synthetic?: boolean
    }

/** One finished recording. */
export interface MovieClip {
  /** Where the clip was written. */
  output: MovieOutput
  /** Output MIME type. */
  mimeType: string
  /** Authoritative duration read from the finalized movie. */
  durationMs: number
  /** Presentation dimensions after the orientation transform. */
  width: number
  /** Frame height in pixels. */
  height: number
  /** Capture orientation. */
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
      /** Error category discriminator. */
      kind: 'clip'
      clip: MovieClip
      /** Why recording stopped. */
      endReason: MovieEndReason
      partial: boolean
      warning?: CaptureIssue
    }
  | {
      /** Error category discriminator. */
      kind: 'failed'
      /** Why recording stopped. */
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
      /** Output kind discriminator. */
      type: 'interruption'
      phase: 'began' | 'ended'
      reason?: CameraInterruptionReason
    }
  | { type: 'availability'; available: boolean }

/** Why the OS interrupted capture. */
export type CameraInterruptionReason =
  | 'background'
  | 'audioInUse'
  | 'cameraInUse'
  | 'multitasking'
  | 'systemPressure'
  | 'unknown'

/** Options for session.startRecording(). */
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
  /** Attempt identifier — unique per `startRecording` call. */
  readonly id: string
  /** Lifecycle phase; terminal value is `settled` (check `completion` for the outcome). */
  readonly state: 'starting' | 'recording' | 'finalizing' | 'settled'
  /** Elapsed capture time in milliseconds; excludes preparation and
   *  finalization. Source identified by `capabilities().elapsedTime`. */
  readonly elapsedMs: number
  /** Terminal outcome — resolves exactly once; `stop()` returns this same promise. */
  readonly completion: Promise<MovieOutcome>
  /** Requests stop and joins finalization. Returns `completion`. */
  stop(): Promise<MovieOutcome>
}

/** Reopened access to a stored clip. `release()` frees temporary access;
 *  it never deletes the clip. */
export interface MovieOutputHandle {
  /** Playable/readable location for the clip. */
  readonly url: string
  /** On-disk path when the clip is file-backed; absent for memory/remote storage. */
  readonly fileUrl?: string
  /** Free temporary access to the clip — never deletes it. */
  release(): void
}

/** An owned camera session — dispose when done. */
export interface CameraSession {
  /** Non-prompting permission inspection; may return `unknown` when the
   *  host cannot observe authorization. */
  permissions(): Promise<Record<CameraPermissionKind, CameraPermissionStatus>>
  /** Runs the system authorization flow for one kind. Calls are
   *  serialized; a status other than `notDetermined` returns without
   *  prompting. */
  requestPermission(kind: CameraPermissionKind): Promise<CameraPermissionStatus>
  /** Hardware/OS limits for this session — polled live, so values can change as devices come and go. */
  capabilities(): Promise<CameraSessionCapabilities>
  /** Point-in-time session state — subscribe for changes. */
  snapshot(): CameraSessionSnapshot
  /** Ordered lifecycle events. A caller never loses a result by
   *  subscribing late — `completion` is authoritative. Listener
   *  exceptions do not change capture. */
  subscribe(listener: (event: CameraSessionEvent) => void): () => void
  /** Tap-to-focus: meters one autofocus/auto-exposure pass at a
   *  normalized preview-space point (see `CameraPreviewPoint`), pairing
   *  with the `CameraView` `onTap` event. No-ops while no preview is
   *  attached, after `dispose`, and on hosts without point-of-interest
   *  metering — `capabilities()` reports `focusPointOfInterest` and
   *  `exposurePointOfInterest` separately. Out-of-range coordinates
   *  clamp to the preview edge; non-finite coordinates throw
   *  `invalidArgument`. Metering is per-device state: a camera swap
   *  through `configure` returns focus/exposure to the new device's
   *  default. */
  focusAtPoint(point: CameraPreviewPoint): void
  /** Live zoom state of the active camera (see `CameraZoomState`).
   *  Returns `undefined` while no camera is bound, after `dispose`, and
   *  on hosts or devices without zoom control — check
   *  `capabilities().zoom` before showing zoom UI. Values change with
   *  the bound device: re-read after `configure` or `switchCamera`. */
  zoomState(): CameraZoomState | undefined
  /** Writes a zoom ratio on the active camera without reconfiguring the
   *  session; works while recording. Values clamp to the active
   *  device's live `zoomState()` bounds on every write. No-ops while no
   *  camera is bound, after `dispose`, and on hosts without zoom
   *  control. Non-finite values throw `invalidArgument`. */
  setZoom(ratio: number): void
  /** Replaces configuration while idle. Validates against current
   *  capabilities and rejects with `invalidState` during an attempt,
   *  including one admitted while capability discovery was pending.
   *  Live camera changes use `switchCamera` when advertised; rejection
   *  leaves the take running and does not request stop. */
  configure(config: Partial<CameraSessionConfig>): Promise<void>
  /** Change only the camera during `recording`. Audio and elapsed time
   *  continue while video holds its last frame. Resolves when the replacement
   *  camera is producing frames on the existing recording path; this is source
   *  readiness, not an encoded-frame acknowledgement. Completion still belongs
   *  to the original take. Rejects `busy` for overlapping switches,
   *  `invalidState` outside recording, and `unsupportedConfiguration`
   *  when the host cannot preserve this contract. Use idle `configure`
   *  before starting a take. Cancellation never restarts recording.
   *  @example
   *  import type { CameraSession } from '@octane-xplat/camera'
   *  async function faceFront(session: CameraSession): Promise<void> {
   *    await session.switchCamera('front')
   *  }
   */
  switchCamera(camera: CameraSelection): Promise<void>
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
