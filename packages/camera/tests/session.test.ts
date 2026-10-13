import { describe, expect, it } from 'vitest'
import { attachSessionPreview, createCameraSession } from '../src/session'
import { canonicalizePath, SharedCameraSession } from '../src/session-core'
import { createMemoryCameraStorage, createSyntheticCameraSession } from '../src/synthetic-session'
import { CameraCaptureError } from '../src/types'
import type { CameraSessionEvent } from '../src/types'
import type { CameraSessionBackend } from '../src/session-core'

const ready = async (session: ReturnType<typeof createSyntheticCameraSession>) => {
	const detach = attachSessionPreview(session, {})
	await new Promise((resolve) => setTimeout(resolve, 5))
	return detach
}

const record = async (
	session: ReturnType<typeof createSyntheticCameraSession>,
	events?: CameraSessionEvent[],
) => {
	if (events) {
		session.subscribe((event) => events.push(event))
	}

	const take = session.startRecording()
	return take
}

const settle = async (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms))

describe('camera session contract', () => {
	it('rejects start without an attached ready preview', async () => {
		const session = createSyntheticCameraSession()
		expect(() => session.startRecording()).toThrowError(CameraCaptureError)
		try {
			session.startRecording()
		} catch (error) {
			expect((error as CameraCaptureError).kind).toBe('unavailable')
		}
	})

	it('rejects unsupported adapters before admission', async () => {
		const session = createCameraSession()
		try {
			session.startRecording()
			expect.unreachable()
		} catch (error) {
			expect((error as CameraCaptureError).kind).toBe('unsupportedPlatform')
		}

		const caps = await session.capabilities()
		expect(caps.supported).toBe(false)
	})

	it('rejects invalid arguments before admission', async () => {
		const session = createSyntheticCameraSession()
		await ready(session)
		for (const options of [
			{ maximumDurationMs: 0 },
			{ maximumDurationMs: -5 },
			{ maximumDurationMs: Number.NaN },
			{ destinationFileUrl: 'https://example.com/clip.mov' },
			{ destinationFileUrl: 'file:///clip%zz.mov' },
		]) {
			try {
				session.startRecording(options)
				expect.unreachable()
			} catch (error) {
				expect(['invalidArgument']).toContain((error as CameraCaptureError).kind)
			}
		}
	})

	it('records one clip, emits started before finished, and reopens output', async () => {
		const session = createSyntheticCameraSession({}, { clipDurationMs: 2500 })
		const detach = await ready(session)
		const events: CameraSessionEvent[] = []
		const take = await record(session, events)
		expect(take.state).toBe('starting')
		await settle()
		expect(take.state).toBe('recording')
		expect(take.elapsedMs).toBeGreaterThan(0)
		const outcome = await take.stop()
		expect(outcome.kind).toBe('clip')
		if (outcome.kind !== 'clip') {
			return
		}

		expect(outcome.endReason).toBe('stopped')
		expect(outcome.partial).toBe(false)
		expect(outcome.clip.durationMs).toBe(2500)
		expect(outcome.clip.width).toBe(1280)
		expect(outcome.clip.height).toBe(720)
		expect(outcome.clip.output.synthetic).toBe(true)
		expect(outcome.clip.hasAudio).toBe(false)
		const opened = await session.openOutput(outcome.clip.output)
		expect(opened.fileUrl).toBe(outcome.clip.output.fileUrl)
		opened.release()
		const types = events.map((event) => event.type)
		expect(types.indexOf('started')).toBeGreaterThanOrEqual(0)
		expect(types.indexOf('started')).toBeLessThan(types.indexOf('finished'))
		expect(types.filter((type) => type === 'finished')).toHaveLength(1)
		detach()
	})

	it('double start fails busy; double stop joins the same completion', async () => {
		const session = createSyntheticCameraSession()
		await ready(session)
		const take = session.startRecording()
		try {
			session.startRecording()
			expect.unreachable()
		} catch (error) {
			expect((error as CameraCaptureError).kind).toBe('busy')
		}

		await settle()
		const [a, b] = await Promise.all([take.stop(), take.stop()])
		expect(a).toBe(b)
	})

	it('stopping an old settled take cannot stop a newer attempt', async () => {
		const session = createSyntheticCameraSession()
		await ready(session)
		const first = session.startRecording()
		await first.stop()
		const next = session.startRecording()
		await settle()
		await first.stop()
		expect(next.state).toBe('recording')
		await next.stop()
		await session.dispose()
	})

	it('stop during starting settles once after capture begins', async () => {
		const session = createSyntheticCameraSession({}, { startDelayMs: 60 })
		await ready(session)
		const take = session.startRecording()
		const outcome = await take.stop()
		expect(take.state).toBe('settled')
		expect(outcome.kind).toBe('clip')
		if (outcome.kind === 'clip') {
			expect(outcome.endReason).toBe('stopped')
		}
	})

	it('enforces the native duration limit as maximumDuration', async () => {
		const session = createSyntheticCameraSession()
		await ready(session)
		const take = session.startRecording({ maximumDurationMs: 80 })
		const outcome = await take.completion
		expect(outcome.kind).toBe('clip')
		if (outcome.kind === 'clip') {
			expect(outcome.endReason).toBe('maximumDuration')
			expect(outcome.partial).toBe(false)
		}
	})

	it('interruption ends the attempt with a partial clip', async () => {
		const session = createSyntheticCameraSession(
			{},
			{ interruption: { afterMs: 60, reason: 'cameraInUse' } },
		)

		await ready(session)
		const events: CameraSessionEvent[] = []
		const take = await record(session, events)
		const outcome = await take.completion
		expect(outcome.kind).toBe('clip')
		if (outcome.kind === 'clip') {
			expect(outcome.partial).toBe(true)
			expect(outcome.endReason).toBe('cameraUnavailable')
		}

		expect(events.some((event) => event.type === 'interruption')).toBe(true)
	})

	it('no-media capture settles failed, not a clip', async () => {
		const session = createSyntheticCameraSession({}, { produceMedia: false })
		await ready(session)
		const take = session.startRecording()
		await settle()
		const outcome = await take.stop()
		expect(outcome.kind).toBe('failed')
		if (outcome.kind === 'failed') {
			expect(outcome.error.kind).toBe('noMedia')
		}
	})

	it.each([
		['start', 'preparation'],
		['capture', 'capture'],
		['finalize', 'finalization'],
		['storage', 'storage'],
	] as const)('failAt=%s settles failed at stage %s', async (failAt, stage) => {
		const session = createSyntheticCameraSession({}, { failAt })
		await ready(session)
		const take = session.startRecording()
		// 'start' and 'capture' failures arrive on their own; the others
		// surface when the app stops the take.
		const outcome =
			failAt === 'start' || failAt === 'capture' ? await take.completion : await take.stop()

		expect(outcome.kind).toBe('failed')
		if (outcome.kind === 'failed') {
			expect(outcome.stage).toBe(stage)
		}
	})

	it('dispose settles an in-flight attempt and keeps output reopenable', async () => {
		const storage = createMemoryCameraStorage()
		const session = createSyntheticCameraSession({}, {}, storage)
		await ready(session)
		const take = session.startRecording()
		await settle()
		const disposing = session.dispose()
		const outcome = await take.completion
		expect(outcome.kind).toBe('clip')
		if (outcome.kind === 'clip') {
			expect(outcome.endReason).toBe('disposed')
			await disposing
			const reopened = await session.openOutput(outcome.clip.output)
			expect(reopened.fileUrl).toBe(outcome.clip.output.fileUrl)
		}

		expect(session.snapshot().state).toBe('disposed')
		try {
			session.startRecording()
			expect.unreachable()
		} catch (error) {
			expect((error as CameraCaptureError).kind).toBe('invalidState')
		}
	})

	it('preview detach requests stop and finalizes before release', async () => {
		const session = createSyntheticCameraSession()
		const detach = await ready(session)
		const take = session.startRecording()
		await settle()
		detach()
		const outcome = await take.completion
		expect(outcome.kind).toBe('clip')
		if (outcome.kind === 'clip') {
			expect(outcome.endReason).toBe('previewReleased')
			expect(outcome.partial).toBe(true)
		}
	})

	it('listener exceptions do not change capture', async () => {
		const session = createSyntheticCameraSession()
		await ready(session)
		session.subscribe(() => {
			throw new Error('listener exploded')
		})

		const take = session.startRecording()
		const outcome = await take.stop()
		expect(outcome.kind).toBe('clip')
	})

	it('completion resolves even without a subscriber', async () => {
		const session = createSyntheticCameraSession()
		await ready(session)
		// No subscriber and no explicit stop — the app cannot lose its
		// result; the duration limit settles the attempt on its own.
		const outcome = await session.startRecording({ maximumDurationMs: 60 }).completion
		expect(outcome.kind).toBe('clip')
	})

	it('a rejected permission request does not poison later requests', async () => {
		let attempts = 0
		const backend = {
			platform: 'test',
			supported: true,
			checkPermission: async () => 'unknown',
			requestPermission: async () => {
				attempts += 1
				if (attempts === 1) {
					throw new Error('transport lost')
				}

				return 'granted'
			},
			getCapabilities: async () => ({ supported: false }),
			previewReady: () => false,
			attachPreview: () => () => {},
			release: async () => {},
			setObserver: () => {},
		} as unknown as CameraSessionBackend

		const session = new SharedCameraSession(backend, {})
		await expect(session.requestPermission('camera')).rejects.toThrow('transport lost')
		// The next request must retry the backend, not replay the rejection.
		await expect(session.requestPermission('camera')).resolves.toBe('granted')
		expect(attempts).toBe(2)
	})

	it('focusAtPoint clamps to the preview edge and reaches the backend', async () => {
		const focusRequests: { x: number; y: number }[] = []
		const session = createSyntheticCameraSession({}, { focusRequests })
		const detach = await ready(session)
		session.focusAtPoint({ x: 1.4, y: -0.2 })
		session.focusAtPoint({ x: 0.25, y: 0.75 })
		expect(focusRequests).toEqual([
			{ x: 1, y: 0 },
			{ x: 0.25, y: 0.75 },
		])

		detach()
	})

	it('focusAtPoint rejects non-finite coordinates', () => {
		const session = createSyntheticCameraSession()
		for (const point of [
			{ x: Number.NaN, y: 0.5 },
			{ x: 0.5, y: Number.POSITIVE_INFINITY },
		]) {
			try {
				session.focusAtPoint(point)
				expect.unreachable()
			} catch (error) {
				expect((error as CameraCaptureError).kind).toBe('invalidArgument')
			}
		}
	})

	it('focusAtPoint no-ops when the adapter cannot meter', () => {
		const session = createCameraSession()
		expect(() => session.focusAtPoint({ x: 0.5, y: 0.5 })).not.toThrow()
	})

	it('focusAtPoint no-ops after dispose', async () => {
		const focusRequests: { x: number; y: number }[] = []
		const session = createSyntheticCameraSession({}, { focusRequests })
		await session.dispose()
		session.focusAtPoint({ x: 0.5, y: 0.5 })
		expect(focusRequests).toEqual([])
	})

	it('capabilities report point-of-interest metering support', async () => {
		const synthetic = createSyntheticCameraSession()
		const supported = await synthetic.capabilities()
		expect(supported.focusPointOfInterest).toBe(true)
		expect(supported.exposurePointOfInterest).toBe(true)

		const unsupported = await createCameraSession().capabilities()
		expect(unsupported.focusPointOfInterest).toBe(false)
		expect(unsupported.exposurePointOfInterest).toBe(false)
	})

	it('canonicalizePath resolves dot segments before prefix checks', () => {
		expect(canonicalizePath('/app/data/movies/../clip.mov')).toBe('/app/data/clip.mov')
		expect(canonicalizePath('/app/data/../../etc/passwd')).toBe('/etc/passwd')
		expect(canonicalizePath('/app//data/./clip.mov')).toBe('/app/data/clip.mov')
		expect(canonicalizePath('C:\\app\\data\\..\\clip.mp4', '\\')).toBe('C:\\app\\clip.mp4')
		expect(canonicalizePath('/app/data/clip.mov')).toBe('/app/data/clip.mov')
	})
})
