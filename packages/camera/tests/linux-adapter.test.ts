import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SharedCameraSession } from '../src/session-core'
import { createSessionBackend } from '../src/session-backend.linux'
import { CameraCaptureError } from '../src/types'

const hostMovie = vi.hoisted(() => ({
	host: null as null | { call: ReturnType<typeof vi.fn> },
	reserve: vi.fn(),
	commit: vi.fn(),
	remove: vi.fn(),
	open: vi.fn(),
}))

vi.mock('../src/host-movie.web', () => ({
	cameraHost: async () => hostMovie.host,
	reserveHostMovie: (host: unknown, options: unknown) => hostMovie.reserve(host, options),
	commitHostMovie: (host: unknown, fileUrl: string, bytes: Blob) =>
		hostMovie.commit(host, fileUrl, bytes),
	removeHostReservation: (host: unknown, fileUrl: string) => hostMovie.remove(host, fileUrl),
	openHostMovie: (host: unknown, output: unknown) => hostMovie.open(host, output),
}))

const inspect = vi.hoisted(() => vi.fn())
vi.mock('../src/movie-metadata.web', () => ({ inspectMovie: inspect }))

class Track extends EventTarget {
	kind = 'video'
	readyState = 'live'
	muted = false
	getSettings() {
		return { deviceId: 'camera-1', width: 1280, height: 720, frameRate: 30 }
	}
	stop() {
		this.readyState = 'ended'
	}
}

class Stream {
	constructor(private tracks: Track[]) {}
	getTracks() {
		return this.tracks
	}
	getVideoTracks() {
		return this.tracks.filter((track) => track.kind === 'video')
	}
	getAudioTracks() {
		return this.tracks.filter((track) => track.kind === 'audio')
	}
	addTrack(track: Track) {
		this.tracks.push(track)
	}
}

class Recorder {
	static instances: Recorder[] = []
	static isTypeSupported(mime: string) {
		return mime === 'video/mp4'
	}
	state = 'inactive'
	mimeType = 'video/mp4'
	onstart?: () => void
	onstop?: () => void
	onerror?: (event: unknown) => void
	ondataavailable?: (event: { data: Blob }) => void
	constructor() {
		Recorder.instances.push(this)
	}
	start() {
		this.state = 'recording'
	}
	stop() {
		this.state = 'inactive'
	}
	begin() {
		this.onstart?.()
	}
	finish() {
		this.ondataavailable?.({ data: new Blob(['movie']) })
		this.onstop?.()
	}
}

const flush = async () => {
	for (let i = 0; i < 12; i++) {
		await Promise.resolve()
	}
}

let track: Track
let documentEvents: EventTarget & { visibilityState: string }
let permissionStatus = 'granted'

const hostCall = async (_service: string, method: string) => {
	if (method === 'permissionStatus' || method === 'requestPermission') {
		return { status: permissionStatus }
	}

	return null
}

async function ready(audio = false) {
	const session = new SharedCameraSession(createSessionBackend({ audio }), { audio })
	await session.capabilities()
	session.attach({ srcObject: null, style: {}, play: async () => {} })
	await flush()
	return session
}

beforeEach(() => {
	Recorder.instances = []
	track = new Track()
	permissionStatus = 'granted'
	hostMovie.host = { call: vi.fn(hostCall) }
	hostMovie.reserve = vi.fn(async () => ({ fileUrl: 'file:///data/media/reserved.mp4' }))
	hostMovie.commit = vi.fn(async (_host: unknown, fileUrl: string) => ({
		kind: 'nativeFile' as const,
		resourceId: fileUrl,
		fileUrl,
	}))

	hostMovie.remove = vi.fn(async () => {})
	hostMovie.open = vi.fn(async (_host: unknown, output: { fileUrl?: string }) => ({
		url: 'blob:opened',
		fileUrl: output.fileUrl,
		release: () => {},
	}))

	documentEvents = Object.assign(new EventTarget(), { visibilityState: 'visible' })
	vi.stubGlobal('document', documentEvents)
	vi.stubGlobal('isSecureContext', true)
	vi.stubGlobal('MediaStream', Stream)
	vi.stubGlobal('MediaRecorder', Recorder)
	vi.stubGlobal('addEventListener', vi.fn())
	vi.stubGlobal('removeEventListener', vi.fn())
	vi.stubGlobal('navigator', {
		mediaDevices: {
			getUserMedia: vi.fn(async () => new Stream([track])),
			enumerateDevices: async () => [
				{ kind: 'videoinput', deviceId: 'camera-1', label: 'Webcam' },
			],
		},
	})

	inspect.mockResolvedValue({
		durationMs: 1234,
		width: 1280,
		height: 720,
		orientation: 'unspecified',
		hasAudio: false,
		mimeType: 'video/mp4',
	})
})

afterEach(() => {
	vi.unstubAllGlobals()
	vi.useRealTimers()
	vi.clearAllMocks()
})

describe('linux WebKitGTK adapter', () => {
	it('reports unavailable without the packaged host camera service', async () => {
		hostMovie.host = null
		const backend = createSessionBackend({})
		expect(await backend.checkPermission('camera')).toBe('unavailable')
		const session = new SharedCameraSession(backend, {})
		const caps = await session.capabilities()
		expect(caps.supported).toBe(false)
		expect(caps.available).toBe(false)
	})

	it('maps host permission states without prompting', async () => {
		const backend = createSessionBackend({})
		for (const [hostStatus, expected] of [
			['granted', 'granted'],
			['notDetermined', 'notDetermined'],
			['restricted', 'restricted'],
			['denied', 'denied'],
			['blocked', 'denied'],
			['unknown', 'unknown'],
		]) {
			permissionStatus = hostStatus
			expect(await backend.checkPermission('camera')).toBe(expected)
		}
	})

	it('finalizes through host file commit and reports the durable file output', async () => {
		const session = await ready()
		const take = session.startRecording()
		await flush()
		const recorder = Recorder.instances.at(-1)!
		recorder.begin()
		take.stop()
		recorder.finish()
		const outcome = await take.completion
		expect(outcome.kind).toBe('clip')
		if (outcome.kind !== 'clip') {
			return
		}

		expect(outcome.clip.output).toEqual({
			kind: 'nativeFile',
			resourceId: 'file:///data/media/reserved.mp4',
			fileUrl: 'file:///data/media/reserved.mp4',
		})

		expect(outcome.clip.mimeType).toBe('video/mp4')
		expect(hostMovie.commit).toHaveBeenCalledWith(
			hostMovie.host,
			'file:///data/media/reserved.mp4',
			expect.any(Blob),
		)

		await session.dispose()
	})

	it('reserves an app-supplied destination inside the private root', async () => {
		const session = await ready()
		const dest = 'file:///data/org.octane.xplat/exports/movie.mp4'
		const take = session.startRecording({ destinationFileUrl: dest })
		await flush()
		Recorder.instances.at(-1)!.begin()
		take.stop()
		Recorder.instances.at(-1)!.finish()
		const outcome = await take.completion
		expect(outcome.kind).toBe('clip')
		expect(hostMovie.reserve).toHaveBeenCalledWith(
			hostMovie.host,
			expect.objectContaining({ destinationFileUrl: dest }),
		)

		await session.dispose()
	})

	it('fails a refused destination during preparation', async () => {
		hostMovie.reserve = vi.fn(async () => {
			throw new CameraCaptureError({
				kind: 'destinationUnavailable',
				operation: 'storage',
				message: 'destinationFileUrl must be a new file inside the app-private root',
			})
		})

		const session = await ready()
		const outcome = await session.startRecording({
			destinationFileUrl: 'file:///data/org.octane.xplat/exports/taken.mp4',
		}).completion

		expect(outcome.kind).toBe('failed')
		if (outcome.kind === 'failed') {
			expect(outcome.error.kind).toBe('destinationUnavailable')
			expect(outcome.stage).toBe('preparation')
		}

		expect(Recorder.instances).toHaveLength(0)
		await session.dispose()
	})

	it('maps host storage failures to stage=storage and cleans the reservation', async () => {
		hostMovie.commit = vi.fn(async () => {
			throw new Error('insufficient storage for movie output')
		})

		const session = await ready()
		const take = session.startRecording()
		await flush()
		const recorder = Recorder.instances.at(-1)!
		recorder.begin()
		take.stop()
		recorder.finish()
		const outcome = await take.completion
		expect(outcome.kind).toBe('failed')
		if (outcome.kind === 'failed') {
			expect(outcome.stage).toBe('storage')
			expect(outcome.error.kind).toBe('storageFailed')
		}

		expect(hostMovie.remove).toHaveBeenCalledWith(
			hostMovie.host,
			'file:///data/media/reserved.mp4',
		)

		await session.dispose()
	})

	it('reopens file-backed output through the host helper only', async () => {
		const session = await ready()
		const opened = await session.openOutput({
			kind: 'nativeFile',
			resourceId: 'file:///data/media/clip.mp4',
			fileUrl: 'file:///data/media/clip.mp4',
		})

		expect(opened.url).toBe('blob:opened')
		expect(opened.fileUrl).toBe('file:///data/media/clip.mp4')
		opened.release()

		await expect(
			session.openOutput({ kind: 'browserStorage', resourceId: 'x', retention: 'persistent' }),
		).rejects.toThrowError(CameraCaptureError)

		await session.dispose()
	})

	it('fails requested audio without silently recording video only', async () => {
		const session = await ready(true)
		const outcome = await session.startRecording().completion
		expect(outcome.kind).toBe('failed')
		if (outcome.kind === 'failed') {
			expect(outcome.error.kind).toBe('permissionDenied')
		}

		expect(Recorder.instances).toHaveLength(0)
		await session.dispose()
	})

	it('records audio from the combined acquisition when microphone is granted', async () => {
		const audioTrack = new Track()
		audioTrack.kind = 'audio'
		vi.stubGlobal('navigator', {
			mediaDevices: {
				getUserMedia: vi.fn(async ({ audio }) =>
					audio ? new Stream([new Track(), audioTrack]) : new Stream([track]),
				),
				enumerateDevices: async () => [
					{ kind: 'videoinput', deviceId: 'camera-1', label: 'Webcam' },
					{ kind: 'audioinput', deviceId: 'mic-1', label: 'Mic' },
				],
			},
		})

		inspect.mockResolvedValue({
			durationMs: 1234,
			width: 1280,
			height: 720,
			orientation: 'unspecified',
			hasAudio: true,
			mimeType: 'video/mp4; codecs="avc1.4d402a, mp4a.40.2"',
		})

		const session = await ready(true)
		expect(await session.requestPermission('microphone')).toBe('granted')
		const take = session.startRecording()
		await flush()
		Recorder.instances.at(-1)!.begin()
		take.stop()
		Recorder.instances.at(-1)!.finish()
		const outcome = await take.completion
		expect(outcome.kind).toBe('clip')
		if (outcome.kind === 'clip') {
			expect(outcome.clip.hasAudio).toBe(true)
		}

		await session.dispose()
	})

	it('rejects fixed-orientation requests before admission', async () => {
		const session = await ready()
		expect(() => session.startRecording({ orientation: 'landscapeLeft' })).toThrowError(
			CameraCaptureError,
		)

		await session.dispose()
	})
})
