import { describe, expect, it } from 'vitest'
import { createConverter } from '../src/core'
import type { ConversionBackend } from '../src/backend-types'
import type { ConvertedVideo } from '../src/types'
const video: ConvertedVideo = {
	uri: 'owned.mp4',
	width: 2,
	height: 2,
	duration: 100,
	mimeType: 'video/mp4',
}

function deferred<T>() {
	let resolve!: (value: T) => void
	const promise = new Promise<T>((done) => {
		resolve = done
	})
	return { promise, resolve }
}

function fixture() {
	const released: string[] = []
	const backend: ConversionBackend = {
		isAvailable: async () => true,
		convert: async () => ({ ...video }),
		release: (uri) => {
			released.push(uri)
		},
	}
	return { backend, released, api: createConverter(backend) }
}

describe('conversion ownership', () => {
	it('only releases successful owned outputs and allows retry after a removal failure', async () => {
		const { api, backend, released } = fixture()
		api.releaseVideo(video)
		expect(released).toEqual([])
		const output = await api.convertGif('source.gif').result
		backend.release = () => {
			throw new Error('filesystem busy')
		}
		expect(() => api.releaseVideo(output)).toThrow('filesystem busy')
		backend.release = (uri) => {
			released.push(uri)
		}
		api.releaseVideo(output)
		api.releaseVideo(output)
		expect(released).toEqual(['owned.mp4'])
	})
	it('cancels before backend startup', async () => {
		const { api, backend } = fixture()
		let started = false
		backend.convert = async () => {
			started = true
			return video
		}
		const job = api.convertGif('source.gif')
		job.cancel()
		job.cancel()
		await expect(job.result).rejects.toHaveProperty('name', 'AbortError')
		expect(started).toBe(false)
	})
	it('cancellation wins over a pending unavailable encoder check', async () => {
		const { api, backend } = fixture()
		const available = deferred<boolean>(),
			checking = deferred<void>()
		backend.isAvailable = async () => {
			checking.resolve()
			return available.promise
		}
		const job = api.convertGif('input.gif')
		await checking.promise
		job.cancel()
		available.resolve(false)
		await expect(job.result).rejects.toHaveProperty('name', 'AbortError')
	})
	it('cleans an output completed during cancellation', async () => {
		const { api, backend, released } = fixture(),
			pending = deferred<ConvertedVideo>(),
			started = deferred<void>()
		let cancelled = 0
		backend.convert = async (_source, _request, control) => {
			control.onCancel(() => cancelled++)
			started.resolve()
			return pending.promise
		}
		const job = api.convertGif('source.gif')
		await started.promise
		job.cancel()
		job.cancel()
		pending.resolve(video)
		await expect(job.result).rejects.toHaveProperty('name', 'AbortError')
		expect(cancelled).toBe(1)
		expect(released).toEqual(['owned.mp4'])
	})
	it('cancels and cleans up when a progress observer throws', async () => {
		const { api, backend, released } = fixture()
		backend.convert = async (_source, _request, control) => {
			control.progress(0.5)
			return video
		}
		await expect(
			api.convertGif('source.gif', {
				onProgress: () => {
					throw new Error('observer failed')
				},
			}).result,
		).rejects.toThrow('observer failed')
		expect(released).toEqual(['owned.mp4'])
	})
	it('does not cancel or remove a delivered result', async () => {
		const { api, released } = fixture()
		const job = api.convertGif('source.gif')
		await job.result
		job.cancel()
		expect(released).toEqual([])
	})
	it('rejects unsupported conversions and invalid options', async () => {
		const { api, backend } = fixture()
		backend.isAvailable = async () => false
		await expect(api.convertGif('source.gif').result).rejects.toThrow('GIF to mp4')
		expect(() => api.convertGif('')).toThrow()
		expect(() => api.convertGif('x', { backgroundColor: 'transparent' })).toThrow()
		expect(() => api.convertGif('x', { bitrate: NaN })).toThrow()
		expect(() => api.convertGif('x', { format: 'avi' as 'mp4' })).toThrow()
	})
	it('reports monotonic bounded progress and propagates backend errors without owning inputs', async () => {
		const { api, backend, released } = fixture()
		const progress: number[] = []
		backend.convert = async (_source, _request, control) => {
			for (const value of [-1, 0.7, 0.2, NaN, 2]) {
				control.progress(value)
			}
			throw new Error('bad GIF')
		}
		await expect(
			api.convertGif('input.gif', { onProgress: (value) => progress.push(value) }).result,
		).rejects.toThrow('bad GIF')
		expect(progress).toEqual([0, 0.7, 1])
		expect(released).toEqual([])
	})
})
