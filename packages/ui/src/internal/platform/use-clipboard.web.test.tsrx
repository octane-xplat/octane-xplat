/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'

vi.mock('./clipboard-write', () => ({ copyText: vi.fn() }))
vi.mock('@octane-xplat/platform', () => ({ announce: vi.fn() }))

import { announce } from '@octane-xplat/platform'
import { copyText } from './clipboard-write'
import { useClipboard } from './use-clipboard'
import type { UseClipboardOptions, UseClipboardResult } from './use-clipboard'

// DOM-renderer lane — same contract as the universal-renderer suite:
// transient isCopied with reset/restart/unmount cleanup, per-attempt boolean
// outcomes, and the optional polite announcement.

let captured: UseClipboardResult

function Reader(props: { options?: UseClipboardOptions }) @{
	captured = useClipboard(props.options)

	<button>{captured.isCopied ? 'copied' : 'idle'}</button>
}

const mount = (options?: UseClipboardOptions) => {
	const el = document.createElement('div')
	document.body.appendChild(el)
	const root = createRoot(el)
	act(() => root.render(<Reader options={options} />))
	return { el, root }
}

describe('useClipboard (DOM renderer)', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.mocked(copyText).mockReset().mockResolvedValue(true)
		vi.mocked(announce).mockReset()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('copies text, announces, flags isCopied, and resets after resetAfterMs', async () => {
		const onCopy = vi.fn()
		const { el, root } = mount({
			getItems: () => 'hello',
			onCopy,
			announce: 'Copied',
			resetAfterMs: 100,
		})

		expect(captured.isCopied).toBe(false)
		await act(async () => {
			expect(await captured.copy('direct text')).toBe(true)
		})

		expect(copyText).toHaveBeenCalledWith('direct text')
		expect(onCopy).toHaveBeenCalledWith(true)
		expect(announce).toHaveBeenCalledWith('Copied')
		expect(captured.isCopied).toBe(true)
		expect(el.textContent).toBe('copied')

		act(() => vi.advanceTimersByTime(100))
		expect(captured.isCopied).toBe(false)
		expect(el.textContent).toBe('idle')

		root.unmount()
		el.remove()
	})

	it('resolves false on failure and leaves isCopied unchanged', async () => {
		const onCopy = vi.fn()
		const { root, el } = mount({ getItems: () => 'hello', onCopy })

		vi.mocked(copyText).mockResolvedValueOnce(false)
		await act(async () => {
			expect(await captured.clipboardProps.onPress()).toBe(false)
		})

		expect(onCopy).toHaveBeenCalledWith(false)
		expect(captured.isCopied).toBe(false)

		await act(async () => {
			expect(await captured.copy()).toBe(true)
		})

		expect(captured.isCopied).toBe(true)

		root.unmount()
		el.remove()
	})

	it('clears the pending reset timer on unmount', async () => {
		const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
		const { root, el } = mount({ getItems: () => 'hello' })

		await act(async () => {
			await captured.copy()
		})

		expect(captured.isCopied).toBe(true)

		act(() => root.unmount())
		expect(clearSpy).toHaveBeenCalled()
		vi.advanceTimersByTime(10000)
		clearSpy.mockRestore()
		el.remove()
	})

	it('suppresses late feedback and held triggers after unmount without cancelling the started write', async () => {
		let finish!: (success: boolean) => void
		vi.mocked(copyText).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
		const getItems = vi.fn(() => 'hello'), onCopy = vi.fn()
		const { root, el } = mount({ getItems, onCopy, announce: 'Copied' })
		const held = captured, pending = held.copy()
		act(() => root.unmount())
		finish(true)
		expect(await pending).toBe(true)
		expect(await held.copy()).toBe(false)
		expect(await held.clipboardProps.onPress()).toBe(false)
		expect(getItems).toHaveBeenCalledTimes(1)
		expect(copyText).toHaveBeenCalledTimes(1)
		expect(onCopy).not.toHaveBeenCalled()
		expect(announce).not.toHaveBeenCalled()
		expect(vi.getTimerCount()).toBe(0)
		el.remove()
	})

	it('does not write after a text producer unmounts its reader', async () => {
		const onCopy = vi.fn()
		const { root, el } = mount({ getItems: () => {
			act(() => root.unmount())
			return 'hello'
		}, onCopy })
		expect(await captured.copy()).toBe(false)
		expect(copyText).not.toHaveBeenCalled()
		expect(onCopy).not.toHaveBeenCalled()
		el.remove()
	})

	it('a failed announcement leaves the copy result, callback and reset intact', async () => {
		vi.mocked(announce).mockImplementationOnce(() => { throw new Error('unavailable') })
		const onCopy = vi.fn(), { root, el } = mount({ onCopy, announce: 'Copied', resetAfterMs: 100 })
		await act(async () => { expect(await captured.copy('hello')).toBe(true) })
		expect(onCopy).toHaveBeenCalledWith(true)
		expect(el.textContent).toBe('copied')
		act(() => vi.advanceTimersByTime(100))
		expect(el.textContent).toBe('idle')
		root.unmount()
		el.remove()
	})

})
