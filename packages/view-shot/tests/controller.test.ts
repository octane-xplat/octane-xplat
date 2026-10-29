import { describe, expect, it, vi } from 'vitest'
import { createCaptureController } from '../src/controller'
import type { CaptureLifecycleProps } from '../src/props'
import { resolveTarget } from '../src/targets'
import { normalizeOptions } from '../src/options'

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (error: Error) => void
	const promise = new Promise<T>((done, fail) => {
		resolve = done
		reject = fail
	})
	return { promise, resolve, reject }
}
const tick = async () => {
	await Promise.resolve()
	await Promise.resolve()
	await Promise.resolve()
}
function setup(initial: CaptureLifecycleProps = {}) {
	let props = initial
	const dependencies = {
		capture: vi.fn(async (_host: object, _options?: unknown) => 'owned:one'),
		release: vi.fn(),
		waitForLayout: vi.fn(async () => {}),
	}
	const controller = createCaptureController(() => props, dependencies)
	return {
		controller,
		dependencies,
		host: {},
		setProps(value: CaptureLifecycleProps) {
			props = value
			controller.rendered()
		},
	}
}
describe('capture lifecycle without capturing images', () => {
	it('mounts once, resolves component refs and releases automatic output on disposal', async () => {
		const onCapture = vi.fn()
		const { controller, dependencies, host } = setup({ captureMode: 'mount', onCapture })
		controller.attach(host)
		controller.rendered()
		await tick()
		controller.rendered()
		await tick()
		expect(onCapture).toHaveBeenCalledExactlyOnceWith('owned:one')
		expect(dependencies.capture).toHaveBeenCalledTimes(1)
		expect(resolveTarget({ current: controller.handle })).toBe(host)
		controller.dispose()
		controller.dispose()
		expect(dependencies.release).toHaveBeenCalledExactlyOnceWith('owned:one')
		expect(() => resolveTarget(controller.handle)).toThrow('disposed')
	})
	it('coalesces renders during capture, uses the latest props and releases superseded output', async () => {
		const onCapture = vi.fn(),
			pending = deferred<string>()
		const state = setup({ captureMode: 'update', onCapture })
		state.dependencies.capture
			.mockReturnValueOnce(pending.promise)
			.mockResolvedValueOnce('owned:two')
		state.controller.attach(state.host)
		state.controller.rendered()
		await tick()
		state.setProps({ captureMode: 'update', options: { quality: 0.4 }, onCapture })
		state.setProps({ captureMode: 'update', options: { quality: 0.8 }, onCapture })
		pending.resolve('owned:one')
		await tick()
		await tick()
		expect(state.dependencies.capture).toHaveBeenCalledTimes(2)
		expect(state.dependencies.capture).toHaveBeenLastCalledWith(state.host, { quality: 0.8 })
		expect(state.dependencies.release).toHaveBeenCalledExactlyOnceWith('owned:one')
		state.controller.dispose()
		expect(state.dependencies.release).toHaveBeenLastCalledWith('owned:two')
	})
	it('discards an automatic result that finishes after unmount and does not call stale callbacks', async () => {
		const pending = deferred<string>(),
			onCapture = vi.fn(),
			onCaptureFailure = vi.fn()
		const state = setup({ captureMode: 'mount', onCapture, onCaptureFailure })
		state.dependencies.capture.mockReturnValueOnce(pending.promise)
		state.controller.attach(state.host)
		state.controller.rendered()
		await tick()
		state.controller.dispose()
		pending.resolve('owned:late')
		await tick()
		expect(state.dependencies.release).toHaveBeenCalledExactlyOnceWith('owned:late')
		expect(onCapture).not.toHaveBeenCalled()
		expect(onCaptureFailure).not.toHaveBeenCalled()
	})
	it('keeps delivered manual results caller-owned, while releasing an undeliverable manual result', async () => {
		const state = setup()
		state.controller.attach(state.host)
		state.controller.rendered()
		expect(await state.controller.handle.capture()).toBe('owned:one')
		state.controller.dispose()
		expect(state.dependencies.release).not.toHaveBeenCalled()
		await expect(state.controller.handle.capture()).rejects.toThrow('not mounted')
		const other = setup(),
			pending = deferred<string>()
		other.dependencies.capture.mockReturnValueOnce(pending.promise)
		other.controller.attach(other.host)
		other.controller.rendered()
		const manual = other.controller.handle.capture()
		other.controller.dispose()
		pending.resolve('owned:late')
		await expect(manual).rejects.toThrow('unmounted')
		expect(other.dependencies.release).toHaveBeenCalledExactlyOnceWith('owned:late')
	})
	it('reports capture errors once and does not retry a mount endlessly', async () => {
		const onCaptureFailure = vi.fn(),
			error = new Error('native refusal')
		const state = setup({ captureMode: 'mount', onCaptureFailure })
		state.dependencies.capture.mockRejectedValueOnce(error)
		state.controller.attach(state.host)
		state.controller.rendered()
		await tick()
		state.controller.rendered()
		await tick()
		expect(onCaptureFailure).toHaveBeenCalledExactlyOnceWith(error)
		expect(state.dependencies.capture).toHaveBeenCalledTimes(1)
	})
	it('waits for commit, restarts mount ownership for a replacement host, and discards the old result', async () => {
		const pending = deferred<string>(),
			onCapture = vi.fn()
		const state = setup({ captureMode: 'mount', onCapture })
		state.dependencies.capture
			.mockReturnValueOnce(pending.promise)
			.mockResolvedValueOnce('owned:new-host')
		state.controller.attach(state.host)
		await tick()
		expect(state.dependencies.capture).not.toHaveBeenCalled()
		state.controller.rendered()
		await tick()
		const replacement = {}
		state.controller.attach(replacement)
		state.controller.rendered()
		pending.resolve('owned:old-host')
		await tick()
		await tick()
		expect(onCapture).toHaveBeenCalledExactlyOnceWith('owned:new-host')
		expect(state.dependencies.capture).toHaveBeenLastCalledWith(replacement, undefined)
		expect(state.dependencies.release).toHaveBeenCalledExactlyOnceWith('owned:old-host')
		state.controller.dispose()
	})
	it('rejects invalid refs, unsupported options and unbounded allocation before capture', () => {
		for (const target of [null, 1, { current: null }]) {
			expect(() => resolveTarget(target as never)).toThrow()
		}
		for (const options of [
			null,
			{ width: 0, height: 10 },
			{ width: 10 },
			{ width: 16000, height: 16000 },
			{ format: 'raw' },
			{ result: 'zip-base64' },
			{ quality: 1.01 },
			{ fileName: '../outside' },
			{ snapshotContentContainer: 'true' },
		]) {
			expect(() => normalizeOptions(options as never)).toThrow()
		}
		expect(normalizeOptions({ format: 'png' })).toMatchObject({
			format: 'png',
			quality: 1,
			result: 'tmpfile',
		})
	})
})
