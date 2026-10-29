// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { backend } from '../src/backend.web'
import { printOptions } from '../src/options'
function loadFrame() {
	const frame = document.querySelector('iframe')!
	const content = frame.contentDocument!
	content.open()
	content.write(frame.srcdoc)
	content.close()
	const view = frame.contentWindow!
	vi.spyOn(view, 'focus').mockImplementation(() => {})
	const print = vi.spyOn(view, 'print').mockImplementation(() => {})
	frame.dispatchEvent(new Event('load'))
	return { frame, view, print, content }
}
afterEach(() => {
	vi.useRealTimers()
	vi.restoreAllMocks()
	document.body.replaceChildren()
})
it('dispatches current-page printing and rejects file creation without an extra dialog', async () => {
	const print = vi.spyOn(window, 'print').mockImplementation(() => {})
	await backend.print(printOptions({}))
	expect(print).toHaveBeenCalledTimes(1)
	await expect(backend.file({} as never)).rejects.toThrow()
	await expect(backend.select()).rejects.toThrow()
	expect(print).toHaveBeenCalledTimes(1)
	expect(backend.capabilities().printToFile).toBe(false)
})
it('owns an isolated static HTML document through print-dialog dismissal', async () => {
	const pending = backend.print(
		printOptions({ html: '<html><body><h1>Receipt</h1></body></html>', width: 360, height: 540 }),
	)
	const { frame, view, print, content } = loadFrame()
	await Promise.resolve()
	await Promise.resolve()
	expect(print).toHaveBeenCalledTimes(1)
	expect(content.body.textContent).toContain('Receipt')
	expect(content.head.querySelector('style')?.textContent).toContain('360pt 540pt')
	expect(frame.getAttribute('sandbox')).not.toContain('allow-scripts')
	expect(document.body.contains(frame)).toBe(true)
	view.dispatchEvent(new view.Event('afterprint'))
	await pending
	expect(document.body.contains(frame)).toBe(false)
})
it('cleans a stalled iframe when the browser does not report dismissal', async () => {
	vi.useFakeTimers()
	const pending = backend.print(printOptions({ html: 'Receipt' }))
	const expected = expect(pending).rejects.toMatchObject({ code: 'ERR_PRINT_TIMEOUT' })
	loadFrame()
	await vi.advanceTimersByTimeAsync(120000)
	await expected
	expect(document.querySelector('iframe')).toBeNull()
})
it('rejects unsupported PDF URI printing before creating a document', async () => {
	await expect(
		backend.print(printOptions({ uri: 'https://example.com/input.pdf' })),
	).rejects.toThrow()
	expect(document.querySelector('iframe')).toBeNull()
})
