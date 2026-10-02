/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
// Exercise the AppKit/default leaf with the object driver and a host bridge.
import { useLayer } from './use-layer.tsrx'

let layer: any
function Probe(props: { body: string; label: string }) {
	layer = useLayer({ mode: 'context' })
	return <stacklayout ref={layer.ref}>{layer.render(props.body, { accessibilityLabel: props.label })}</stacklayout>
}

describe('useLayer AppKit host content', () => {
	it('updates an open popup without reopening and closes it on unmount', async () => {
		const popup = { update: vi.fn(), close: vi.fn() }
		const showAnchoredPopup = vi.fn((_options: any) => popup)
		vi.stubGlobal('__xplatAppKit', { showAnchoredPopup })
		const root = createUniversalRoot(createObjectContainer('nativescript'), createObjectDriver('nativescript'))
		try {
			root.render(Probe as any, { body: 'first', label: 'First' })
			flushUniversalSync(() => {})
			layer.show()
			await vi.waitFor(() => expect(layer.isOpen).toBe(true))
			expect(showAnchoredPopup.mock.calls[0][0].props.body).toBe('first')
			root.render(Probe as any, { body: 'second', layerDepth: 1, label: 'Second' })
			flushUniversalSync(() => {})
			await vi.waitFor(() => expect(popup.update).toHaveBeenLastCalledWith({ body: 'second', layerDepth: 1, label: 'Second', className: undefined, style: undefined }))
			expect(showAnchoredPopup).toHaveBeenCalledTimes(1)
		} finally {
			root.unmount()
			flushUniversalSync(() => {})
			vi.unstubAllGlobals()
		}

		await vi.waitFor(() => expect(popup.close).toHaveBeenCalledTimes(1))
	})
})
