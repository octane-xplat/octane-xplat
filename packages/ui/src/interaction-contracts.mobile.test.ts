import { describe, expect, it, vi } from 'vitest'
import { useKeyboard } from './use-keyboard'
import { useKeyboard as useWebKeyboard } from './use-keyboard.web'
import { useClipboard } from './use-clipboard'
import { copyText } from './clipboard-write'

vi.mock('./clipboard-write', () => ({ copyText: vi.fn() }))

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

describe('observable clipboard attempts', () => {
	it('returns and reports success and write failure on each activation', async () => {
		vi.mocked(copyText).mockResolvedValueOnce(true).mockResolvedValueOnce(false)
		const onCopy = vi.fn(),
			getItems = vi.fn(() => 'hello')

		const result = useClipboard({ getItems, onCopy })
		expect(await result.clipboardProps.onPress()).toBe(true)
		expect(await result.copy()).toBe(false)
		expect(getItems).toHaveBeenCalledTimes(2)
		expect(onCopy.mock.calls).toEqual([[true], [false]])
	})

	it('reports producer failure and rejected writes without losing the outcome', async () => {
		const onCopy = vi.fn()
		expect(
			await useClipboard({
				getItems: () => {
					throw new Error('producer')
				},
				onCopy,
			}).copy(),
		).toBe(false)

		vi.mocked(copyText).mockRejectedValueOnce(new Error('denied'))
		expect(await useClipboard({ getItems: () => 'hello', onCopy }).copy()).toBe(false)
		expect(onCopy.mock.calls).toEqual([[false], [false]])
	})
})
