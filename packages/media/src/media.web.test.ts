// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { media } from './media.web'

afterEach(() => {
	vi.useRealTimers()
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

function nextFileInput(): HTMLInputElement[] {
	const inputs: HTMLInputElement[] = []
	const original = document.createElement.bind(document)
	vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: any) => {
		const el = original(tag, options)
		if (tag === 'input') {
			inputs.push(el as HTMLInputElement)
		}

		return el
	})

	return inputs
}

describe('media (web)', () => {
	it('ensure reports the file-input capability, not a camera prompt state', async () => {
		await expect(media.ensure('camera')).resolves.toBe('granted')
		await expect(media.ensure('photos')).resolves.toBe('granted')
	})

	it('a dismissed picker settles empty through the focus fallback', async () => {
		vi.useFakeTimers()
		const pending = media.pickImage()
		window.dispatchEvent(new Event('focus'))
		await vi.advanceTimersByTimeAsync(400)
		await expect(pending).resolves.toBeNull()
	})

	it('capture read failures resolve null like the native leaves', async () => {
		const inputs = nextFileInput()
		vi.stubGlobal(
			'FileReader',
			class {
				onload: ((this: any, ev: any) => void) | null = null
				onerror: ((this: any, ev: any) => void) | null = null
				readAsDataURL() {
					this.onerror?.call(this, new Error('read failed'))
				}
			},
		)

		const pending = media.capturePhoto()
		const input = inputs[0]!
		Object.defineProperty(input, 'files', {
			configurable: true,
			value: [{ name: 'shot.jpg' }],
		})

		input.onchange?.({} as Event)
		await expect(pending).resolves.toBeNull()
	})
})
