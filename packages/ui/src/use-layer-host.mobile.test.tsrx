/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
// Exercise the AppKit/default leaf with the object driver and a host bridge.
import { useLayer } from './use-layer.tsrx'

let layer: any
function Probe(props: { body: string; label: string; surface?: any; onShow?: () => void; onHide?: () => void }) {
	layer = useLayer({ mode: 'context', onShow: props.onShow, onHide: props.onHide })
	return <stacklayout ref={layer.ref}>{layer.render(props.body, { accessibilityLabel: props.label, ...props.surface })}</stacklayout>
}

describe('useLayer AppKit host content', () => {
	it('updates an open popup without reopening and closes it on unmount', async () => {
		const popup = { update: vi.fn(), close: vi.fn() }
		const showLayer = vi.fn((_options: any) => popup)
		vi.stubGlobal('__xplatAppKit', { showLayer })
		const root = createUniversalRoot(createObjectContainer('nativescript'), createObjectDriver('nativescript'))
		try {
			root.render(Probe as any, { body: 'first', label: 'First' })
			flushUniversalSync(() => {})
			layer.show()
			await vi.waitFor(() => expect(layer.isOpen).toBe(true))
			expect(showLayer.mock.calls[0][0].props.body).toBe('first')
			root.render(Probe as any, { body: 'second', layerDepth: 1, label: 'Second' })
			flushUniversalSync(() => {})
			await vi.waitFor(() => expect(popup.update.mock.calls.at(-1)?.[0]).toEqual({ body: 'second', layerDepth: 1, label: 'Second', className: undefined, style: undefined }))
			expect(showLayer).toHaveBeenCalledTimes(1)
		} finally {
			root.unmount()
			flushUniversalSync(() => {})
			vi.unstubAllGlobals()
		}

		await vi.waitFor(() => expect(popup.close).toHaveBeenCalledTimes(1))
	})
})


describe('AppKit layer geometry contract', () => {
	it('forwards alignment, gap, custom coordinates and live positioning without reopening', async () => {
		const popup = { update: vi.fn(), close: vi.fn() }, showLayer = vi.fn((_options: any) => popup)
		vi.stubGlobal('__xplatAppKit', { showLayer })
		const root = createUniversalRoot(createObjectContainer('nativescript'), createObjectDriver('nativescript'))
		const anchor = { left: 100, top: 100, width: 200, height: 40 }, panel = { width: 80, height: 50 }, viewport = { left: 0, top: 0, width: 800, height: 600 }
		try {
			root.render(Probe as any, { body: 'Body', label: 'Layer', surface: { placement: 'below', alignment: 'end', offset: 12 } })
			flushUniversalSync(() => {})
			layer.show()
			await vi.waitFor(() => expect(showLayer).toHaveBeenCalledTimes(1))
			expect((showLayer.mock.calls[0] as any)[0].position(anchor, panel, viewport)).toEqual({ left: 220, top: 152, placement: 'bottom' })
			root.render(Probe as any, { body: 'Body', label: 'Layer', surface: { positioning: 'custom', style: { left: 25, top: 30 }, offset: 'unsupported' } })
			flushUniversalSync(() => {})
			await vi.waitFor(() => expect(popup.update).toHaveBeenCalled())
			expect(popup.update.mock.calls.at(-1)?.[1].position(anchor, panel, viewport)).toEqual({ left: 25, top: 30 })
			expect(showLayer).toHaveBeenCalledTimes(1)
		} finally { root.unmount(); flushUniversalSync(() => {}); vi.unstubAllGlobals() }
	})
})


describe('AppKit imperative layer lifecycle', () => {
	it('reports one active cycle even when show/hide repeat before effects flush', async () => {
		const close = vi.fn(), onShow = vi.fn(), onHide = vi.fn(), showLayer = vi.fn(() => ({ close, update: vi.fn() }))
		vi.stubGlobal('__xplatAppKit', { showLayer })
		const root = createUniversalRoot(createObjectContainer('nativescript'), createObjectDriver('nativescript'))
		try {
			root.render(Probe as any, { body: 'Body', label: 'Layer', onShow, onHide }); flushUniversalSync(() => {})
			layer.show(); layer.show()
			await vi.waitFor(() => expect(layer.isOpen).toBe(true))
			expect(showLayer).toHaveBeenCalledTimes(1)
			expect(onShow).toHaveBeenCalledTimes(1)
			layer.hide(); layer.hide()
			await vi.waitFor(() => expect(layer.isOpen).toBe(false))
			expect(onHide).toHaveBeenCalledTimes(1)
			expect(close).toHaveBeenCalledTimes(1)
		} finally { root.unmount(); flushUniversalSync(() => {}); vi.unstubAllGlobals() }
	})

	it('does not report an open layer when the host cannot present', () => {
		const onShow = vi.fn()
		vi.stubGlobal('__xplatAppKit', { showLayer: () => null })
		const root = createUniversalRoot(createObjectContainer('nativescript'), createObjectDriver('nativescript'))
		try {
			root.render(Probe as any, { body: 'Body', label: 'Layer', onShow }); flushUniversalSync(() => {})
			layer.show(); flushUniversalSync(() => {})
			expect(layer.isOpen).toBe(false)
			expect(onShow).not.toHaveBeenCalled()
		} finally { root.unmount(); flushUniversalSync(() => {}); vi.unstubAllGlobals() }
	})
})
