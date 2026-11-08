import { describe, expect, it } from 'vitest'

import { TrayError } from '../src/errors'
import * as native from '../src/index'
import * as web from '../src/index.web'
import * as windows from '../src/index.windows'

const variants = [
	{ name: 'native default', api: native, reason: 'unsupported-platform' },
	{ name: 'web', api: web, reason: 'unsupported-platform' },
	{ name: 'windows', api: windows, reason: 'unsupported-runtime' },
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

	it('windows explains the preview FFI limitation', async () => {
		const availability = await windows.getTrayAvailability()
		expect(availability.available).toBe(false)
		if (!availability.available) {
			expect(availability.message).toMatch(/Windows preview/)
		}
	})

	it('web explains it needs a native desktop runtime', async () => {
		const availability = await web.getTrayAvailability()
		expect(availability.available).toBe(false)
		if (!availability.available) {
			expect(availability.message).toMatch(/native desktop runtime/)
			expect(availability.message).toMatch(/WebView/)
		}
	})
})
