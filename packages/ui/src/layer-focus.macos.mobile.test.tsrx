import { expect, it, vi } from 'vitest'
import { captureAppKitLayerFocus } from './layer-focus.macos'

function window() { return { firstResponder: null as any, makeFirstResponder: vi.fn() } }

it('explicit layer return follows the current target window without activating it', () => {
	const main = window(), popup = window(), target: any = { window: main }
	let current: any = { window: popup }
	const restore = captureAppKitLayerFocus(() => current, { window: popup })
	current = target; restore()
	expect(main.makeFirstResponder).toHaveBeenCalledWith(target)
	expect(popup.makeFirstResponder).not.toHaveBeenCalled()
	target.window = null; restore(); expect(main.makeFirstResponder).toHaveBeenCalledTimes(1)
})

it('fallback captures the owning field instead of a shared editor and ignores moved fallback views', () => {
	const main = window(), other = window(), field: any = { window: main }
	const editor = { window: main, delegate: field }; field.currentEditor = () => editor; main.firstResponder = editor
	const restore = captureAppKitLayerFocus(undefined, undefined, () => ({ NSApplication: { sharedApplication: { keyWindow: main } } }))
	main.firstResponder = null; restore()
	expect(main.makeFirstResponder).toHaveBeenCalledWith(field)
	field.window = other; restore()
	expect(other.makeFirstResponder).not.toHaveBeenCalled()
	expect(main.makeFirstResponder).toHaveBeenCalledTimes(1)
})

it('hidden/disabled targets are rejected while explicitly focusable disabled cards and live handles remain valid', () => {
	const main = window(), target: any = { window: main }
	const restore = captureAppKitLayerFocus(() => ({ native: target }))
	for (const patch of [{ hidden: true }, { hiddenOrHasHiddenAncestor: () => true }, { enabled: false }, { isEnabled: () => false }, { accessibilityIsEnabled: () => false }]) {
		Object.assign(target, patch); restore()
		for (const key of Object.keys(patch)) delete target[key]
	}
	expect(main.makeFirstResponder).not.toHaveBeenCalled()
	target.accessibilityIsEnabled = () => false; target.canBecomeKeyView = () => true; restore()
	expect(main.makeFirstResponder).toHaveBeenCalledWith(target)
	delete target.canBecomeKeyView; delete target.accessibilityIsEnabled; restore()
	expect(main.makeFirstResponder).toHaveBeenCalledTimes(2)
})


it('explicit opaque focus delegates remain caller-owned while detached native-backed handles stay guarded', () => {
	const focus = vi.fn(), delegate = { focus }
	captureAppKitLayerFocus(() => delegate)(); expect(focus).toHaveBeenCalledOnce()
	captureAppKitLayerFocus(() => ({ focus, native: null }))()
	expect(focus).toHaveBeenCalledOnce()
})
