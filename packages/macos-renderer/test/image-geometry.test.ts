import assert from 'node:assert/strict'
import { test } from 'node:test'
import { notifyImageGeometry, setImageGeometryHandler } from '../src/image-geometry.ts'

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 5))
const view = () => ({ bounds: { size: { width: 80, height: 40 } }, window: { backingScaleFactor: 2 } as { backingScaleFactor: number } | null })

test('image geometry coalesces, deduplicates and uses its own window density', async () => {
	const host = view(), events: unknown[] = []
	setImageGeometryHandler(host, (event) => events.push(event))
	host.bounds.size.width = 100
	notifyImageGeometry(host)
	await tick()
	assert.deepEqual(events, [{ width: 100, height: 40, scale: 2 }])
	notifyImageGeometry(host)
	await tick()
	assert.equal(events.length, 1)
	host.window = { backingScaleFactor: 1 }
	notifyImageGeometry(host)
	await tick()
	assert.deepEqual(events[1], { width: 100, height: 40, scale: 1 })
	setImageGeometryHandler(host, undefined)
})

test('rebind uses the latest handler; teardown cancels scheduled delivery', async () => {
	const host = view(), events: string[] = []
	setImageGeometryHandler(host, () => events.push('old'))
	setImageGeometryHandler(host, () => events.push('new'))
	await tick()
	assert.deepEqual(events, ['new'])
	host.bounds.size.width = 200
	notifyImageGeometry(host)
	setImageGeometryHandler(host, undefined)
	await tick()
	assert.deepEqual(events, ['new'])
})

test('detached views wait for a window and invalid numeric metrics are bounded', async () => {
	const host = view(), events: unknown[] = []
	host.window = null
	setImageGeometryHandler(host, (event) => events.push(event))
	await tick()
	assert.deepEqual(events, [])
	host.window = { backingScaleFactor: NaN }
	host.bounds.size = { width: Infinity, height: -1 }
	notifyImageGeometry(host)
	await tick()
	assert.deepEqual(events, [{ width: 0, height: 0, scale: 1 }])
	setImageGeometryHandler(host, undefined)
})
