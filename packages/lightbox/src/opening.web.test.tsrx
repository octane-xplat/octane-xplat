/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot } from 'octane'
import { expect, it, vi } from 'vitest'
import { Root, Popup, Viewport } from './root.web.tsrx'
vi.mock('@octane-xplat/ui', () => import('../test/content-ui.web.tsrx'))
it('cancels the unmeasured image opening frame when unmounted', async () => {
	vi.useFakeTimers()
	const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame')
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	try {
		await act(async () => root.render(<Root media={[{ src: 'photo.jpg', alt: 'Photo', width: 800, height: 600 }]} defaultOpen><Popup><Viewport /></Popup></Root>))
		act(() => root.unmount())
		expect(cancel).toHaveBeenCalled()
		await vi.advanceTimersByTimeAsync(100)
	} finally { cancel.mockRestore(); host.remove(); vi.useRealTimers() }
})
