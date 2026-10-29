/** @jsxImportSource @octane-xplat/jsx */
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
	flushUniversalAct(() => root.render(Probe, { options }))
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

	it('keeps late write outcomes but suppresses retired feedback and held triggers', async () => {
		for (const outcome of [true, false]) {
			const getItems = vi.fn(() => 'hello'), onCopy = vi.fn()
			let finish!: (success: boolean) => void
			vi.mocked(copyText).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
			const root = renderClipboard({ getItems, onCopy, announce: 'Copied' })
			const held = captured, pending = held.copy()
			flushUniversalAct(() => root.unmount())
			finish(outcome)
			expect(await pending).toBe(outcome)
			expect(await held.copy()).toBe(false)
			expect(await held.clipboardProps.onPress()).toBe(false)
			expect(getItems).toHaveBeenCalledTimes(1)
			expect(onCopy).not.toHaveBeenCalled()
			expect(announce).not.toHaveBeenCalled()
			expect(vi.getTimerCount()).toBe(0)
		}
		expect(copyText).toHaveBeenCalledTimes(2)
	})

	it('rechecks ownership after the text producer unmounts its reader', async () => {
		const onCopy = vi.fn()
		const root = renderClipboard({ getItems: () => {
			flushUniversalAct(() => root.unmount())
			return 'hello'
		}, onCopy })
		expect(await captured.copy()).toBe(false)
		expect(copyText).not.toHaveBeenCalled()
		expect(onCopy).not.toHaveBeenCalled()
	})

	it('contains a synchronous platform throw as a failed attempt', async () => {
		vi.mocked(copyText).mockImplementationOnce(() => { throw new Error('unavailable') })
		const onCopy = vi.fn(), root = renderClipboard({ onCopy })
		expect(await captured.copy('hello')).toBe(false)
		expect(onCopy).toHaveBeenCalledWith(false)
		expect(vi.getTimerCount()).toBe(0)
		root.unmount()
	})

	it('a cleared but held reset callback cannot shorten a newer success', async () => {
		const root = renderClipboard({ getItems: () => 'hello', resetAfterMs: 100 })
		const schedule = vi.spyOn(globalThis, 'setTimeout')
		try {
			await captured.copy()
			const stale = schedule.mock.calls.at(-1)![0] as () => void
			await captured.copy()
			stale()
			flush()
			expect(captured.isCopied).toBe(true)
			vi.advanceTimersByTime(100)
			flush()
			expect(captured.isCopied).toBe(false)
			flushUniversalAct(() => root.unmount())
			stale()
			expect(vi.getTimerCount()).toBe(0)
		} finally { schedule.mockRestore(); root.unmount() }
	})

	it('an unavailable announcement cannot reject a successful write or skip its reset', async () => {
		vi.mocked(announce).mockImplementationOnce(() => { throw new Error('unavailable') })
		const onCopy = vi.fn(), root = renderClipboard({ onCopy, announce: 'Copied', resetAfterMs: 100 })
		expect(await captured.copy('hello')).toBe(true)
		expect(onCopy).toHaveBeenCalledWith(true)
		flush()
		expect(captured.isCopied).toBe(true)
		vi.advanceTimersByTime(100)
		flush()
		expect(captured.isCopied).toBe(false)
		root.unmount()
	})

	it('announcement reentry may retire the owner without leaving a timer or notifying onCopy', async () => {
		const onCopy = vi.fn(), root = renderClipboard({ onCopy, announce: 'Copied' })
		vi.mocked(announce).mockImplementationOnce(() => { flushUniversalAct(() => root.unmount()) })
		expect(await captured.copy('hello')).toBe(true)
		expect(onCopy).not.toHaveBeenCalled()
		expect(vi.getTimerCount()).toBe(0)
	})


	it('keeps overlapping attempts independent and failed completion preserves successful feedback', async () => {
		const finishes: Array<(success: boolean) => void> = []
		vi.mocked(copyText).mockImplementation(() => new Promise(resolve => { finishes.push(resolve) }))
		const onCopy = vi.fn(), root = renderClipboard({ onCopy })
		const first = captured.copy('first'), second = captured.copy('second')
		expect(copyText).toHaveBeenCalledTimes(2)
		finishes[1]!(true)
		expect(await second).toBe(true)
		finishes[0]!(false)
		expect(await first).toBe(false)
		flush()
		expect(captured.isCopied).toBe(true)
		expect(onCopy.mock.calls).toEqual([[true], [false]])
		root.unmount()
	})

})
