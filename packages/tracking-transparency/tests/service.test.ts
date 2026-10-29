import { beforeEach, describe, expect, it, vi } from 'vitest'
const native = vi.hoisted(() => ({
	read: vi.fn(() => 0),
	request: vi.fn(async () => 3),
	advertisingId: vi.fn(() => null as string | null),
	advertisingIdAsync: vi.fn(async () => null as string | null),
	capabilities: () => ({ prompt: true, advertisingId: true, advertisingIdAsync: true }),
}))
vi.mock('../src/backend', () => ({ backend: native }))
import {
	getAdvertisingId,
	getAdvertisingIdAsync,
	getTrackingPermissionsAsync,
	isAvailable,
	requestTrackingPermissionsAsync,
} from '../src/service'
import { permissionResponse } from '../src/permission'
function deferred<T>() {
	let resolve!: (value: T) => void, reject!: (error: Error) => void
	const promise = new Promise<T>((done, fail) => {
		resolve = done
		reject = fail
	})
	return { promise, resolve, reject }
}
beforeEach(() => {
	vi.clearAllMocks()
	native.read.mockReturnValue(0)
	native.request.mockResolvedValue(3)
	native.advertisingId.mockReturnValue(null)
	native.advertisingIdAsync.mockResolvedValue(null)
})
describe('tracking permissions without native prompts or real identifiers', () => {
	it('maps all native states with Expo fields and preserves restrictions', () => {
		const undetermined = permissionResponse(0)
		expect(undetermined).toEqual({
			status: 'undetermined',
			granted: false,
			canAskAgain: true,
			expires: 'never',
			authorizationStatus: 'not-determined',
		})
		expect(permissionResponse(1)).toMatchObject({
			status: 'denied',
			canAskAgain: false,
			authorizationStatus: 'restricted',
		})
		expect(permissionResponse(2)).toMatchObject({
			status: 'denied',
			canAskAgain: false,
			authorizationStatus: 'denied',
		})
		expect(permissionResponse(3)).toMatchObject({
			status: 'granted',
			granted: true,
			canAskAgain: true,
		})
		expect(permissionResponse(-1)).toMatchObject({
			status: 'granted',
			authorizationStatus: 'unavailable',
		})
		expect(Object.isFrozen(undetermined)).toBe(true)
		expect(() => permissionResponse(99)).toThrow('Unknown')
	})
	it('reads without requesting and does not hide backend failures', async () => {
		expect(isAvailable()).toBe(true)
		await expect(getTrackingPermissionsAsync()).resolves.toMatchObject({ status: 'undetermined' })
		expect(native.request).not.toHaveBeenCalled()
		native.read.mockImplementationOnce(() => {
			throw new Error('missing fixture configuration')
		})
		await expect(getTrackingPermissionsAsync()).rejects.toThrow('missing fixture configuration')
	})
	it('coalesces concurrent prompts and permits a new explicit request after failure', async () => {
		const prompt = deferred<number>()
		native.request.mockReturnValueOnce(prompt.promise)
		const first = requestTrackingPermissionsAsync(),
			second = requestTrackingPermissionsAsync()
		expect(first).toBe(second)
		await Promise.resolve()
		expect(native.request).toHaveBeenCalledOnce()
		const refusal = expect(first).rejects.toThrow('inactive fixture')
		prompt.reject(new Error('inactive fixture'))
		await refusal
		await expect(requestTrackingPermissionsAsync()).resolves.toMatchObject({ status: 'granted' })
		expect(native.request).toHaveBeenCalledTimes(2)
	})
	it('normalizes zero identifiers and does not retain completed identifier results', async () => {
		const fixture = '11111111-1111-4111-8111-111111111111'
		native.advertisingId.mockReturnValueOnce('00000000-0000-0000-0000-000000000000')
		expect(getAdvertisingId()).toBe(null)
		native.advertisingIdAsync.mockResolvedValueOnce(fixture).mockResolvedValueOnce(null)
		const first = getAdvertisingIdAsync(),
			second = getAdvertisingIdAsync()
		expect(first).toBe(second)
		await expect(first).resolves.toBe(fixture)
		await expect(getAdvertisingIdAsync()).resolves.toBe(null)
		expect(native.advertisingIdAsync).toHaveBeenCalledTimes(2)
		native.advertisingId.mockReturnValueOnce('invalid fixture')
		expect(() => getAdvertisingId()).toThrow('Invalid advertising identifier reply')
	})
})
