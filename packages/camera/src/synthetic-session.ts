import { SharedCameraSession } from './session-core'
import type {
	BackendCaptureRequest,
	BackendCaptureSink,
	BackendObserver,
	BackendSettle,
	CameraSessionBackend,
} from './session-core'

import type {
	CameraInterruptionReason,
	CameraPermissionStatus,
	CameraSession,
	CameraSessionCapabilities,
	CameraSessionConfig,
	MovieOutput,
} from './types'

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
		camera: CameraPermissionStatus
		microphone: CameraPermissionStatus
	}
	/** Camera hardware availability observation. */
	available: boolean
	/** Delay before `started` reports; models slow native activation. */
	startDelayMs: number
	/** Finalized clip duration reported by the seam. */
	clipDurationMs: number
	/** Produce a usable clip on stop; false settles `noMedia`. */
	produceMedia: boolean
	/** When set, the attempt settles failed at this stage. */
	failAt?: 'start' | 'capture' | 'finalize' | 'storage'
	/** Emit an interruption after this many ms of recording; the take
	 *  ends with the mapped end reason and a partial clip. */
	interruption?: {
		afterMs: number
		reason: CameraInterruptionReason
		endsAfterMs?: number
	}
}

export interface SyntheticCameraStorage {
	write(path: string, bytes: Uint8Array): void | Promise<void>
	read(path: string): Uint8Array | undefined | Promise<Uint8Array | undefined>
	delete?(path: string): void | Promise<void>
	exists?(path: string): boolean | Promise<boolean>
}

/** In-memory storage for the seam — a `fileUrl`-shaped map so outcomes
 *  exercise the same reopen path without touching a real filesystem. */
export function createMemoryCameraStorage(): SyntheticCameraStorage & {
	files: Map<string, Uint8Array>
} {
	const files = new Map<string, Uint8Array>()
	return {
		files,
		write: (path, bytes) => {
			files.set(path, bytes)
		},
		read: (path) => files.get(path),
		delete: (path) => {
			files.delete(path)
		},
		exists: (path) => files.has(path),
	}
}

const defaultScript = (): SyntheticCameraScript => ({
	permission: { camera: 'granted', microphone: 'granted' },
	available: true,
	startDelayMs: 20,
	clipDurationMs: 3000,
	produceMedia: true,
})

const capabilities: CameraSessionCapabilities = {
	supported: true,
	available: true,
	cameras: [
		{ id: 'synthetic-back', label: 'Synthetic back camera', facing: 'back' },
		{ id: 'synthetic-front', label: 'Synthetic front camera', facing: 'front' },
	],
	profiles: [{ profile: 'standard', width: 1280, height: 720, frameRate: 30 }],
	audio: true,
	orientations: ['portrait', 'portraitUpsideDown', 'landscapeLeft', 'landscapeRight'],
	durationLimit: 'native',
	elapsedTime: 'nativeMedia',
	output: {
		mimeType: 'video/quicktime',
		container: 'mov',
		storage: 'appPrivateFile',
		destinationFileUrl: true,
	},
}

/** Create a `CameraSession` backed by the deterministic synthetic source.
 *  Marked for development and testing — never present this as live
 *  capture to users. */
export function createSyntheticCameraSession(
	config: CameraSessionConfig = {},
	script: Partial<SyntheticCameraScript> = {},
	storage: SyntheticCameraStorage = createMemoryCameraStorage(),
): CameraSession {
	const controls: SyntheticCameraScript = { ...defaultScript(), ...script }
	return new SharedCameraSession(createSyntheticBackend(controls, storage), config)
}

function createSyntheticBackend(
	script: SyntheticCameraScript,
	storage: SyntheticCameraStorage,
): CameraSessionBackend {
	let observer: BackendObserver | undefined
	let attached = false
	let sink: BackendCaptureSink | undefined
	let startedAt: number | undefined
	let timers: ReturnType<typeof setTimeout>[] = []
	let pendingRequest: BackendCaptureRequest | undefined

	const later = (ms: number, fn: () => void) => {
		timers.push(setTimeout(fn, ms))
	}

	const clearTimers = () => {
		for (const timer of timers) {
			clearTimeout(timer)
		}

		timers = []
	}

	const settleClip = async (request: BackendCaptureRequest, limitReached: boolean) => {
		const path =
			request.destinationPath ??
			`/synthetic/clip-${Date.now()}-${Math.random().toString(36).slice(2)}.mov`

		if (!script.produceMedia) {
			sink?.settled({
				kind: 'failed',
				stage: 'capture',
				issue: {
					kind: 'noMedia',
					operation: 'finalize',
					message: 'Synthetic source produced no media',
				},
			})

			return
		}

		if (script.failAt === 'finalize') {
			sink?.settled({
				kind: 'failed',
				stage: 'finalization',
				issue: {
					kind: 'finalizationFailed',
					operation: 'finalize',
					message: 'Synthetic finalization failure',
				},
			})

			return
		}

		if (script.failAt === 'storage') {
			sink?.settled({
				kind: 'failed',
				stage: 'storage',
				issue: {
					kind: 'storageFailed',
					operation: 'store',
					message: 'Synthetic storage failure',
				},
			})

			return
		}

		try {
			// Not playable media — seam bytes stand in for a fixture. The
			// output is marked `synthetic` so nothing mistakes it for real
			// capture.
			await storage.write(path, new Uint8Array([0x78, 0x70, 0x6c, 0x61, 0x74]))
		} catch (cause) {
			sink?.settled({
				kind: 'failed',
				stage: 'storage',
				issue: {
					kind: 'storageFailed',
					operation: 'store',
					message: cause instanceof Error ? cause.message : String(cause),
					cause,
				},
			})

			return
		}

		const output: MovieOutput = {
			kind: 'nativeFile',
			resourceId: `synthetic:${path}`,
			fileUrl: `file://${path}`,
			synthetic: true,
		}

		const settle: BackendSettle = {
			kind: 'clip',
			output,
			mimeType: 'video/quicktime',
			durationMs: script.clipDurationMs,
			width: 1280,
			height: 720,
			orientation: request.orientation ?? 'portrait',
			hasAudio: request.audio,
			limitReached,
		}

		sink?.settled(settle)
	}

	return {
		platform: 'synthetic',
		supported: true,
		checkPermission: async (kind) => script.permission[kind],
		requestPermission: async (kind) => script.permission[kind],
		getCapabilities: async () => ({
			...capabilities,
			available: script.available,
			reason: script.available ? undefined : 'Synthetic camera is unavailable',
		}),
		previewReady: () => attached && script.available,
		attachPreview: (_host, listener) => {
			attached = true
			queueMicrotask(() => {
				listener?.onReady?.()
				observer?.previewReady(true)
			})

			return () => {
				attached = false
				observer?.previewReady(false)
			}
		},
		startCapture: (request, attemptSink) => {
			sink = attemptSink
			pendingRequest = request
			if (!script.available) {
				attemptSink.settled({
					kind: 'failed',
					stage: 'preparation',
					issue: {
						kind: 'unavailable',
						operation: 'startRecording',
						message: 'Synthetic camera is unavailable',
					},
				})

				return
			}

			if (script.failAt === 'start') {
				later(script.startDelayMs, () => {
					attemptSink.settled({
						kind: 'failed',
						stage: 'preparation',
						issue: {
							kind: 'captureFailed',
							operation: 'startRecording',
							message: 'Synthetic start failure',
						},
					})
				})

				return
			}

			later(script.startDelayMs, () => {
				startedAt = Date.now()
				attemptSink.started({
					cameraId: 'synthetic-back',
					facing: 'back',
					audio: request.audio,
					width: 1280,
					height: 720,
					frameRate: 30,
					orientation: request.orientation ?? 'portrait',
					mimeType: 'video/quicktime',
					container: 'mov',
				})

				if (script.interruption) {
					later(script.interruption.afterMs, () => {
						observer?.interruption('began', script.interruption?.reason)
						if (script.interruption?.endsAfterMs !== undefined) {
							later(script.interruption.endsAfterMs, () => {
								observer?.interruption('ended', script.interruption?.reason)
							})
						}
					})
				}

				if (request.maximumDurationMs !== undefined) {
					later(request.maximumDurationMs, () => {
						void settleClip(request, true)
					})
				}

				if (script.failAt === 'capture') {
					later(50, () => {
						attemptSink.settled({
							kind: 'failed',
							stage: 'capture',
							issue: {
								kind: 'captureFailed',
								operation: 'record',
								message: 'Synthetic capture failure',
							},
						})
					})
				}
			})
		},
		stopCapture: () => {
			// Settle asynchronously — native stop is async too.
			const request = pendingRequest
			later(5, () => {
				if (request) {
					void settleClip(request, false)
				}
			})
		},
		elapsedMs: () => (startedAt === undefined ? 0 : Date.now() - startedAt),
		openOutput: async (output) => {
			const path = output.kind === 'nativeFile' ? output.fileUrl.slice('file://'.length) : ''
			const exists = storage.exists ? await storage.exists(path) : !!(await storage.read(path))
			if (!exists) {
				throw new Error(`Synthetic clip is missing at ${output.resourceId}`)
			}

			return {
				url: output.kind === 'nativeFile' ? output.fileUrl : output.resourceId,
				fileUrl: output.kind === 'nativeFile' ? output.fileUrl : undefined,
				release: () => {},
			}
		},
		release: async () => {
			attached = false
			clearTimers()
			sink = undefined
			startedAt = undefined
			pendingRequest = undefined
		},
		onPreviewDetached: () => {},
		setObserver: (next) => {
			observer = next
		},
	}
}
