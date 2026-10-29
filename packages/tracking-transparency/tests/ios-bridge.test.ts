import { afterEach, expect, it, vi } from 'vitest'
afterEach(() => {
	vi.unstubAllGlobals()
	vi.resetModules()
})
it('requires the native bridge and never turns a missing iOS plugin into a grant', async () => {
	vi.stubGlobal('XplatTrackingTransparency', undefined)
	const { backend } = await import('../src/backend.ios')
	expect(backend.capabilities().prompt).toBe(false)
	expect(() => backend.read()).toThrow('rebuild')
	await expect(backend.request()).rejects.toThrow('rebuild')
})
it('preserves old-OS no-gate status and native configuration errors through the real adapter', async () => {
	const native = {
		available: () => false,
		read: () => '{"status":-1}',
		request: vi.fn((done: (reply: string) => void) => done('{"error":"missing fixture purpose"}')),
		advertisingId: () => null,
	}
	vi.stubGlobal('XplatTrackingTransparency', { new: () => native })
	const { backend } = await import('../src/backend.ios')
	expect(backend.read()).toBe(-1)
	expect(backend.capabilities()).toEqual({
		prompt: false,
		advertisingId: true,
		advertisingIdAsync: true,
	})
	await expect(backend.request()).rejects.toThrow('missing fixture purpose')
	expect(backend.advertisingId()).toBe(null)
})
