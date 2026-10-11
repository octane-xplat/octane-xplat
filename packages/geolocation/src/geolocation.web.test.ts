import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
	vi.unstubAllGlobals()
	vi.resetModules()
})

it.each([
	[1, undefined, 'denied'],
	[3, undefined, 'granted'],
	[2, 'granted', 'granted'],
	[2, 'denied', 'denied'],
	[2, 'prompt', 'unsupported'],
	[2, undefined, 'unsupported'],
	[99, undefined, 'unsupported'],
])('ensure classifies error %s with permission %s as %s', async (code, state, expected) => {
	vi.stubGlobal('navigator', {
		geolocation: { getCurrentPosition: (_success: any, failure: any) => failure({ code }) },
		permissions: state ? { query: vi.fn().mockResolvedValue({ state }) } : undefined,
	})

	const { geolocation } = await import('./geolocation.web')
	expect(await geolocation.ensure()).toBe(expected)
	await expect(geolocation.impl!.getCurrentPosition()).rejects.toEqual({ code })
})

it('keeps unsupported permission queries from throwing', async () => {
	vi.stubGlobal('navigator', {
		geolocation: { getCurrentPosition: (_success: any, failure: any) => failure({ code: 2 }) },
		permissions: { query: vi.fn().mockRejectedValue(new Error('Not implemented')) },
	})

	const { geolocation } = await import('./geolocation.web')
	expect(await geolocation.ensure()).toBe('unsupported')
})
