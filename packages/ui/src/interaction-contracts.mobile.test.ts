import { describe, expect, it, vi } from 'vitest'
import { useKeyboard } from './use-keyboard'
import { useKeyboard as useWebKeyboard } from './use-keyboard.web'

describe('normalized keyboard attachment', () => {
	it('reports missing native attachment without advertising handlers', () => {
		expect(useKeyboard({ onKeyDown: vi.fn() })).toEqual({ isSupported: false, keyboardProps: {} })
	})

	it('copies the key domain and forwards prevention to the original event', () => {
		const onKeyDown = vi.fn()
		const event = {
			key: 'Enter',
			code: 'Enter',
			altKey: false,
			ctrlKey: true,
			metaKey: false,
			shiftKey: true,
			repeat: true,
			isComposing: false,
			keyCode: 229,
			defaultPrevented: false,
			preventDefault() {
				this.defaultPrevented = true
			},
			stopPropagation: vi.fn(),
		}

		const result = useWebKeyboard({ onKeyDown })
		expect(result.isSupported).toBe(true)
		result.keyboardProps.onKeyDown?.(event)
		const normalized = onKeyDown.mock.calls[0][0]
		expect(normalized).not.toBe(event)
		expect(normalized).toMatchObject({
			key: 'Enter',
			code: 'Enter',
			ctrlKey: true,
			repeat: true,
			isComposing: true,
		})

		normalized.preventDefault()
		expect(normalized.defaultPrevented).toBe(true)
		normalized.stopPropagation()
		expect(event.stopPropagation).toHaveBeenCalledOnce()
		expect(useWebKeyboard().keyboardProps.onKeyDown).toBeUndefined()
	})
})
