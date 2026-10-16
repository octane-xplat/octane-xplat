/** @jsxImportSource @nativescript-community/octane */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalAct,
	flushUniversalSync,
} from 'octane/universal/native'

vi.mock('./clipboard-write', () => ({ copyText: vi.fn() }))
vi.mock('@octane-xplat/platform', () => ({ announce: vi.fn() }))

import { announce } from '@octane-xplat/platform'
import { copyText } from './clipboard-write'
import { useClipboard } from './use-clipboard'
import type { UseClipboardOptions, UseClipboardResult } from './use-clipboard'

// Universal-renderer lane — the hook owns a transient `isCopied` flag with a
// reset timer, an optional polite announcement, and per-attempt boolean
// outcomes. These tests pin that contract: success/failure result,
// caller-supplied text vs getItems, reset after resetAfterMs, rapid re-copy
// restarting the timer, unmount cleanup, and announcement dispatch.

let captured: UseClipboardResult

const Probe = (props: { options?: UseClipboardOptions }) => @{
	captured = useClipboard(props.options)

	<label text={captured.isCopied ? 'copied' : 'idle'} />
}

const renderClipboard = (options?: UseClipboardOptions) => {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	flushUniversalAct(() => root.render(Probe as any, { options }))
	return root
}

const flush = () => flushUniversalSync(() => {})

describe('useClipboard (universal renderer)', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.mocked(copyText).mockReset().mockResolvedValue(true)
		vi.mocked(announce).mockReset()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('copies caller-supplied text, reports success, announces, and resets isCopied after resetAfterMs', async () => {
		const onCopy = vi.fn()
		const getItems = vi.fn(() => 'from-producer')
		const root = renderClipboard({ getItems, onCopy, announce: 'Copied', resetAfterMs: 100 })

		expect(captured.isCopied).toBe(false)
		expect(await captured.copy('direct text')).toBe(true)
		expect(copyText).toHaveBeenCalledWith('direct text')
		expect(getItems).not.toHaveBeenCalled()
		expect(announce).toHaveBeenCalledWith('Copied')

		flush()
		expect(captured.isCopied).toBe(true)
		expect(onCopy.mock.calls).toEqual([[true]])

		vi.advanceTimersByTime(99)
		flush()
		expect(captured.isCopied).toBe(true)
		vi.advanceTimersByTime(1)
		flush()
		expect(captured.isCopied).toBe(false)
		root.unmount()
	})

	it('falls back to getItems and reports failure outcomes', async () => {
		vi.mocked(copyText).mockResolvedValueOnce(true).mockResolvedValueOnce(false)
		const onCopy = vi.fn()
		const getItems = vi.fn(() => 'hello')
		const root = renderClipboard({ getItems, onCopy })

		expect(await captured.clipboardProps.onPress()).toBe(true)
		expect(await captured.copy()).toBe(false)
		expect(getItems).toHaveBeenCalledTimes(2)
		expect(copyText).toHaveBeenNthCalledWith(2, 'hello')
		expect(onCopy.mock.calls).toEqual([[true], [false]])

		// A rejected write resolves false without touching copied state.
		vi.mocked(copyText).mockRejectedValueOnce(new Error('denied'))
		expect(await captured.copy()).toBe(false)
		expect(onCopy.mock.calls).toEqual([[true], [false], [false]])
		root.unmount()
	})

	it('resolves false for a throwing producer or missing text without writing', async () => {
		const onCopy = vi.fn()
		const root = renderClipboard({
			getItems: () => {
				throw new Error('producer')
			},
			onCopy,
		})

		expect(await captured.copy()).toBe(false)
		root.unmount()

		const bare = renderClipboard()
		expect(await captured.copy()).toBe(false)
		expect(copyText).not.toHaveBeenCalled()
		expect(onCopy.mock.calls).toEqual([[false]])
		flush()
		expect(captured.isCopied).toBe(false)
		bare.unmount()
	})

	it('restarts the reset timer on rapid re-copy and leaves isCopied unchanged on failure', async () => {
		const root = renderClipboard({ getItems: () => 'hello' })

		await captured.copy()
		flush()
		expect(captured.isCopied).toBe(true)

		vi.advanceTimersByTime(1500)
		vi.mocked(copyText).mockResolvedValueOnce(false)
		expect(await captured.copy()).toBe(false)
		vi.advanceTimersByTime(600)
		flush()
		// The failed attempt did not restart the timer — the original 2s elapsed.
		expect(captured.isCopied).toBe(false)

		await captured.copy()
		flush()
		expect(captured.isCopied).toBe(true)
		vi.advanceTimersByTime(1500)
		await captured.copy()
		flush()
		vi.advanceTimersByTime(1500)
		flush()
		expect(captured.isCopied).toBe(true)
		vi.advanceTimersByTime(500)
		flush()
		expect(captured.isCopied).toBe(false)
		root.unmount()
	})

	it('clears the pending reset timer on unmount', async () => {
		const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
		const root = renderClipboard({ getItems: () => 'hello' })

		await captured.copy()
		flush()
		expect(captured.isCopied).toBe(true)

		flushUniversalAct(() => root.unmount())
		expect(clearSpy).toHaveBeenCalled()
		// The queued reset must not fire after unmount.
		vi.advanceTimersByTime(10000)
		clearSpy.mockRestore()
	})

	it('onPress does not forward host activation events as copy text', async () => {
		const root = renderClipboard({ getItems: () => 'hello' })
		await (captured.clipboardProps.onPress as any)({ type: 'click' })
		expect(copyText).toHaveBeenCalledWith('hello')
		root.unmount()
	})
})
