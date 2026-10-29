/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
vi.mock('./presentation.macos.tsrx', () => ({ usePresentation: (open: boolean, Panel: any, props: any) => open ? <Panel {...props} /> : null }))
vi.mock('./layer-dismissal.tsrx', () => ({ LayerDepthProvider: (props: any) => props.children, useLayerDismissal: () => ({ depth: 0, shouldClose: () => true }) }))
vi.mock('./controls.macos.tsrx', () => ({ Button: (props: any) => <masonview accessibilityLabel={props.accessibilityLabel} onTap={props.clickAction}>{props.children}</masonview> }))
import { Lightbox } from './Lightbox.macos.tsrx'

it('AppKit panel wires current zoom/swipe policy and media replacement while late handlers become inert', () => {
	const window = {}, changes: number[] = [], current: number[] = [], zooms: number[] = []
	const container = createObjectContainer('nativescript'), driver = createObjectDriver('nativescript'), instance = driver.getPublicInstance.bind(driver)
	driver.getPublicInstance = (container, id) => {
		const view: any = instance(container, id); view.window = window
		if (view.type === 'scrollview') Object.assign(view, { magnification: 1, contentView: { bounds: { origin: { x: 0, y: 0 }, size: { width: 200, height: 100 } } }, setMagnificationCenteredAtPoint(scale: number) { view.magnification = scale; zooms.push(scale) } })
		return view
	}
	const root = createUniversalRoot(container, driver), media = [{ src: 'photo-a', alt: 'First' }, { src: 'photo-b', alt: 'Second' }]
	const render = (extra: any = {}) => flushUniversalSync(() => root.render(Lightbox, { isOpen: true, onOpenChange() {}, media, onIndexChange: (index: number) => changes.push(index), ...extra }))
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	try {
		render(); const stage = all().find((node) => node.props?.className === 'vx-lightbox-stage'), scroll = all().find((node) => node.type === 'scrollview')
		stage.props.onDoubleTap(); expect(zooms).toEqual([2]); stage.props.onSwipe({ direction: 2 }); expect(changes).toEqual([])
		stage.props.onDoubleTap(); stage.props.onSwipe({ direction: 2 }); flushUniversalSync(() => {}); expect(changes).toEqual([1]); expect(scroll.magnification).toBe(1)
		render({ index: 0, hasZoom: false, onIndexChange: (index: number) => current.push(index) }); stage.props.onSwipe({ direction: 2 }); expect(current).toEqual([1]); stage.props.onDoubleTap(); expect(zooms).toEqual([2, 1])
		root.unmount(); stage.props.onSwipe({ direction: 1 }); expect(current).toEqual([1])
	} finally { root.unmount() }
})
