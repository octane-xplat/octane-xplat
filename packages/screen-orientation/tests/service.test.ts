import { beforeEach, describe, expect, it, vi } from 'vitest'
const fake = vi.hoisted(() => ({
	capabilities: vi.fn(() => ({ observe: true, lock: true })),
	info: vi.fn(() => ({ orientation: 1 })),
	policy: vi.fn(() => 0),
	platformPolicy: vi.fn(() => ({})),
	supports: vi.fn(() => true),
	lock: vi.fn(async (_value: number) => {}),
	unlock: vi.fn(async () => {}),
	lockPlatform: vi.fn(async (_value: unknown) => {}),
	subscribe: vi.fn((_callback: () => void) => ({ remove: vi.fn() })),
	iosSupportedOrientations: vi.fn(),
}))
vi.mock('../src/backend', () => ({ backend: fake }))
import {
	addOrientationChangeListener,
	lockAsync,
	lockPlatformAsync,
	supportsOrientationLockAsync,
	unlockAsync,
} from '../src/service'
import { backend as unsupported } from '../src/unsupported'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
beforeEach(() => vi.clearAllMocks())
describe('orientation request ownership', () => {
	it('serializes locks, preserves failure and allows a later default request', async () => {
		let release!: () => void
		fake.lock.mockImplementationOnce(
			() =>
				new Promise<void>((resolve) => {
					release = resolve
				}),
		)
		fake.lock.mockRejectedValueOnce(new Error('OS refusal'))
		const first = lockAsync(5),
			second = lockAsync(3),
			third = unlockAsync()
		const rejected = expect(second).rejects.toThrow('OS refusal')
		await Promise.resolve()
		expect(fake.lock).toHaveBeenCalledTimes(1)
		release()
		await first
		await rejected
		await third
		expect(fake.lock.mock.calls.map((call) => call[0])).toEqual([5, 3])
		expect(fake.unlock).toHaveBeenCalledTimes(1)
	})
	it('rejects malformed locks and snapshots arrays before queuing', async () => {
		for (const value of [-1, 8, 9, 10, NaN, 1.5, '3', null]) {
			await expect(lockAsync(value as never)).rejects.toThrow(RangeError)
			await expect(supportsOrientationLockAsync(value as never)).rejects.toThrow(RangeError)
		}
		for (const value of [
			null,
			[],
			{},
			{ unknown: 1 },
			{ screenOrientationArrayIOS: [] },
			{ screenOrientationArrayIOS: [0] },
			{ screenOrientationLockWeb: 'unknown' },
			{ screenOrientationConstantAndroid: 15 },
			{ screenOrientationLockWeb: 'portrait', screenOrientationConstantAndroid: 1 },
		]) {
			await expect(lockPlatformAsync(value as never)).rejects.toThrow()
		}
		const orientations: (1 | 3)[] = [1, 3]
		const result = lockPlatformAsync({ screenOrientationArrayIOS: orientations })
		orientations.splice(0, 2)
		await result
		expect(fake.lockPlatform).toHaveBeenLastCalledWith({ screenOrientationArrayIOS: [1, 3] })
		expect(fake.lock).not.toHaveBeenCalled()
	})
	it('emits axis changes once and removes only its own subscription, idempotently', () => {
		const listener = vi.fn()
		fake.info.mockReturnValue({ orientation: 1 })
		const subscription = addOrientationChangeListener(listener)
		const notify = fake.subscribe.mock.calls[0]![0]
		fake.info.mockReturnValue({ orientation: 2 })
		notify()
		fake.info.mockReturnValue({ orientation: 0 })
		notify()
		fake.info.mockReturnValue({ orientation: 3 })
		notify()
		fake.info.mockReturnValue({ orientation: 4 })
		notify()
		expect(listener).toHaveBeenCalledTimes(1)
		expect(listener).toHaveBeenCalledWith({
			orientationInfo: { orientation: 3 },
			orientationLock: 0,
		})
		subscription.remove()
		subscription.remove()
		fake.info.mockReturnValue({ orientation: 1 })
		notify()
		expect(listener).toHaveBeenCalledTimes(1)
		expect(fake.subscribe.mock.results[0]!.value.remove).toHaveBeenCalledTimes(1)
	})
	it('does not invent a desktop policy', async () => {
		expect(unsupported.capabilities()).toEqual({ observe: false, lock: false })
		expect(unsupported.supports(5)).toBe(false)
		expect(() => unsupported.info()).toThrow(UnavailabilityError)
		await expect(unsupported.lock(5)).rejects.toThrow(UnavailabilityError)
	})
})
