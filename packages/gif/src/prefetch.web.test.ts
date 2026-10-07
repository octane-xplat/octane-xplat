import { afterEach, describe, expect, it, vi } from 'vitest'
import { prefetch } from './prefetch.web'
import { prefetchBatch } from './prefetch-batch'

// Same web prefetch contract as @octane-xplat/image: throwaway <img> per URL,
// awaited until load/error, false when any URL fails, JS-side concurrency cap.

class MockImage {
	static instances: MockImage[] = []
	onload: (() => void) | null = null
	onerror: (() => void) | null = null
	set src(_url: string) {
		MockImage.instances.push(this)
	}
	load() {
		this.onload?.()
	}
	fail() {
		this.onerror?.()
	}
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

async function drainPending(promise: Promise<boolean>) {
	let result: boolean | undefined
	void promise.then((value) => {
		result = value
	})

	while (result === undefined) {
		for (const image of MockImage.instances.splice(0)) {
			image.load()
		}

		await flush()
	}

	return result
}

describe('prefetch (web)', () => {
	afterEach(() => {
		MockImage.instances = []
		vi.unstubAllGlobals()
	})

	it('resolves true only after every <img> fires load', async () => {
		vi.stubGlobal('Image', MockImage)
		const promise = prefetch(['https://x/a.gif', 'https://x/b.gif'])
		let settled = false
		void promise.then(() => {
			settled = true
		})

		await flush()
		expect(settled).toBe(false)
		expect(await drainPending(promise)).toBe(true)
	})

	it('resolves false when any URL fails', async () => {
		vi.stubGlobal('Image', MockImage)
		const promise = prefetch(['https://x/a.gif', 'https://x/b.gif'])
		const [failed] = MockImage.instances.splice(0)
		failed.fail()
		expect(await promise).toBe(false)
	})

	it('accepts a single URL and resolves true for an empty batch', async () => {
		vi.stubGlobal('Image', MockImage)
		expect(await prefetch([])).toBe(true)
		const promise = prefetch('https://x/a.gif')
		expect(MockImage.instances).toHaveLength(1)
		expect(await drainPending(promise)).toBe(true)
	})

	it('caps in-flight loads at options.concurrency', async () => {
		vi.stubGlobal('Image', MockImage)
		const promise = prefetch(
			Array.from({ length: 7 }, (_, i) => `https://x/${i}.gif`),
			{ concurrency: 2, headers: { Authorization: 'Bearer x' } },
		)

		expect(MockImage.instances).toHaveLength(2)
		MockImage.instances.splice(0).forEach((image) => image.load())
		await flush()
		await flush()
		expect(MockImage.instances.length).toBeLessThanOrEqual(2)
		expect(await drainPending(promise)).toBe(true)
	})

	it('defaults to five parallel loads', async () => {
		vi.stubGlobal('Image', MockImage)
		const promise = prefetch(Array.from({ length: 9 }, (_, i) => `https://x/${i}.gif`))
		expect(MockImage.instances).toHaveLength(5)
		expect(await drainPending(promise)).toBe(true)
	})
})

describe('prefetchBatch', () => {
	it('reports false if the warm callback throws', async () => {
		expect(await prefetchBatch(['a', 'b'], 5, () => Promise.reject(new Error('boom')))).toBe(false)
	})
})
