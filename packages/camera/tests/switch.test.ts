import { describe, expect, it, vi } from 'vitest'
import { SharedCameraSession } from '../src/session-core'
import { createSyntheticCameraSession } from '../src/synthetic-session'
import type {
	BackendCaptureSink,
	BackendObserver,
	BackendPreviewListener,
	CameraSessionBackend,
} from '../src/session-core'

import type { CameraDeviceInfo, CameraSessionEvent } from '../src/types'

const flush = async () => {
	for (let i = 0; i < 8; i++) {
		await Promise.resolve()
	}
}

async function setup() {
	const capabilities = await createSyntheticCameraSession().capabilities()
	let sink!: BackendCaptureSink
	let observer: BackendObserver | undefined
	let preview: BackendPreviewListener | undefined
	const swaps: {
		result: ReturnType<typeof Promise.withResolvers<CameraDeviceInfo>>
		cancel: ReturnType<typeof vi.fn>
	}[] = []
	const backend: CameraSessionBackend = {
		platform: 'test',
		supported: true,
		checkPermission: async () => 'granted',
		requestPermission: async () => 'granted',
		getCapabilities: vi.fn(async () => capabilities),
		previewReady: () => true,
		attachPreview: (_host, listener) => {
			preview = listener
			return () => {}
		},
		setObserver: (value) => {
			observer = value
		},
		switchCamera: vi.fn(() => {
			const result = Promise.withResolvers<CameraDeviceInfo>()
			const cancel = vi.fn()
			swaps.push({ result, cancel })
			return { completion: result.promise, cancel }
		}),
		startCapture: (_request, target) => {
			sink = target
			sink.started({
				cameraId: 'synthetic-back',
				facing: 'back',
				audio: true,
				width: 1280,
				height: 720,
				frameRate: 30,
				orientation: 'portrait',
				mimeType: 'video/quicktime',
				container: 'mov',
			})
		},
		stopCapture: vi.fn(),
		elapsedMs: () => 1000,
		openOutput: async () => ({ url: 'file:///take.mov', release: () => {} }),
		release: vi.fn(async () => {}),
	}
	const session = new SharedCameraSession(backend, { audio: true })
	const events: CameraSessionEvent[] = []
	session.subscribe((e) => events.push(e))
	const onReady = vi.fn()
	const detach = session.attach({}, { onReady })
	preview?.onReady?.()
	const finish = () =>
		sink.settled({
			kind: 'clip',
			output: {
				kind: 'nativeFile',
				resourceId: 'file:///take.mov',
				fileUrl: 'file:///take.mov',
				synthetic: true,
			},
			mimeType: 'video/quicktime',
			durationMs: 1000,
			width: 1280,
			height: 720,
			orientation: 'portrait',
			hasAudio: true,
		})
	return {
		session,
		backend,
		events,
		capabilities,
		swaps,
		onReady,
		detach,
		finish,
		ready: () => {
			observer?.previewReady(true)
			preview?.onReady?.()
		},
		interrupt: () => observer?.interruption('began', 'cameraInUse'),
		limit: () => sink.finishing('maximumDuration'),
	}
}

describe('switching cameras within one take', () => {
	it('keeps the take, starting configuration, audio and completion while exposing active selection', async () => {
		const h = await setup()
		const take = h.session.startRecording()
		const before = h.session.snapshot().attempt
		const flip = h.session.switchCamera('front')
		expect(h.session.snapshot().switchingCamera).toBe(true)
		await expect(h.session.switchCamera('back')).rejects.toMatchObject({ kind: 'busy' })
		await flush()
		h.ready()
		expect(h.onReady).toHaveBeenCalledTimes(1)
		expect(h.session.snapshot().state).toBe('recording')
		h.swaps[0]!.result.resolve({ id: 'synthetic-front', label: 'Front', facing: 'front' })
		await flip
		expect(h.session.snapshot()).toMatchObject({
			switchingCamera: false,
			activeCamera: { id: 'synthetic-front' },
			attempt: { id: take.id, configuration: before!.configuration },
		})
		expect(h.backend.stopCapture).not.toHaveBeenCalled()
		expect(take.stop()).toBe(take.completion)
		h.finish()
		await expect(take.completion).resolves.toMatchObject({
			kind: 'clip',
			clip: { hasAudio: true },
			partial: false,
		})
		expect(h.events.filter((e) => e.type === 'started')).toHaveLength(1)
		expect(h.events.filter((e) => e.type === 'finished')).toHaveLength(1)
		await h.session.dispose()
	})

	it('rejects unavailable devices and unsupported hosts before a native swap; same camera is a no-op', async () => {
		const h = await setup()
		h.session.startRecording()
		await h.session.switchCamera('back')
		await expect(h.session.switchCamera({ deviceId: 'missing' })).rejects.toMatchObject({
			kind: 'unsupportedConfiguration',
			operation: 'switchCamera',
		})
		h.capabilities.cameraSwitchDuringRecording = false
		await expect(h.session.switchCamera('front')).rejects.toMatchObject({
			kind: 'unsupportedConfiguration',
		})
		expect(h.backend.switchCamera).not.toHaveBeenCalled()
		h.finish()
		await h.session.dispose()
	})

	it('keeps recording after a restored swap rejects and permits another request', async () => {
		const h = await setup()
		h.session.startRecording()
		const flip = h.session.switchCamera('front')
		await flush()
		h.swaps[0]!.result.reject(new Error('restored previous source'))
		await expect(flip).rejects.toThrow('restored previous source')
		expect(h.session.snapshot()).toMatchObject({
			state: 'recording',
			switchingCamera: false,
			activeCamera: { facing: 'back' },
		})
		await h.session.switchCamera('back')
		expect(h.backend.stopCapture).not.toHaveBeenCalled()
		h.finish()
		await h.session.dispose()
	})

	it('rejects a known missing facing but delegates unlabeled directions to the backend', async () => {
		const h = await setup()
		h.session.startRecording()
		h.capabilities.cameras = h.capabilities.cameras.filter((camera) => camera.facing === 'back')
		await expect(h.session.switchCamera('front')).rejects.toMatchObject({
			kind: 'unsupportedConfiguration',
		})
		expect(h.backend.switchCamera).not.toHaveBeenCalled()
		h.capabilities.cameras = h.capabilities.cameras.map(({ facing: _facing, ...camera }) => camera)
		const flip = h.session.switchCamera('front')
		await flush()
		h.swaps[0]!.result.resolve({ id: 'browser-front', label: 'Camera' })
		await flip
		expect(h.session.snapshot().activeCamera?.id).toBe('browser-front')
		h.finish()
		await h.session.dispose()
	})

	it('keeps finalization ownership even if backend switch cancellation throws', async () => {
		const h = await setup()
		const take = h.session.startRecording()
		const flip = h.session.switchCamera('front')
		const rejected = expect(flip).rejects.toMatchObject({ kind: 'invalidState' })
		await flush()
		h.swaps[0]!.cancel.mockImplementation(() => {
			throw new Error('native cancellation failure')
		})
		expect(take.stop()).toBe(take.completion)
		await rejected
		expect(h.backend.stopCapture).toHaveBeenCalledTimes(1)
		h.finish()
		await expect(take.completion).resolves.toMatchObject({ kind: 'clip', endReason: 'stopped' })
		await h.session.dispose()
	})

	it.each(['stop', 'dispose', 'limit', 'interruption', 'detach'] as const)(
		'cancels an in-flight swap on %s and retires late success',
		async (ending) => {
			const h = await setup()
			const take = h.session.startRecording()
			const flip = h.session.switchCamera('front')
			const rejected = expect(flip).rejects.toMatchObject({ kind: 'invalidState' })
			await flush()
			let disposal: Promise<void> | undefined
			if (ending === 'stop') {
				take.stop()
				take.stop()
			}
			if (ending === 'dispose') {
				disposal = h.session.dispose()
			}
			if (ending === 'limit') {
				h.limit()
			}
			if (ending === 'interruption') {
				h.interrupt()
			}
			if (ending === 'detach') {
				h.detach()
			}
			await rejected
			expect(h.swaps[0]!.cancel).toHaveBeenCalledTimes(1)
			h.finish()
			h.swaps[0]!.result.resolve({ id: 'late', label: 'Late', facing: 'front' })
			await flush()
			expect(h.session.snapshot().activeCamera?.facing).toBe('back')
			expect(h.events.filter((e) => e.type === 'finished')).toHaveLength(1)
			await expect(take.completion).resolves.toMatchObject({
				endReason: {
					stop: 'stopped',
					dispose: 'disposed',
					limit: 'maximumDuration',
					interruption: 'cameraUnavailable',
					detach: 'previewReleased',
				}[ending],
			})
			await (disposal ?? h.session.dispose())
		},
	)

	it('does not begin a native swap when stop overtakes capability discovery', async () => {
		const h = await setup()
		const pending = Promise.withResolvers<typeof h.capabilities>()
		vi.mocked(h.backend.getCapabilities).mockReturnValueOnce(pending.promise)
		const take = h.session.startRecording()
		const flip = h.session.switchCamera('front')
		const rejected = expect(flip).rejects.toMatchObject({ kind: 'invalidState' })
		take.stop()
		await rejected
		pending.resolve(h.capabilities)
		await flush()
		expect(h.backend.switchCamera).not.toHaveBeenCalled()
		h.finish()
		await h.session.dispose()
	})

	it('rejects idle, starting, finalizing and disposed states', async () => {
		const session = createSyntheticCameraSession({}, { startDelayMs: 100 })
		await expect(session.switchCamera('front')).rejects.toMatchObject({ kind: 'invalidState' })
		// Use the deterministic seam for starting before any native callback.
		const { attachSessionPreview } = await import('../src/session')
		attachSessionPreview(session, {})
		await flush()
		const take = session.startRecording()
		await expect(session.switchCamera('front')).rejects.toMatchObject({ kind: 'invalidState' })
		await take.stop()
		const h = await setup()
		h.session.startRecording().stop()
		await expect(h.session.switchCamera('front')).rejects.toMatchObject({ kind: 'invalidState' })
		h.finish()
		await h.session.dispose()
		await expect(h.session.switchCamera('front')).rejects.toMatchObject({ kind: 'invalidState' })
		await session.dispose()
	})
})
