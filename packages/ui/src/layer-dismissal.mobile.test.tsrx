/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { dispatchLayerKey } from './layer-stack'
vi.mock('./theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }))
import { Popover } from './Popover.macos.tsrx'
import { useHoverCard } from './use-hover-card.tsrx'

function CardProbe(props: { open: boolean; hide: () => void }) @{
	const card = useHoverCard({ get isOpen() { return props.open }, onHide: () => props.hide() })

	<flexboxlayout ref={card.ref}>{card.renderHoverCard('Card')}</flexboxlayout>
}

function Entry(props: { active: boolean; dismiss: () => void; children?: any; block?: boolean; focusTarget?: any }) @{
	const layer = useLayerDismissal({ get active() { return props.active }, dismiss: () => props.dismiss(), get behavior() { return props.block ? 'block' : 'close' }, getFocusTarget: () => props.focusTarget })

	<LayerDepthProvider value={layer.depth}>{props.children}</LayerDepthProvider>
}

function AtDepth(props: { depth: number; dismiss: () => void }) @{
	<LayerDepthProvider value={props.depth}><Entry active dismiss={props.dismiss} /></LayerDepthProvider>
}

function freshRoot() {
	return createUniversalRoot(createObjectContainer('nativescript'), createObjectDriver('nativescript'))
}

function escape(composing = false) {
	const preventDefault = vi.fn()
	dispatchLayerKey({ key: 'Escape', isComposing: composing, preventDefault })
	flushUniversalSync(() => {})
	return preventDefault
}

describe('portable cross-root layer ownership', () => {
	it('preserves nesting across roots regardless of registration order and controlled requests', async () => {
		const outer = freshRoot(), inner = freshRoot()
		const closeOuter = vi.fn(), closeInner = vi.fn(), updated = vi.fn()
		try {
			inner.render(AtDepth as any, { depth: 1, dismiss: closeInner })
			outer.render(Entry as any, { active: true, dismiss: closeOuter })
			flushUniversalSync(() => {})
			await vi.waitFor(() => { escape(); expect(closeInner).toHaveBeenCalled() })
			expect(closeOuter).not.toHaveBeenCalled()
			inner.render(AtDepth as any, { depth: 1, dismiss: updated })
			flushUniversalSync(() => {})
			await vi.waitFor(() => { escape(); expect(updated).toHaveBeenCalled() })
			expect(closeOuter).not.toHaveBeenCalled()
			inner.unmount()
			flushUniversalSync(() => {})
			await vi.waitFor(() => { escape(); expect(closeOuter).toHaveBeenCalledTimes(1) })
		} finally {
			inner.unmount(); outer.unmount(); flushUniversalSync(() => {})
			await vi.waitFor(() => expect(escape()).not.toHaveBeenCalled())
		}

		expect(escape()).not.toHaveBeenCalled()
	})

	it('uses one AppKit monitor, blocks marked text and removes the monitor at cleanup', async () => {
		let handler: any
		const token = {}
		const removeMonitor = vi.fn()
		vi.stubGlobal('NSEvent', { addLocalMonitorForEventsMatchingMaskHandler: vi.fn((_mask, callback) => { handler = callback; return token }), removeMonitor })
		const outer = freshRoot(), inner = freshRoot(), dismiss = vi.fn()
		try {
			outer.render(Entry as any, { active: true, dismiss })
			inner.render(AtDepth as any, { depth: 1, dismiss })
			flushUniversalSync(() => {})
			await vi.waitFor(() => expect(handler).toBeTypeOf('function'))
			expect((globalThis as any).NSEvent.addLocalMonitorForEventsMatchingMaskHandler).toHaveBeenCalledTimes(1)
			const marked = { keyCode: 53, window: { firstResponder: { hasMarkedText: () => true } } }
			expect(handler(marked)).toBeNull()
			expect(dismiss).not.toHaveBeenCalled()
			expect(handler({ keyCode: 53 })).toBeNull()
			expect(dismiss).toHaveBeenCalledTimes(1)
		} finally {
			inner.unmount(); outer.unmount(); flushUniversalSync(() => {})
			await vi.waitFor(() => expect(removeMonitor).toHaveBeenCalledWith(token))
			vi.unstubAllGlobals()
		}

		expect(removeMonitor).toHaveBeenCalledWith(token)
	})

	it('returns explicit focus only when the retiring root owned the top layer', async () => {
		const outer = freshRoot(), inner = freshRoot()
		const lowerFocus = vi.fn(), upperFocus = vi.fn(), dismiss = vi.fn()
		try {
			outer.render(Entry as any, { active: true, dismiss, focusTarget: { focus: lowerFocus } })
			inner.render(Entry as any, { active: true, dismiss, focusTarget: { focus: upperFocus } })
			flushUniversalSync(() => {})
			await vi.waitFor(() => { escape(); expect(dismiss).toHaveBeenCalled() })
			outer.render(Entry as any, { active: false, dismiss, focusTarget: { focus: lowerFocus } })
			flushUniversalSync(() => {})
			await new Promise(resolve => setTimeout(resolve, 0))
			expect(lowerFocus).not.toHaveBeenCalled()
			inner.render(Entry as any, { active: false, dismiss, focusTarget: { focus: upperFocus } })
			flushUniversalSync(() => {})
			await vi.waitFor(() => expect(upperFocus).toHaveBeenCalledTimes(1))
		} finally {
			inner.unmount(); outer.unmount(); flushUniversalSync(() => {})
			await vi.waitFor(() => expect(escape()).not.toHaveBeenCalled())
		}
	})

	it('controlled AppKit hover-card requests retain the popup until accepted', async () => {
		const close = vi.fn(), hide = vi.fn(), updated = vi.fn()
		const show = vi.fn(() => ({ close }))
		vi.stubGlobal('__xplatAppKit', { showAnchoredPopup: show })
		const root = freshRoot()
		try {
			root.render(CardProbe as any, { open: true, hide })
			flushUniversalSync(() => {})
			await vi.waitFor(() => expect(show).toHaveBeenCalledTimes(1))
			escape()
			expect(hide).toHaveBeenCalledTimes(1)
			expect(close).not.toHaveBeenCalled()
			root.render(CardProbe as any, { open: true, hide: updated })
			flushUniversalSync(() => {})
			escape()
			expect(updated).toHaveBeenCalledTimes(1)
			expect(close).not.toHaveBeenCalled()
			root.render(CardProbe as any, { open: false, hide: updated })
			flushUniversalSync(() => {})
			await vi.waitFor(() => expect(close).toHaveBeenCalledTimes(1))
			expect(updated).toHaveBeenCalledTimes(1)
		} finally {
			root.unmount(); flushUniversalSync(() => {})
			await vi.waitFor(() => expect(escape()).not.toHaveBeenCalled())
			vi.unstubAllGlobals()
		}
	})

	it('AppKit Popover passes depth into its popup and closes silently on owner removal', async () => {
		let popupOptions: any
		const dismiss = vi.fn()
		const popup = { closed: false, close: vi.fn(() => popupOptions.onClose()), update() {} }
		const close = popup.close
		vi.stubGlobal('__xplatAppKit', { showAnchoredPopup: (options: any) => { popupOptions = options; return popup } })
		const root = freshRoot()
		try {
			root.render(Popover as any, { open: true, anchor: { current: {} }, onDismiss: dismiss })
			flushUniversalSync(() => {})
			await vi.waitFor(() => expect(popupOptions?.props.layerDepth).toBe(1))
			root.render(Popover as any, { open: false, anchor: { current: {} }, onDismiss: dismiss })
			flushUniversalSync(() => {})
			await vi.waitFor(() => expect(close).toHaveBeenCalledTimes(1))
			expect(dismiss).not.toHaveBeenCalled()
			root.render(Popover as any, { open: true, anchor: { current: {} }, onDismiss: dismiss })
			flushUniversalSync(() => {})
			await new Promise(resolve => setTimeout(resolve, 0))
			popup.closed = true
			popupOptions.onClose()
			expect(dismiss).toHaveBeenCalledTimes(1)
		} finally {
			root.unmount(); flushUniversalSync(() => {}); vi.unstubAllGlobals()
		}
	})
})
