/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
// State/key fixtures use an explicit inline test host; floating ownership has separate cases.
vi.mock('./TypeaheadResults.macos.tsrx', () => ({ TypeaheadResults: (props: any) => props.open ? props.children ?? null : null }))
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Tokenizer } from './Tokenizer.macos.tsrx'
vi.mock('./Tooltip.tsrx', () => ({ Tooltip: (props: any) => props.children ?? null }))
const items = ['a', 'g', 'l'].map((id) => ({ id, label: id }))
const rect = (x: number, width: number) => ({ origin: { x, y: 0 }, size: { width, height: 24 } })
function mount(mode = 'unfocusedInline') {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript')), window: any = { firstResponder: null }
	const metrics: any = { available: 120, widths: { a: 70, g: 70, l: 70 }, freezeClip: undefined }
	const base = { label: 'Tags', value: items, onChange: vi.fn(), searchSource: { bootstrap: () => [], search: async () => [] }, tokenOverflowBehavior: mode, renderToken: (item: any) => <label text={item.id} /> }
	const has = (node: any, name: string) => String(node.props?.className).split(' ').includes(name)
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const clip = () => all().find((node) => has(node, 'vx-tokenizer-clip')), counter = () => all().find((node) => has(node, 'vx-tokenizer-overflow'))
	const input = () => all().find((node) => node.type === 'textfield'), wrapper = () => all().find((node) => has(node, 'vx-tokenizer'))
	const hydrate = () => {
		for (const node of all()) { node.window = window; for (const child of node.children ?? []) child.superview = node; node.isDescendantOf = (parent: any) => { for (let view = node.superview; view; view = view.superview) if (view === parent) return true; return false } }
		const viewport = clip(), count = counter()
		if (!viewport) return
		const width = metrics.freezeClip ?? (metrics.available - (count?.props.text ? 44 : 0)), changed = viewport.bounds?.size.width !== width
		viewport.bounds = rect(0, width)
		if (count) { count.bounds = rect(0, count.props.text ? 40 : 0); count.convertRectToView = () => rect(width + 4, count.props.text ? 40 : 0) }
		let x = 0
		for (const token of viewport.children ?? []) {
			const label = token.children?.find((node: any) => node.type === 'label'), tokenWidth = metrics.widths[label?.props.text] ?? 70, start = x
			token.bounds = rect(0, tokenWidth); token.convertRectToView = (_: any, target: any) => { expect(target).toBe(viewport); return rect(start, tokenWidth) }; x += tokenWidth
		}
		if (changed) viewport.props.onLayoutChanged()
	}
	const flush = () => { flushUniversalSync(() => {}); hydrate() }
	const settle = async () => { for (let step = 0; step < 5; step++) { await Promise.resolve(); flush() } }
	const render = (props: any) => { flushUniversalSync(() => root.render(Tokenizer, props)); hydrate() }
	render(base)
	return { root, base, render, flush, settle, metrics, clip, counter, input, wrapper, window, all, has }
}
it('collapsed tokens occupy a native clip viewport, with the counter outside and current resize counts', async () => {
	const f = mount()
	try {
		await f.settle(); expect(f.clip().props.style.overflow).toBe('hidden'); expect(f.counter().superview).toBe(f.clip().superview); expect(f.counter().props.text).toBe('+2 more')
		f.metrics.available = 230; f.flush(); await f.settle(); expect(f.counter().props.text).toBe(''); expect(f.counter().props.style.display).toBe('none')
		f.metrics.available = 100; f.flush(); await f.settle(); expect(f.counter().props.text).toBe('+3 more')
	} finally { f.root.unmount() }
})
it('focus expands inline tokens and controlled replacement remeasures the current selection', async () => {
	const f = mount()
	try {
		await f.settle(); const input = f.input(); f.window.firstResponder = input; input.props.onFocus(); f.flush(); await f.settle(); expect(f.clip()).toBeUndefined(); expect(f.counter()).toBeUndefined(); expect(f.base.onChange).not.toHaveBeenCalled()
		f.render({ ...f.base, tokenOverflowBehavior: 'unfocusedLayer', value: [items[2]] }); await f.settle(); expect(f.counter().props.text).toBe('')
	} finally { f.root.unmount() }
})
it('expanded layer token copies never replace the collapsed row measurement refs', async () => {
	const f = mount('unfocusedLayer')
	try {
		await f.settle(); f.wrapper().props.onTap(); f.flush(); await f.settle(); expect(f.all().filter((node) => f.has(node, 'vx-tokenizer-token'))).toHaveLength(6)
		f.metrics.available = 100; f.flush(); await f.settle(); expect(f.counter().props.text).toBe('+3 more')
		expect(f.clip().children.every((token: any) => typeof token.props.onLayoutChanged === 'function')).toBe(true)
	} finally { f.root.unmount() }
})
it('incomplete geometry preserves the last measured count and held layout callbacks are inert after teardown', async () => {
	const f = mount()
	try {
		await f.settle(); const layout = f.clip().props.onLayoutChanged; f.metrics.freezeClip = 0; f.flush(); await f.settle(); expect(f.counter().props.text).toBe('+2 more')
		f.metrics.freezeClip = undefined; f.metrics.available = 260; f.flush(); await f.settle(); expect(f.counter().props.text).toBe('')
		f.root.unmount(); layout(); await f.settle(); expect(f.all()).toEqual([])
	} finally { f.root.unmount() }
})
it('reclaiming a counter waits through stale geometry notifications until native layout publishes its space', async () => {
	const f = mount()
	try {
		await f.settle(); f.metrics.available = 230; f.metrics.freezeClip = 186; f.flush(); await f.settle(); expect(f.counter().props.text).toBe('')
		for (let step = 0; step < 3; step++) { f.clip().props.onLayoutChanged(); await f.settle(); expect(f.counter().props.text).toBe('') }
		f.metrics.widths.l = 120; f.flush(); f.clip().children[2].props.onLayoutChanged(); await f.settle(); expect(f.counter().props.text).toBe('+1 more')
		f.metrics.widths.l = 70; f.metrics.freezeClip = undefined; f.flush(); f.clip().children[2].props.onLayoutChanged(); await f.settle(); expect(f.clip().bounds.size.width).toBe(230); expect(f.counter().props.text).toBe('')
	} finally { f.root.unmount() }
})
