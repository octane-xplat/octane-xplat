import { expect, it, vi } from 'vitest'
const api = vi.hoisted(() => ({ getCurrentLocation: vi.fn(), enableLocationRequest: vi.fn() }))
vi.mock('@nativescript/geolocation', () => api)
vi.mock('@nativescript/core', () => ({ CoreTypes: { Accuracy: { high: 1, any: 0 } } }))
import { geolocation } from './geolocation.ts'
const fix = { latitude: 1, longitude: 2, horizontalAccuracy: 3, timestamp: new Date(123) }

it('uses Android presence flags while preserving real zero and negative altitude', async () => {
	for (const present of [false, true]) {
		api.getCurrentLocation.mockResolvedValue({
			...fix,
			altitude: -10,
			speed: 0,
			direction: 0,
			android: { hasAltitude: () => present, hasSpeed: () => present, hasBearing: () => present },
		})

		expect(await geolocation.impl!.getCurrentPosition()).toEqual({
			latitude: 1,
			longitude: 2,
			accuracy: 3,
			altitude: present ? -10 : null,
			speed: present ? 0 : null,
			heading: present ? 0 : null,
			timestamp: 123,
		})
	}
})

it('uses iOS altitude validity and rejects negative course/speed sentinels', async () => {
	api.getCurrentLocation.mockResolvedValue({
		...fix,
		altitude: -10,
		speed: -1,
		direction: -1,
		ios: { verticalAccuracy: -1 },
	})

	const absent = await geolocation.impl!.getCurrentPosition()
	expect([absent.altitude, absent.heading, absent.speed]).toEqual([null, null, null])
	api.getCurrentLocation.mockResolvedValue({
		...fix,
		altitude: -10,
		speed: 0,
		direction: 0,
		ios: { verticalAccuracy: 1 },
	})

	const present = await geolocation.impl!.getCurrentPosition()
	expect([present.altitude, present.heading, present.speed]).toEqual([-10, 0, 0])
})

it('preserves plugin errors without inventing numeric codes from localized text', async () => {
	const error = new Error('Localized platform failure')
	api.getCurrentLocation.mockRejectedValue(error)
	await expect(geolocation.impl!.getCurrentPosition()).rejects.toBe(error)
})
