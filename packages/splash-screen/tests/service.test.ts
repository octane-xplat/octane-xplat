import { beforeEach, describe, expect, it, vi } from 'vitest'
const fake = vi.hoisted(() => ({
	capabilities: vi.fn(() => ({ hold: true, fade: true, animationDuration: true })),
	preventAutoHide: vi.fn(() => true),
	hide: vi.fn(),
	configure: vi.fn(),
}))
vi.mock('../src/backend', () => ({ backend: fake }))
import { SplashScreen, hide, hideAsync, preventAutoHideAsync, setOptions } from '../src/service'
import { backend as unsupported } from '../src/unsupported'
import { UnavailabilityError } from '@octane-xplat/lib/capability'

beforeEach(() => vi.clearAllMocks())
describe('Expo-shaped startup methods', () => {
	it('arms prevention synchronously before returning its promise, including repeated calls', async () => {
		const pending = preventAutoHideAsync()
		expect(fake.preventAutoHide).toHaveBeenCalledTimes(1)
		expect(await pending).toBe(true)
		expect(await SplashScreen.preventAutoHideAsync()).toBe(true)
		fake.preventAutoHide.mockReturnValueOnce(false)
		expect(await preventAutoHideAsync()).toBe(false)
	})
	it('requests dismissal through either API without waiting for a native animation', async () => {
		expect(hide()).toBeUndefined()
		const pending = hideAsync()
		expect(fake.hide).toHaveBeenCalledTimes(2)
		expect(await pending).toBeUndefined()
	})
	it('passes valid options and rejects malformed values before touching native state', () => {
		setOptions({ fade: true, duration: 250 })
		expect(fake.configure).toHaveBeenCalledWith({ fade: true, duration: 250 })
		for (const value of [
			null,
			[],
			{ duration: -1 },
			{ duration: Infinity },
			{ duration: '400' },
			{ fade: 1 },
			{ unknown: true },
		]) {
			expect(() => setOptions(value as never)).toThrow()
		}
		expect(fake.configure).toHaveBeenCalledTimes(1)
	})
	it('reports unavailable hosts and refuses operations without creating a fake hold', () => {
		expect(unsupported.capabilities()).toEqual({
			hold: false,
			fade: false,
			animationDuration: false,
		})
		expect(() => unsupported.preventAutoHide()).toThrow(UnavailabilityError)
		expect(() => unsupported.hide()).toThrow(UnavailabilityError)
	})
})
