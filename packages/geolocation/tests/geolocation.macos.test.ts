import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { geolocation } from '../src/geolocation.macos.ts'
import { permissions } from '../../platform/src/permissions.ts'

const globals = globalThis as any
afterEach(() => {
	delete globals.XplatGeolocation
})

const position = {
	latitude: 1,
	longitude: 2,
	accuracy: 3,
	altitude: null,
	heading: null,
	speed: null,
	timestamp: 123,
}

test('missing or unconfigured hosts remain unsupported through both entry points', async () => {
	for (const host of [undefined, { isAvailable: () => false }]) {
		globals.XplatGeolocation = host
		assert.equal(geolocation.supported, false)
		assert.equal(geolocation.impl, null)
		assert.equal(await geolocation.ensure(), 'unsupported')
		assert.equal(await permissions.ensure('location'), 'unsupported')
	}
})

test('permission outcomes remain distinct and register with the permission dispatcher', async () => {
	for (const result of ['granted', 'denied', 'unsupported']) {
		globals.XplatGeolocation = {
			isAvailable: () => true,
			ensure: (done: any) => done(result),
		}

		assert.equal(geolocation.supported, true)
		assert.equal(await geolocation.ensure(), result)
		assert.equal(await permissions.ensure('location'), result)
	}
})

test('position options, JSON normalization, and concurrent callbacks stay independent', async () => {
	const calls: any[] = []
	globals.XplatGeolocation = {
		isAvailable: () => true,
		positionTimeoutMaximumAgeCompletion: (...args: any[]) => calls.push(args),
	}

	const first = geolocation.impl!.getCurrentPosition({
		enableHighAccuracy: true,
		timeout: 25,
		maximumAge: 50,
	})

	const second = geolocation.impl!.getCurrentPosition()
	assert.deepEqual(
		calls.map((call) => call.slice(0, 3)),
		[
			[true, 25, 50],
			[false, -1, 0],
		],
	)

	calls[1][3](JSON.stringify(position), 0, '')
	calls[0][3](JSON.stringify({ ...position, latitude: 9 }), 0, '')
	assert.deepEqual(await second, position)
	assert.equal((await first).latitude, 9)
})

test('denial, unavailable, timeout and an unloaded host reject with distinct codes', async () => {
	for (const code of [1, 2, 3]) {
		globals.XplatGeolocation = {
			isAvailable: () => true,
			positionTimeoutMaximumAgeCompletion: (_a: any, _b: any, _c: any, done: any) =>
				done(null, code, 'native error'),
		}

		await assert.rejects(geolocation.impl!.getCurrentPosition(), {
			code,
			message: 'native error',
		})
	}

	const impl = geolocation.impl!
	delete globals.XplatGeolocation
	await assert.rejects(impl.getCurrentPosition(), { code: 2 })
})
