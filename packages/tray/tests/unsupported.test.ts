import { describe, expect, it } from 'vitest'

import { TrayError } from '../src/errors'
import * as native from '../src/index'
import * as web from '../src/index.web'
import * as windows from '../src/index.windows'

const variants = [
	{ name: 'native default', api: native, reason: 'unsupported-platform' },
	{ name: 'web', api: web, reason: 'unsupported-platform' },
] as const

describe('unsupported variants', () => {
	for (const { name, api, reason } of variants) {
		it(`${name} reports unavailable`, async () => {
			const availability = await api.getTrayAvailability()
			expect(availability.available).toBe(false)
			if (!availability.available) {
				expect(availability.reason).toBe(reason)
				expect(availability.message.length).toBeGreaterThan(0)
			}
		})

		it(`${name} rejects createTray with TrayError(${reason})`, async () => {
			await expect(
				api.createTray({ id: 't', icon: { type: 'named', name: 'star' } }),
			).rejects.toMatchObject({ name: 'TrayError', code: reason })
		})

		it(`${name} throws TrayError(${reason}) from window and residency helpers`, () => {
			for (const call of [
				() => api.showAppWindows(),
				() => api.hideAppWindows(),
				() => api.toggleAppWindows(),
				() => api.areAppWindowsVisible(),
				() => api.keepAppResident(),
				() => api.keepAppResident({ hideWindowsOnClose: true }),
			]) {
				expect(call).toThrowError(TrayError)
				expect(call).toThrowError(expect.objectContaining({ code: reason }))
			}
		})
	}

	it('web explains it needs a native desktop runtime', async () => {
		const availability = await web.getTrayAvailability()
		expect(availability.available).toBe(false)
		if (!availability.available) {
			expect(availability.message).toMatch(/native desktop runtime/)
			expect(availability.message).toMatch(/WebView/)
		}
	})
})

// The windows leaf is real, but on a host without the packaged runtime's
// Win32 projection it still reports and throws the same explicit unsupported
// state instead of crashing on a missing global.
describe('windows leaf without the Win32 projection', () => {
	it('reports unsupported-runtime', async () => {
		const availability = await windows.getTrayAvailability()
		expect(availability.available).toBe(false)
		if (!availability.available) {
			expect(availability.reason).toBe('unsupported-runtime')
			expect(availability.message).toMatch(/Win32 FFI/)
		}
	})

	it('rejects createTray with TrayError(unsupported-runtime)', async () => {
		await expect(
			windows.createTray({ id: 't', icon: { type: 'named', name: 'application' } }),
		).rejects.toMatchObject({ name: 'TrayError', code: 'unsupported-runtime' })
	})

	it('throws TrayError(unsupported-runtime) from window and residency helpers', () => {
		for (const call of [
			() => windows.showAppWindows(),
			() => windows.hideAppWindows(),
			() => windows.toggleAppWindows(),
			() => windows.areAppWindowsVisible(),
			() => windows.keepAppResident(),
		]) {
			expect(call).toThrowError(TrayError)
			expect(call).toThrowError(expect.objectContaining({ code: 'unsupported-runtime' }))
		}
	})
})
