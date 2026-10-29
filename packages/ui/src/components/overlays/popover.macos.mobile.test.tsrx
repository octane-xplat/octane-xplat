/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createContext, useContext } from 'octane'
import { createObjectContainer, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { createPortalObjectDriver } from '../../../tests/portal-object-driver'
import { Popover } from './Popover.macos.tsrx'
import { LayerDepthContext } from './layer-dismissal.tsrx'
import { dispatchLayerKey } from './layer-stack'
vi.mock('./layer-keys', () => import('./layer-keys.ts'))

const Project = createContext('missing'), ProjectProvider: any = Project
function ProjectLabel() { return <label className="project-value" text={`${useContext(Project)}:${useContext(LayerDepthContext)}`} /> }
afterEach(() => vi.unstubAllGlobals())
function fixture(initial: any = {}) {
	const observers = new Map<object, any>(), layers: any[] = [], window: any = {}
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(_: unknown, __: unknown, ___: unknown, callback: any) { const token = {}; observers.set(token, callback); return token }, removeObserver(token: object) { observers.delete(token) },
	} })
	vi.stubGlobal('__xplatAppKit', { showLayer(options: any) {
		const source = options.createContentRoot({ window }), layer: any = { options, source, closed: false, show: vi.fn(),
			update: vi.fn(() => source.whenCommitted(() => {})), close: vi.fn(() => { if (layer.closed) return; layer.closed = true; source.unmount(); options.onClose() }),
		}
		layers.push(layer); layer.update(); return layer
	} })
	const anchor: any = { current: { window, convertRectToView() {} } }, dismiss = vi.fn()
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createPortalObjectDriver())
	function App(props: any) { return <ProjectProvider value={props.project}><masonview className="source"><Popover {...props.popup}><ProjectLabel /></Popover></masonview></ProjectProvider> }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const base = { open: true, anchor, onDismiss: dismiss, ...initial }
	const render = (popup = base, project = 'Alpha') => flushUniversalSync(() => root.render(App, { popup, project }))
	const settle = async () => { for (let index = 0; index < 4; index++) { await Promise.resolve(); flushUniversalSync(() => {}) } }
	render()
	return { root, base, render, settle, all, layers, observers, anchor, dismiss }
}
it('portals current provider content and layer depth without a standalone render or extra show', async () => {
	const f = fixture()
	try {
		await f.settle(); expect(f.layers).toHaveLength(1); expect(f.layers[0].options.component).toBeUndefined(); expect(f.layers[0].show).toHaveBeenCalledTimes(1)
		expect(f.all().find((node) => node.props?.className === 'project-value').props.text).toBe('Alpha:1')
		f.render(f.base, 'Beta'); await f.settle(); expect(f.all().find((node) => node.props?.className === 'project-value').props.text).toBe('Beta:1'); expect(f.layers).toHaveLength(1)
	} finally { f.root.unmount() }
	expect(f.layers[0].closed).toBe(true); expect(f.observers.size).toBe(0); expect(f.dismiss).not.toHaveBeenCalled()
})
it('uses current controlled dismissal and Escape policy while a rejected close retains the layer', async () => {
	const f = fixture(), newer = vi.fn()
	try {
		await f.settle(); f.layers[0].options.onClose(); expect(f.dismiss).toHaveBeenCalledTimes(1); expect(f.layers[0].closed).toBe(false)
		f.render({ ...f.base, onDismiss: newer, dismissOnEscape: false }); await f.settle()
		dispatchLayerKey({ key: 'Escape', preventDefault() {} }); expect(newer).not.toHaveBeenCalled()
		f.render({ ...f.base, onDismiss: newer }); await f.settle(); dispatchLayerKey({ key: 'Escape', preventDefault() {} }); expect(newer).toHaveBeenCalledTimes(1)
		f.render({ ...f.base, open: false, onDismiss: newer }); await f.settle(); expect(f.layers[0].closed).toBe(true); expect(newer).toHaveBeenCalledTimes(1)
	} finally { f.root.unmount() }
})
it('honors defaultOpen, closes itself on dismissal and retires held native callbacks', async () => {
	const f = fixture({ open: undefined, defaultOpen: true })
	try {
		await f.settle(); const old = f.layers[0]; old.options.onClose(); await f.settle(); expect(old.closed).toBe(true); expect(f.dismiss).toHaveBeenCalledTimes(1)
		old.options.onClose(); await f.settle(); expect(f.dismiss).toHaveBeenCalledTimes(1); expect(f.layers).toHaveLength(1)
	} finally { f.root.unmount() }
})
