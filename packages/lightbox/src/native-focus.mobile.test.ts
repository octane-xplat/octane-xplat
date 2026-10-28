import { afterEach, expect, it, vi } from 'vitest'
import { restoreNativeFocus } from './native-focus'
afterEach(() => vi.useRealTimers())
it('waits for actual layer detachment, tries the explicit target first, and skips invalid targets', async () => {
	vi.useFakeTimers()
	const layer: { parent?: object } = { parent: {} }
	const stale = { parent: null, focus: vi.fn(() => true) }
	const explicit = { parent: {}, isLoaded: true, focus: vi.fn(() => true) }
	const trigger = { parent: {}, focus: vi.fn(() => true) }
	const cancel = restoreNativeFocus(layer, () => [stale, explicit, trigger], () => true)
	await vi.advanceTimersByTimeAsync(32)
	expect(explicit.focus).not.toHaveBeenCalled()
	layer.parent = undefined
	await vi.advanceTimersByTimeAsync(16)
	expect(stale.focus).not.toHaveBeenCalled()
	expect(explicit.focus).toHaveBeenCalledOnce()
	expect(trigger.focus).not.toHaveBeenCalled()
	cancel()
})
it('falls back when a target rejects keyboard focus and cancels when the viewer reopens', async () => {
	vi.useFakeTimers()
	const explicit = { parent: {}, focus: vi.fn(() => false) }
	const trigger = { parent: {}, focus: vi.fn(() => true) }
	restoreNativeFocus({}, () => [explicit, trigger], () => true)
	await vi.advanceTimersByTimeAsync(1)
	expect(trigger.focus).toHaveBeenCalledOnce()
	let current = true
	const layer: { parent?: object } = { parent: {} }
	restoreNativeFocus(layer, () => [trigger], () => current)
	await vi.advanceTimersByTimeAsync(1)
	current = false; layer.parent = undefined
	await vi.advanceTimersByTimeAsync(32)
	expect(trigger.focus).toHaveBeenCalledOnce()
	const cancel = restoreNativeFocus({}, () => [trigger], () => true)
	cancel()
	await vi.advanceTimersByTimeAsync(1)
	expect(trigger.focus).toHaveBeenCalledOnce()
})
