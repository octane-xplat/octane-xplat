import type { CameraInterruptionReason, CameraPermissionStatus, CameraPreviewPoint, CameraSession, CameraSessionConfig } from './types';
/** Development/testing seam — a deterministic camera source that drives
 *  the shared session state machine without hardware. NOT a production
 *  recording source: outcomes carry `synthetic: true` on their output so
 *  seam clips stay distinguishable from real capture.
 *
 *  `script` is read live at each transition — mutate fields between
 *  operations to script permissions, delayed starts, interruptions,
 *  partial completions, and failures.
 */
export interface SyntheticCameraScript {
    permission: {
        camera: CameraPermissionStatus;
        microphone: CameraPermissionStatus;
    };
    /** Camera hardware availability observation. */
    available: boolean;
    /** Delay before `started` reports; models slow native activation. */
    startDelayMs: number;
    /** Finalized clip duration reported by the seam. */
    clipDurationMs: number;
    /** Produce a usable clip on stop; false settles `noMedia`. */
    produceMedia: boolean;
    /** When set, the attempt settles failed at this stage. */
    failAt?: 'start' | 'capture' | 'finalize' | 'storage';
    /** Emit an interruption after this many ms of recording; the take
     *  ends with the mapped end reason and a partial clip. */
    interruption?: {
        afterMs: number;
        reason: CameraInterruptionReason;
        endsAfterMs?: number;
    };
    /** When set, each `focusAtPoint` call pushes its normalized point
     *  here so a spec can observe metering requests. */
    focusRequests?: CameraPreviewPoint[];
}
export interface SyntheticCameraStorage {
    write(path: string, bytes: Uint8Array): void | Promise<void>;
    read(path: string): Uint8Array | undefined | Promise<Uint8Array | undefined>;
    delete?(path: string): void | Promise<void>;
    exists?(path: string): boolean | Promise<boolean>;
}
/** In-memory storage for the seam — a `fileUrl`-shaped map so outcomes
 *  exercise the same reopen path without touching a real filesystem. */
export declare function createMemoryCameraStorage(): SyntheticCameraStorage & {
    files: Map<string, Uint8Array>;
};
/** Create a `CameraSession` backed by the deterministic synthetic source.
 *  Marked for development and testing — never present this as live
 *  capture to users. */
export declare function createSyntheticCameraSession(config?: CameraSessionConfig, script?: Partial<SyntheticCameraScript>, storage?: SyntheticCameraStorage): CameraSession;
