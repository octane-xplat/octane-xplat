import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@nativescript/macos-node-api', () => ({}))

import { createSessionBackend } from '../src/session-backend.macos'
import type { BackendCaptureRequest } from '../src/session-core'
import { CameraCaptureError } from '../src/types'

// AppKit host doubles: XplatCameraHost is the bridged capture-session leaf;
// NSFileManager answers the destination admission checks.
const host = {
	inner: null as any,
	observerEmit: undefined as ((message: string) => void) | undefined,
	configureResult: null as string | null,
	devices: JSON.stringify([{ id: 'cam-1', name: 'FaceTime HD', facing: 'front' }]),
	startRecordingResult: null as string | null,
	existingPaths: new Set<string>(),
}

const fs = {
	fileExistsAtPath: (path: string) => host.existingPaths.has(path),
	removeItemAtPathError: () => true,
}

const sink = () => {
	const events = { started: vi.fn(), finishing: vi.fn(), settled: vi.fn() }
	return events
}

const recordRequest = (destinationPath?: string): BackendCaptureRequest => ({
	audio: false,
	orientation: undefined,
	maximumDurationMs: undefined,
	destinationPath,
})

const emit = (event: object) => host.observerEmit?.(JSON.stringify(event))

const clipAt = (fileUrl: string, over: Record<string, unknown> = {}) => ({
	type: 'recordingFinished',
	fileUrl,
	succeeded: true,
	limitReached: false,
	clip: {
		fileUrl,
		durationMs: 1234,
		width: 1280,
		height: 720,
		rotationAngle: 0,
		fileSize: 4096,
		hasAudio: false,
		...over,
	},
})

let backend: ReturnType<typeof createSessionBackend>

beforeEach(() => {
	host.observerEmit = undefined
	host.configureResult = null
	host.startRecordingResult = null
	host.existingPaths = new Set([
		'/Library/Application Support/app',
		'/Library/Application Support/app/recordings',
	])

	const inner = {
		attachPreview: () => null,
		detachPreview: () => {},
		installObserver: (emitFn: (message: string) => void) => {
			host.observerEmit = emitFn
		},
		permissionStatus: () => 'granted',
		requestPermissionReply: (_kind: string, reply: (status: string) => void) => reply('granted'),
		devices: () => host.devices,
		audioDeviceAvailable: () => true,
		audioInputAttached: () => false,
		activeDeviceId: () => 'cam-1',
		configure: vi.fn(() => host.configureResult),
		supportsRotationAngles: () => true,
		movieDirectory: () => 'file:///Library/Application%20Support/app/recordings',
		startRecording: vi.fn(() => host.startRecordingResult),
		stopRecording: () => {},
		recording: () => false,
		recordedMs: () => 0,
		previewSize: () => JSON.stringify({ width: 1280, height: 720 }),
		dispose: () => {},
	}

	vi.stubGlobal('XplatCameraHost', {
		alloc: () => ({ init: () => inner }),
	})

	vi.stubGlobal('NSFileManager', { defaultManager: fs })
	host.inner = inner
	backend = createSessionBackend({})
})

afterEach(() => {
	vi.unstubAllGlobals()
	vi.clearAllMocks()
})

describe('macOS adapter destinations', () => {
	it('rejects a destination that escapes the private root through ..', () => {
		const target = sink()
		backend.startCapture(
			recordRequest('/Library/Application Support/app/recordings/../../escape.mov'),
			target,
		)

		expect(target.settled).toHaveBeenCalledWith(
			expect.objectContaining({
				kind: 'failed',
				stage: 'preparation',
				issue: expect.objectContaining({ kind: 'destinationUnavailable' }),
			}),
		)
	})

	it('rejects a destination outside the private root', () => {
		const target = sink()
		backend.startCapture(recordRequest('/Library/evil.mov'), target)
		expect(target.settled).toHaveBeenCalledWith(
			expect.objectContaining({
				kind: 'failed',
				stage: 'preparation',
				issue: expect.objectContaining({ kind: 'destinationUnavailable' }),
			}),
		)
	})

	it('accepts a destination inside the private root and starts recording', () => {
		const target = sink()
		backend.startCapture(recordRequest('/Library/Application Support/app/take+one.mov'), target)

		expect(target.settled).not.toHaveBeenCalled()
		expect(host.inner.startRecording).toHaveBeenCalledWith(
			'/Library/Application Support/app/take+one.mov',
			0,
		)
	})
})

describe('macOS adapter configure', () => {
	it('throws for every non-null host configure result', () => {
		for (const [result, kind] of [
			['busy', 'busy'],
			['permissionDenied', 'permissionDenied'],
			['unsupportedConfiguration', 'unsupportedConfiguration'],
			['anythingElse', 'unavailable'],
		] as const) {
			host.configureResult = result
			try {
				backend.configure?.({ audio: false })
				expect.unreachable()
			} catch (error) {
				expect(error).toBeInstanceOf(CameraCaptureError)
				expect((error as CameraCaptureError).kind).toBe(kind)
			}
		}
	})

	it('keeps applying the config when the host accepts', () => {
		host.configureResult = null
		expect(() => backend.configure?.({ audio: true })).not.toThrow()
	})
})

describe('macOS adapter event correlation', () => {
	it('correlates host events whose URL leaves filename characters literal', () => {
		const target = sink()
		// A '+' in the file name: Foundation's absoluteString keeps it
		// literal while encodeURIComponent would produce %2B — the take must
		// still correlate and settle.
		backend.startCapture(recordRequest('/Library/Application Support/app/take+one.mov'), target)

		const url = 'file:///Library/Application%20Support/app/take+one.mov'
		emit({ type: 'recordingStarted', fileUrl: url, audio: false })
		expect(target.started).toHaveBeenCalled()
		emit(clipAt(url))
		expect(target.settled).toHaveBeenCalledWith(expect.objectContaining({ kind: 'clip' }))
	})

	it('fails a finalized clip with no usable media', () => {
		const target = sink()
		backend.startCapture(recordRequest('/Library/Application Support/app/empty.mov'), target)

		const url = 'file:///Library/Application%20Support/app/empty.mov'
		emit({ type: 'recordingStarted', fileUrl: url, audio: false })
		emit(clipAt(url, { durationMs: 0, width: 0, height: 0 }))
		expect(target.settled).toHaveBeenCalledWith(
			expect.objectContaining({
				kind: 'failed',
				issue: expect.objectContaining({ kind: 'captureFailed' }),
			}),
		)
	})
})
