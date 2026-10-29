import { afterEach, expect, it, vi } from 'vitest'
import { useKeyboard } from './use-keyboard.macos'

afterEach(() => vi.unstubAllGlobals())

it('returns an empty attachment when the AppKit key bridge is unavailable', () => {
	vi.stubGlobal('__xplatAppKit', {})
	expect(useKeyboard({ onKeyDown: () => {} })).toEqual({ isSupported: false, keyboardProps: {} })
})

it('exposes portable fields and live prevention without leaking native targets', () => {
	vi.stubGlobal('__xplatAppKit', { keyboardEventsSupported: true })
	let prevented = false
	let stopped = false
	let received: any
	const raw: any = {
		key: 'k', code: 'KeyK', altKey: false, ctrlKey: false, metaKey: true, shiftKey: false,
		repeat: false, isComposing: false, object: {}, target: {}, currentTarget: {}, native: {},
		get defaultPrevented() { return prevented },
		preventDefault: () => { prevented = true }, stopPropagation: () => { stopped = true },
	}
	const { isSupported, keyboardProps } = useKeyboard({ onKeyDown: (event) => {
		received = event
		event.preventDefault()
		event.stopPropagation()
	} })
	expect(isSupported).toBe(true)
	keyboardProps.onKeyDown?.(raw)
	expect(received).toMatchObject({ key: 'k', code: 'KeyK', metaKey: true })
	expect(received.defaultPrevented).toBe(true)
	expect(stopped).toBe(true)
	for (const field of ['object', 'target', 'currentTarget', 'native']) expect(field in received).toBe(false)
})

it('does not attach absent callbacks and forwards key-up independently', () => {
	vi.stubGlobal('__xplatAppKit', { keyboardEventsSupported: true })
	const up = vi.fn()
	const { keyboardProps } = useKeyboard({ onKeyUp: up })
	expect(keyboardProps.onKeyDown).toBeUndefined()
	keyboardProps.onKeyUp?.({ key: 'a', code: 'KeyA', altKey: false, ctrlKey: false, metaKey: false,
		shiftKey: false, repeat: false, isComposing: false, defaultPrevented: false, preventDefault() {}, stopPropagation() {} })
	expect(up).toHaveBeenCalledOnce()
})
