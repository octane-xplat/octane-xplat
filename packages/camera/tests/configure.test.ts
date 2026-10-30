import { describe, expect, it, vi } from 'vitest'
import { SharedCameraSession } from '../src/session-core'
import { createSyntheticCameraSession } from '../src/synthetic-session'
import type { BackendCaptureSink, BackendObserver, CameraSessionBackend } from '../src/session-core'
import type { CameraSessionEvent, EffectiveCaptureConfig } from '../src/types'

const configuration: EffectiveCaptureConfig = {
	cameraId: 'synthetic-back',
	facing: 'back',
	audio: true,
	width: 1280,
	height: 720,
	frameRate: 30,
	orientation: 'portrait',
	mimeType: 'video/quicktime',
	container: 'mov',
}

async function setup() {
	const capabilities = await createSyntheticCameraSession().capabilities()
	const pending = Promise.withResolvers<typeof capabilities>()
	let sink!: BackendCaptureSink
	let observer: BackendObserver | undefined
	const backend: CameraSessionBackend = {
		platform: 'test',
		supported: true,
		checkPermission: async () => 'granted',
		requestPermission: async () => 'granted',
		getCapabilities: () => pending.promise,
		previewReady: () => true,
		attachPreview: () => () => {},
		configure: vi.fn(),
		stopCapture: vi.fn(),
		elapsedMs: () => 1200,
		startCapture: (_request, target) => {
			sink = target
		},
		openOutput: async () => ({ url: 'file:///test.mov', release: () => {} }),
		release: vi.fn(async () => {}),
		setObserver: (target) => {
			observer = target
		},
	}
	const session = new SharedCameraSession(backend, { camera: 'back', audio: true })
	const events: CameraSessionEvent[] = []
	session.subscribe((event) => events.push(event))
	session.attach({})
	return {
		session,
		backend,
		events,
		resolve: () => pending.resolve(capabilities),
		started: () => sink.started(configuration),
		interrupt: () => observer?.interruption('began', 'cameraInUse'),
		finish: () =>
			sink.settled({
				kind: 'clip',
				output: {
					kind: 'nativeFile',
					resourceId: 'file:///test.mov',
					fileUrl: 'file:///test.mov',
					synthetic: true,
				},
				mimeType: configuration.mimeType,
				durationMs: 1200,
				width: 1280,
				height: 720,
				orientation: 'portrait',
				hasAudio: true,
			}),
	}
}

describe('configuration admission across capability discovery', () => {
	it.each(['starting', 'recording', 'finalizing', 'interrupted'] as const)(
		'rejects a pending flip after entering %s without changing or stopping the take',
		async (phase) => {
			const h = await setup()
			const flip = h.session.configure({ camera: 'front' })
			const take = h.session.startRecording()
			if (phase !== 'starting') {
				h.started()
			}
			if (phase === 'finalizing') {
				take.stop()
			}
			if (phase === 'interrupted') {
				h.interrupt()
			}
			const stops = vi.mocked(h.backend.stopCapture).mock.calls.length
			h.resolve()
			await expect(flip).rejects.toMatchObject({ kind: 'invalidState', operation: 'configure' })
			expect(h.backend.configure).not.toHaveBeenCalled()
			expect(h.backend.stopCapture).toHaveBeenCalledTimes(stops)
			expect(h.events.filter((e) => e.type === 'finished')).toHaveLength(0)
			if (phase === 'starting') {
				h.started()
			}
			expect(take.elapsedMs).toBe(1200)
			expect(take.stop()).toBe(take.completion)
			h.finish()
			h.finish() // Late native callbacks cannot produce a second completion.
			await expect(take.completion).resolves.toMatchObject({
				kind: 'clip',
				clip: { durationMs: 1200, hasAudio: true },
				endReason: phase === 'interrupted' ? 'cameraUnavailable' : 'stopped',
			})
			expect(h.events.filter((e) => e.type === 'finished')).toHaveLength(1)
			await h.session.dispose()
		},
	)

	it('rejects pending flips after disposal without calling a released backend', async () => {
		const h = await setup()
		const flips = [
			h.session.configure({ camera: 'front' }),
			h.session.configure({ camera: 'back' }),
		]
		await h.session.dispose()
		h.resolve()
		for (const flip of flips) {
			await expect(flip).rejects.toMatchObject({ kind: 'invalidState' })
		}
		expect(h.backend.configure).not.toHaveBeenCalled()
		expect(h.backend.release).toHaveBeenCalledTimes(1)
	})

	it('rejects configuration while disposal waits for the admitted take to finish', async () => {
		const h = await setup()
		const flip = h.session.configure({ camera: 'front' })
		const take = h.session.startRecording()
		const disposed = h.session.dispose()
		h.resolve()
		await expect(flip).rejects.toMatchObject({ kind: 'invalidState' })
		expect(h.backend.configure).not.toHaveBeenCalled()
		expect(h.backend.release).not.toHaveBeenCalled()
		h.started()
		h.finish()
		await expect(take.completion).resolves.toMatchObject({ kind: 'clip', endReason: 'disposed' })
		await disposed
		expect(h.backend.release).toHaveBeenCalledTimes(1)
	})

	it('still applies an available idle selection and rejects an unavailable one', async () => {
		const h = await setup()
		h.resolve()
		await h.session.configure({ camera: 'front' })
		expect(h.backend.configure).toHaveBeenCalledWith({ camera: 'front', audio: true })
		await expect(h.session.configure({ camera: { deviceId: 'missing' } })).rejects.toMatchObject({
			kind: 'unsupportedConfiguration',
		})
		expect(h.backend.configure).toHaveBeenCalledTimes(1)
		await h.session.dispose()
	})
})
