import { expect, it, vi } from 'vitest'
vi.mock('@nativescript/core', () => ({ Application: { ios: {}, android: {} } }))
import { captureLayerFocus as captureIOS } from './layer-keys.ios'
import { captureLayerFocus as captureAndroid } from './layer-keys.android'

it('restores the captured UIKit responder in its declaring window and rejects detachment', () => {
	const responder: any = { isFirstResponder: true, becomeFirstResponder: vi.fn() }
	const owner: any = { isKeyWindow: true, subviews: [responder] }
	responder.window = owner
	const restore = captureIOS(undefined, { nativeViewProtected: { window: owner } })
	responder.isFirstResponder = false
	restore()
	expect(responder.becomeFirstResponder).toHaveBeenCalledTimes(1)
	responder.window = null
	restore()
	expect(responder.becomeFirstResponder).toHaveBeenCalledTimes(1)
})

it('restores only an attached Android input in its original active decor', () => {
	const requestFocus = vi.fn()
	let attached = true,
		active = true
	const owner = { hasWindowFocus: () => active, findFocus: () => input }
	const input = { getRootView: () => owner, isAttachedToWindow: () => attached, requestFocus }
	const restore = captureAndroid(undefined, { nativeViewProtected: { getRootView: () => owner } })
	restore()
	expect(requestFocus).toHaveBeenCalledTimes(1)
	attached = false
	restore()
	active = false
	attached = true
	restore()
	expect(requestFocus).toHaveBeenCalledTimes(1)
})

it('reads the latest explicit target and skips removed NativeScript controls', () => {
	const focus = vi.fn()
	let target: any = { focus, isLoaded: false }
	const restore = captureIOS(() => target)
	restore()
	expect(focus).not.toHaveBeenCalled()
	target = { focus, isLoaded: true }
	restore()
	expect(focus).toHaveBeenCalledTimes(1)
})

it('has neutral cleanup when no native owner or input exists', () => {
	expect(() => captureIOS()()).not.toThrow()
	expect(() => captureAndroid()()).not.toThrow()
})
