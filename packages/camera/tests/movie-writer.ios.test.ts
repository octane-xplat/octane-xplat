import { describe, expect, it, vi } from 'vitest'
import { IOSMovieWriterDriver } from '../src/movie-writer.ios'
import type { IOSMovieWriter } from '../src/movie-writer.ios'

const front = { id: 'front', label: 'Front', facing: 'front' as const }
function setup() {
	const callbacks: ((type: string, payload: string) => void)[] = []
	const switches: ((error: string | null) => void)[] = []
	let released: (() => void) | undefined
	const native: IOSMovieWriter = {
		install: () => null,
		configureAudio: () => null,
		observeSource: () => {},
		setPreviewLayer: () => {},
		expectCamera: () => {},
		startAudioOrientationMaximumDurationMsReply: vi.fn(
			(_path, _audio, _orientation, _limit, callback) => {
				callbacks.push(callback)
			},
		),
		switchToReply: vi.fn((_id, callback) => {
			switches.push(callback)
		}),
		cancelSwitch: vi.fn(),
		confirmSwitch: vi.fn(),
		stop: vi.fn(),
		elapsedMs: () => 0,
		releaseWithReply: (callback) => {
			released = callback
		},
	}
	const driver = new IOSMovieWriterDriver(native)
	const event = vi.fn()
	const start = () => driver.start('/take.mov', true, 1, 60000, event)
	return { native, driver, event, start, callbacks, switches, release: () => released?.() }
}

describe('candidate iOS writer lifecycle', () => {
	it('passes recording intent to native and joins a camera-only swap', async () => {
		const h = setup()
		h.start()
		expect(h.native.startAudioOrientationMaximumDurationMsReply).toHaveBeenCalledWith(
			'/take.mov',
			true,
			1,
			60000,
			expect.any(Function),
		)
		const flip = h.driver.switchCamera(front)
		h.switches[0]!(null)
		await expect(flip.completion).resolves.toEqual(front)
		expect(h.native.stop).not.toHaveBeenCalled()
		expect(h.native.startAudioOrientationMaximumDurationMsReply).toHaveBeenCalledTimes(1)
	})

	it('keeps native ownership after a failed switch and permits a retry', async () => {
		const h = setup()
		h.start()
		const flip = h.driver.switchCamera(front)
		h.switches[0]!('Restored old camera')
		await expect(flip.completion).rejects.toMatchObject({ kind: 'unavailable' })
		const retry = h.driver.switchCamera(front)
		h.switches[1]!(null)
		await expect(retry.completion).resolves.toEqual(front)
		expect(h.native.stop).not.toHaveBeenCalled()
	})

	it('cancels on stop, rejects switching while finalizing and retires late selection', async () => {
		const h = setup()
		h.start()
		const flip = h.driver.switchCamera(front)
		const rejected = expect(flip.completion).rejects.toMatchObject({ kind: 'invalidState' })
		h.driver.stop()
		await rejected
		expect(() => h.driver.switchCamera(front)).toThrow()
		h.switches[0]!(null)
		expect(h.native.cancelSwitch).toHaveBeenCalledTimes(1)
		expect(h.native.stop).toHaveBeenCalledTimes(1)
	})

	it.each(['limit', 'finishing', 'sourceLost', 'failed', 'finished'])(
		'retires a pending switch on %s',
		async (type) => {
			const h = setup()
			h.start()
			const flip = h.driver.switchCamera(front)
			const rejected = expect(flip.completion).rejects.toMatchObject({ kind: 'invalidState' })
			h.callbacks[0]!(type, '')
			await rejected
			expect(() => h.driver.switchCamera(front)).toThrow()
		},
	)

	it('allows terminal listeners to start the next take and ignores the old terminal callback', () => {
		const h = setup()
		const next = vi.fn()
		h.driver.start('/first.mov', false, 1, 0, (type) => {
			if (type === 'finished') {
				h.driver.start('/second.mov', true, 1, 0, next)
			}
		})
		h.callbacks[0]!('finished', '{}')
		h.callbacks[0]!('failed', 'late failure')
		expect(next).not.toHaveBeenCalled()
		h.callbacks[1]!('started', '{}')
		expect(next).toHaveBeenCalledOnce()
	})

	it('does not let an old operation cancel a newer switch', async () => {
		const h = setup()
		h.start()
		const first = h.driver.switchCamera(front)
		h.switches[0]!(null)
		await first.completion
		first.commit!()
		const second = h.driver.switchCamera(front)
		first.cancel()
		expect(h.native.cancelSwitch).not.toHaveBeenCalled()
		h.switches[1]!(null)
		await expect(second.completion).resolves.toEqual(front)
	})

	it('rejects pending work on release and joins native teardown', async () => {
		const h = setup()
		h.start()
		const flip = h.driver.switchCamera(front)
		const rejected = expect(flip.completion).rejects.toMatchObject({ kind: 'invalidState' })
		let joined = false
		const firstRelease = h.driver.release()
		expect(h.driver.release()).toBe(firstRelease)
		const disposal = firstRelease.then(() => {
			joined = true
		})
		await rejected
		expect(joined).toBe(false)
		h.callbacks[0]!('finished', '{}')
		expect(h.event).not.toHaveBeenCalled()
		h.release()
		await disposal
		expect(() => h.start()).toThrow()
	})

	it('keeps stop ownership if native cancellation throws', async () => {
		const h = setup()
		h.start()
		const flip = h.driver.switchCamera(front)
		const rejected = expect(flip.completion).rejects.toMatchObject({ kind: 'invalidState' })
		vi.mocked(h.native.cancelSwitch).mockImplementation(() => {
			throw new Error('native error')
		})
		h.driver.stop()
		await rejected
		expect(h.native.stop).toHaveBeenCalledOnce()
	})
})

it('can retry a synchronous native start failure without accepting its late callback', () => {
	const h = setup()
	let late: ((type: string, payload: string) => void) | undefined
	vi.mocked(h.native.startAudioOrientationMaximumDurationMsReply).mockImplementationOnce(
		(_path, _audio, _orientation, _limit, callback) => {
			late = callback
			throw new Error('Native admission failed')
		},
	)
	expect(() => h.start()).toThrow('Native admission failed')
	h.start()
	late?.('failed', 'late')
	expect(h.event).not.toHaveBeenCalled()
})

it('keeps a successful native acquisition cancellable until the core commits it', async () => {
	const h = setup()
	h.start()
	const operation = h.driver.switchCamera(front)
	h.switches[0]!(null)
	await operation.completion
	h.driver.stop()
	expect(h.native.cancelSwitch).toHaveBeenCalledOnce()
	expect(h.native.confirmSwitch).not.toHaveBeenCalled()
	expect(() => operation.commit!()).toThrow()
})
