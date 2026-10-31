import type { CameraInterruptionReason, CameraPermissionKind, CameraPermissionStatus, CameraPreviewPoint, CameraSession, CameraSessionCapabilities, CameraSessionConfig, CameraSessionEvent, CameraSessionSnapshot, CaptureIssue, EffectiveCaptureConfig, MovieEndReason, MovieOutput, MovieOutputHandle, MovieTake, StartRecordingOptions } from './types';
/** Result an adapter reports when a capture attempt settles. Media
 *  metadata is already read from the finalized movie by the adapter. */
export type BackendSettle = {
    kind: 'clip';
    output: MovieOutput;
    mimeType: string;
    durationMs: number;
    width: number;
    height: number;
    orientation: EffectiveCaptureConfig['orientation'];
    hasAudio: boolean;
    /** Native duration-limit enforcement ended the take. */
    limitReached?: boolean;
    /** Adapter-driven endings when no earlier app/lifecycle cause exists. */
    endReason?: MovieEndReason;
    warning?: CaptureIssue;
} | {
    kind: 'failed';
    stage: 'preparation' | 'capture' | 'finalization' | 'storage';
    issue: CaptureIssue;
};
/** Per-attempt callbacks handed to `startCapture`. */
export interface BackendCaptureSink {
    /** Native capture actually began; exactly once per settled attempt. */
    started(config: EffectiveCaptureConfig): void;
    /** Capture has ended; metadata verification and storage still own the attempt. */
    finishing(reason?: MovieEndReason): void;
    /** Terminal result; exactly once per admitted attempt. */
    settled(result: BackendSettle): void;
}
export interface BackendCaptureRequest {
    audio: boolean;
    orientation: EffectiveCaptureConfig['orientation'] | undefined;
    maximumDurationMs: number | undefined;
    /** Resolved writable path for native adapters. */
    destinationPath: string | undefined;
}
/** Adapter-owned preview attach. `listener` reports preview lifecycle;
 *  returns the detach function. */
export interface BackendPreviewListener {
    onReady?: () => void;
    onError?: (issue: CaptureIssue) => void;
}
/** Platform adapter surface driven by the shared session core. Adapters
 *  own permission policy, capability discovery, capture, and local output
 *  access; the core owns states, ordering, causes, and outcomes. */
export interface CameraSessionBackend {
    readonly platform: string;
    /** False when the adapter cannot capture on this host; the core
     *  rejects `startRecording` with `unsupportedPlatform`. */
    readonly supported: boolean;
    checkPermission(kind: CameraPermissionKind): Promise<CameraPermissionStatus>;
    requestPermission(kind: CameraPermissionKind): Promise<CameraPermissionStatus>;
    getCapabilities(): Promise<CameraSessionCapabilities>;
    /** An active, ready preview is attached and the camera source is
     *  running — the admission requirement for `startRecording`. */
    previewReady(): boolean;
    /** Attach the shared-source preview to a platform view. */
    attachPreview(host: unknown, listener?: BackendPreviewListener): () => void;
    /** Replace configuration while idle; throws CameraCaptureError. */
    configure?(config: CameraSessionConfig): void;
    /** Meter one autofocus/auto-exposure pass at a normalized preview-space
     *  point — the tap-to-focus primitive. Absent means the adapter cannot
     *  meter at a point; the core turns it into a no-op. */
    focusAtPoint?(point: CameraPreviewPoint): void;
    /** Synchronous platform-specific admission checks; creates no attempt on failure. */
    validateStart?(options: StartRecordingOptions): void;
    /** Begin capture for an admitted attempt. Async failures settle via
     *  `sink.settled`; a synchronous throw settles as a preparation failure. */
    startCapture(request: BackendCaptureRequest, sink: BackendCaptureSink): void;
    /** Request capture stop; settlement still arrives via the sink. */
    stopCapture(): void;
    /** Elapsed capture time in ms for the in-flight attempt. */
    elapsedMs(): number;
    openOutput(output: MovieOutput): Promise<MovieOutputHandle>;
    /** Release camera ownership. The core calls this only after any
     *  in-flight attempt has settled. */
    release(): Promise<void>;
    /** Reattach/reconfigure bookkeeping when the preview view is detached
     *  while an attempt is settling — the adapter keeps hardware until
     *  settlement, then stops. */
    onPreviewDetached?(): void;
    /** Lifecycle observations the adapter emits at any time. */
    setObserver(observer: BackendObserver | undefined): void;
}
export interface BackendObserver {
    interruption(phase: 'began' | 'ended', reason?: CameraInterruptionReason): void;
    availability(available: boolean): void;
    /** Preview became ready/unready (session running state changed). */
    previewReady(ready: boolean): void;
}
/** Collapse '.' and '..' segments without touching the filesystem — the
 *  adapters' app-private containment checks compare against this canonical
 *  form, so a '..' inside the requested path can never keep the root
 *  prefix while escaping it. */
export declare const canonicalizePath: (raw: string, separator?: string) => string;
/** The concrete session object wrapping a platform backend. Internal to
 *  the package; `CameraSession` is the public shape. */
export declare class SharedCameraSession implements CameraSession {
    private backend;
    private config;
    private listeners;
    private state;
    private permission;
    private cameraAvailable;
    private previewAttached;
    private interrupted;
    private pendingOnReady;
    private disposeRequested;
    private disposed;
    private lastCapabilities;
    private requestChains;
    private attempt;
    constructor(backend: CameraSessionBackend, config: CameraSessionConfig);
    /** Package-internal: attach a preview host to this session. */
    attach(host: unknown, listener?: BackendPreviewListener): () => void;
    get attached(): boolean;
    private detachInternal;
    /** `onReady` means "recording can start": it is delivered only while
     *  the session would actually admit `startRecording`. Adapters emit
     *  their availability/interruption observations in their own order, so
     *  a ready signal that arrives before those updates settles pends
     *  until the next lifecycle event makes admission possible — or is
     *  dropped if readiness is retracted first. */
    private flushPendingReady;
    private emit;
    private setState;
    snapshot(): CameraSessionSnapshot;
    subscribe(listener: (event: CameraSessionEvent) => void): () => void;
    permissions(): Promise<{
        camera: CameraPermissionStatus;
        microphone: CameraPermissionStatus;
    }>;
    requestPermission(kind: CameraPermissionKind): Promise<CameraPermissionStatus>;
    capabilities(): Promise<CameraSessionCapabilities>;
    focusAtPoint(point: CameraPreviewPoint): void;
    configure(next: Partial<CameraSessionConfig>): Promise<void>;
    private validateCameraSelection;
    private requestStop;
    private handleInterruption;
    private handleAvailability;
    startRecording(options?: StartRecordingOptions): MovieTake;
    openOutput(output: MovieOutput): Promise<MovieOutputHandle>;
    dispose(): Promise<void>;
    private finishDispose;
}
