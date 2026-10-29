import { beforeEach, describe, expect, it, vi } from 'vitest'
const fake = vi.hoisted(() => ({
	validate: vi.fn(),
	capture: vi.fn(),
	captureScreen: vi.fn(),
	release: vi.fn(),
	capabilities: () => ({ view: true, screen: false, formats: ['png'], scrollContent: false }),
}))
vi.mock('../src/backend', () => ({ backend: fake }))
import { captureRef, captureScreen, releaseCapture, viewShot } from '../src/service'
const tick = async () => {
	await Promise.resolve()
	await Promise.resolve()
	await Promise.resolve()
}
beforeEach(() => {
	vi.clearAllMocks()
	fake.capture.mockResolvedValue('owned:fixture')
})
describe('service ordering with string-only fixtures', () => {
	it('snapshots options and serializes ref/screen operations, recovering after rejection', async () => {
		let reject!: (error: Error) => void
		fake.capture.mockReturnValueOnce(
			new Promise((_done, fail) => {
				reject = fail
			}),
		)
		fake.captureScreen.mockResolvedValueOnce('owned:screen')
		const options = { quality: 0.3 }
		const first = captureRef({}, options)
		const second = captureScreen()
		options.quality = 0.9
		await tick()
		expect(fake.capture).toHaveBeenCalledOnce()
		expect(fake.capture.mock.calls[0][1].quality).toBe(0.3)
		expect(fake.captureScreen).not.toHaveBeenCalled()
		const refusal = expect(first).rejects.toThrow('fixture refusal')
		reject(new Error('fixture refusal'))
		await refusal
		await expect(second).resolves.toBe('owned:screen')
		await expect(captureRef({})).resolves.toBe('owned:fixture')
	})
	it('revalidates a queued target before dispatch and freezes capability snapshots', async () => {
		fake.validate
			.mockImplementationOnce(() => {})
			.mockImplementationOnce(() => {
				throw new Error('detached fixture')
			})
		await expect(captureRef({})).rejects.toThrow('detached fixture')
		expect(fake.capture).not.toHaveBeenCalled()
		expect(Object.isFrozen(viewShot.capabilities.formats)).toBe(true)
		expect(() => releaseCapture(null as never)).toThrow(TypeError)
	})
})
