import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createImageRequests } from '../src/image-requests.ts'

function fixture(limit = 64) {
	const starts: { source: string; complete: (image: string | null) => void; cancelled: number }[] = []
	const errors: unknown[] = []
	const requests = createImageRequests<string>((source, complete) => {
		const load = { source, complete, cancelled: 0 }
		starts.push(load)
		return () => { load.cancelled++ }
	}, limit, (error) => errors.push(error))
	return { requests, starts, errors }
}

test('listeners exist before synchronous native completion and failed starts permit later retries', () => {
	let starts = 0
	const requests = createImageRequests<string>((source, complete) => {
		if (++starts === 1) throw new Error('start failed')
		complete(source)
	})
	const delivered: (string | null)[] = []
	requests.subscribe('same', (image) => delivered.push(image))
	requests.subscribe('same', (image) => delivered.push(image))
	requests.subscribe('same', (image) => delivered.push(image))
	assert.deepEqual(delivered, [null, 'same', 'same'])
	assert.equal(starts, 2)
})

test('shared work cancels only after the final subscriber leaves; late completion cannot warm cache or replace a retry', () => {
	const env = fixture()
	const delivered: string[] = []
	const first = env.requests.subscribe('same', () => delivered.push('first'))
	const second = env.requests.subscribe('same', () => delivered.push('second'))
	assert.equal(env.starts.length, 1)
	first()
	assert.equal(env.starts[0].cancelled, 0)
	second()
	second()
	assert.equal(env.starts[0].cancelled, 1)
	env.requests.subscribe('same', (value) => delivered.push(value!))
	env.starts[0].complete('stale')
	assert.deepEqual(delivered, [])
	env.starts[1].complete('fresh')
	assert.deepEqual(delivered, ['fresh'])
	env.requests.subscribe('same', (value) => delivered.push(value!))
	assert.deepEqual(delivered, ['fresh', 'fresh'])
	assert.equal(env.starts.length, 2)
})

test('cache is bounded by recent use and a cache hit never paints a pending placeholder', () => {
	const env = fixture(2)
	for (const source of ['a', 'b']) {
		env.requests.subscribe(source, () => {})
		env.starts.at(-1)!.complete(source)
	}
	let pending = 0
	env.requests.subscribe('a', () => {}, () => pending++)
	env.requests.subscribe('c', () => {}, () => pending++)
	env.starts.at(-1)!.complete('c')
	assert.equal(pending, 1)
	env.requests.subscribe('a', () => {})
	assert.equal(env.starts.length, 3)
	env.requests.subscribe('b', () => {})
	assert.equal(env.starts.length, 4) // a was used recently; b was evicted.
})

test('one delivery failure does not strand other views and null results are not cached', () => {
	const env = fixture()
	const delivered: (string | null)[] = []
	env.requests.subscribe('bad', () => { throw new Error('view failed') })
	env.requests.subscribe('bad', (value) => delivered.push(value))
	env.starts[0].complete(null)
	assert.equal(env.errors.length, 1)
	assert.deepEqual(delivered, [null])
	env.requests.subscribe('bad', (value) => delivered.push(value))
	assert.equal(env.starts.length, 2)
	env.starts[1].complete('recovered')
	assert.deepEqual(delivered, [null, 'recovered'])
})

test('two subscriptions using one callback retain independent cancellation ownership', () => {
	const env = fixture()
	let calls = 0
	const callback = () => calls++
	const first = env.requests.subscribe('duplicate-callback', callback)
	env.requests.subscribe('duplicate-callback', callback)
	first()
	assert.equal(env.starts[0].cancelled, 0)
	env.starts[0].complete('image')
	assert.equal(calls, 1)
})
