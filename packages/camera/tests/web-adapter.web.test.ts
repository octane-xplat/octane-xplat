import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SharedCameraSession } from '../src/session-core'
import { createSessionBackend } from '../src/session-backend.web'
import { CameraCaptureError } from '../src/types'

const storage = vi.hoisted(() => ({
	reserve: vi.fn(),
	commit: vi.fn(),
	remove: vi.fn(),
	inspect: vi.fn(),
}))

vi.mock('../src/movie-storage.web', () => ({
	reserveMovie: storage.reserve,
	commitMovie: storage.commit,
	removeReservation: storage.remove,
	openStoredMovie: vi.fn(),
}))

vi.mock('../src/movie-metadata.web', () => ({ inspectMovie: storage.inspect }))

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
	static isTypeSupported() {
		return true
	}
	state = 'inactive'
	mimeType = 'video/webm;codecs=vp8'
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
	documentEvents = Object.assign(new EventTarget(), { visibilityState: 'visible' })
	vi.stubGlobal('document', documentEvents)
	vi.stubGlobal('isSecureContext', true)
	vi.stubGlobal('MediaStream', Stream)
	vi.stubGlobal('MediaRecorder', Recorder)
	vi.stubGlobal('indexedDB', {})
	vi.stubGlobal('addEventListener', vi.fn())
	vi.stubGlobal('removeEventListener', vi.fn())
	vi.stubGlobal('navigator', {
		permissions: { query: async () => ({ state: 'granted' }) },
		storage: { persisted: async () => true },
		mediaDevices: {
			getUserMedia: async () => new Stream([track]),
			enumerateDevices: async () => [{ kind: 'videoinput', deviceId: 'camera-1', label: 'Camera' }],
		},
	})

	storage.reserve.mockResolvedValue('stored-id')
	storage.commit.mockResolvedValue(undefined)
	storage.remove.mockResolvedValue(undefined)
	storage.inspect.mockResolvedValue({
		durationMs: 1234,
		width: 1280,
		height: 720,
		orientation: 'unspecified',
		hasAudio: false,
		mimeType: 'video/webm;codecs=vp8',
	})
})

afterEach(() => {
	vi.unstubAllGlobals()
	vi.useRealTimers()
	vi.clearAllMocks()
})

describe('web adapter finalization ownership', () => {
	it('keeps completion and dispose pending until metadata and storage commit complete', async () => {
		let commit!: () => void
		storage.commit.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					commit = resolve
				}),
		)

		const session = await ready()
		const take = session.startRecording()
		await flush()
		const recorder = Recorder.instances.at(-1)!
		recorder.begin()
		const first = take.stop()
		expect(take.stop()).toBe(first)
		recorder.finish()
		await flush()
		expect(session.snapshot().state).toBe('finalizing')
		expect(() => session.startRecording()).toThrowError(CameraCaptureError)
		let disposed = false
		const disposing = session.dispose().then(() => {
			disposed = true
		})

		await flush()
		expect(disposed).toBe(false)
		commit()
		expect((await first).kind).toBe('clip')
		await disposing
		expect(session.snapshot().state).toBe('disposed')
	})

	it('early Stop waits for capture start and finishes exactly once', async () => {
		const session = await ready()
		const events: string[] = []
		session.subscribe((event) => events.push(event.type))
		const take = session.startRecording()
		const completion = take.stop()
		await flush()
		const recorder = Recorder.instances.at(-1)!
		recorder.begin()
		expect(recorder.state).toBe('inactive')
		recorder.finish()
		await completion
		recorder.begin()
		recorder.finish()
		expect(events.filter((type) => type === 'started')).toHaveLength(1)
		expect(events.filter((type) => type === 'finished')).toHaveLength(1)
		await session.dispose()
	})

	it('cleans reserved output on metadata or storage failure and never returns an ephemeral clip', async () => {
		storage.commit.mockRejectedValue(
			new CameraCaptureError({
				kind: 'storageFailed',
				operation: 'commit',
				message: 'Storage commit failed',
			}),
		)

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
		}

		expect(storage.remove).toHaveBeenCalledWith('stored-id')
		await session.dispose()
	})

	it('track loss requests a stop and produces an interrupted partial clip', async () => {
		const session = await ready()
		const take = session.startRecording()
		await flush()
		const recorder = Recorder.instances.at(-1)!
		recorder.begin()
		track.readyState = 'ended'
		track.dispatchEvent(new Event('ended'))
		expect(recorder.state).toBe('inactive')
		recorder.finish()
		const outcome = await take.completion
		expect(outcome.kind).toBe('clip')
		if (outcome.kind === 'clip') {
			expect(outcome.endReason).toBe('cameraUnavailable')
			expect(outcome.partial).toBe(true)
		}

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

	it('a lost finalization callback fails once, cleans output, and ignores late callbacks', async () => {
		vi.useFakeTimers()
		const session = await ready()
		const events: string[] = []
		session.subscribe((event) => events.push(event.type))
		const take = session.startRecording()
		await flush()
		const recorder = Recorder.instances.at(-1)!
		recorder.begin()
		take.stop()
		await vi.advanceTimersByTimeAsync(30_000)
		const outcome = await take.completion
		expect(outcome.kind).toBe('failed')
		if (outcome.kind === 'failed') {
			expect(outcome.error.kind).toBe('finalizationFailed')
		}

		recorder.finish()
		await flush()
		expect(storage.remove).toHaveBeenCalledWith('stored-id')
		expect(storage.commit).not.toHaveBeenCalled()
		expect(events.filter((type) => type === 'finished')).toHaveLength(1)
		await session.dispose()
	})

	it('does not overflow very large duration timers', async () => {
		vi.useFakeTimers()
		const session = await ready()
		const take = session.startRecording({ maximumDurationMs: 2_147_483_648 })
		await flush()
		const recorder = Recorder.instances.at(-1)!
		recorder.begin()
		await vi.advanceTimersByTimeAsync(20)
		expect(take.state).toBe('recording')
		take.stop()
		recorder.finish()
		await take.completion
		await session.dispose()
	})
})
