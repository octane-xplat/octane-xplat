import { expect, it, vi } from 'vitest'
import { createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { LayoutBase } from '@nativescript/core'
// Load the driver during collection so cold module transforms do not consume
// individual tests' five-second timeout on CI. vi.mock below is hoisted.
import {
	nativeScriptDriver,
	createNativeScriptContainer,
	releaseNativeScriptContainer,
} from '../node_modules/@nativescript-community/octane/dist/driver.js'
import {
	PlacementCase,
	ReactivePlacementCase,
	SlotCase,
	UpdatingPlacement,
	UpdatingComposite,
	TrackStyleCase,
} from '../tests/grid-placement.fixture.mobile.tsrx'
import { masonStyleOf } from '../tests/masonkit-mock'

// The compiler, scheduler and installed driver are real; native host views
// are substituted. This does not establish device layout or hit-testing.
vi.mock('@nativescript/core', () => {
	class View {
		nativeViewProtected = {}
		coordinates = new Map<string, number>()
		get row() {
			return this.coordinates.get('row') ?? 0
		}
		set row(value: number) {
			if (value !== this.row) {
				this.coordinates.set('row', value)
			}
		}
		get col() {
			return this.coordinates.get('col') ?? 0
		}
		set col(value: number) {
			if (value !== this.col) {
				this.coordinates.set('col', value)
			}
		}
		visibility = 'visible'
		parent: View | null = null
		text = ''
		style = {}
		listeners = new Map<string, Set<(data: unknown) => void>>()
		on(type: string, fn: (data: unknown) => void) {
			if (!this.listeners.has(type)) {
				this.listeners.set(type, new Set())
			}

			this.listeners.get(type)!.add(fn)
		}
		off(type: string, fn: (data: unknown) => void) {
			this.listeners.get(type)?.delete(fn)
		}
		notify(data: { eventName: string }) {
			for (const fn of this.listeners.get(data.eventName) ?? []) {
				fn(data)
			}
		}
	}

	class LayoutBase extends View {
		children: View[] = []
		addChild(view: View) {
			this.children.push(view)
			view.parent = this
		}
		insertChild(view: View, index: number) {
			this.children.splice(index, 0, view)
			view.parent = this
		}
		removeChild(view: View) {
			this.children.splice(this.children.indexOf(view), 1)
			view.parent = null
		}
		eachChildView(fn: (view: View) => boolean) {
			this.children.forEach(fn)
		}
		getChildrenCount() {
			return this.children.length
		}
		getChildIndex(view: View) {
			return this.children.indexOf(view)
		}
	}

	class ContentView extends View {
		content: View | null = null
	}

	class TextBase extends View {}
	const named = Object.fromEntries(
		'AbsoluteLayout ActionBar ActionItem ActivityIndicator Button LiquidGlass DatePicker DockLayout FlexboxLayout FormattedString Frame GridLayout HtmlView Image Label ListPicker ListView NavigationButton Page Placeholder Progress ProxyViewContainer RootLayout ScrollView SearchBar SegmentedBar SegmentedBarItem Slider Span StackLayout Switch TabView TabViewItem TextField TextView TimePicker ViewBase WebView WrapLayout'
			.split(' ')
			.map((name) => [name, class extends View {}]),
	)

	return {
		...named,
		Application: {},
		isIOS: false,
		isAndroid: false,
		View,
		LayoutBase,
		ContentView,
		TextBase,
		GridLayout: LayoutBase,
		RootLayout: LayoutBase,
		ScrollView: ContentView,
		StackLayout: LayoutBase,
		FlexboxLayout: LayoutBase,
		Button: TextBase,
		Label: TextBase,
		unsetValue: Symbol('unset'),
	}
})

async function mount(component: any, props: any) {
	const host: any = new LayoutBase()
	const container = createNativeScriptContainer(host)
	const root = createUniversalRoot(container, nativeScriptDriver)
	container.root = root
	root.render(component, props)
	return {
		host,
		root,
		container,
		dispose: () => {
			root.unmount()
			releaseNativeScriptContainer(container)
		},
	}
}

it('writes explicit placement as grid lines and leaves automatic children unpositioned', async () => {
	const app = await mount(PlacementCase, { values: ['a', 'b'] })
	const grid = app.host.children[0]
	const writes = grid.children.map((v: any) => ({
		row: masonStyleOf(v)?.__writes.gridRow,
		col: masonStyleOf(v)?.__writes.gridColumn,
	}))
	// row={0} col={0} -> '1'; the composite child carries colSpan={2} ->
	// '1 / span 2'; auto-flow children keep no explicit lines.
	expect(writes[0]).toEqual({ row: '1', col: '1' })
	expect(writes[1]).toEqual({ row: '1', col: '1 / span 2' })
	expect(writes[2].row).toBeUndefined()
	expect(writes[2].col).toBeUndefined()

	app.root.render(PlacementCase, { values: ['b', 'a', 'c'] })
	await Promise.resolve()
	expect(grid.children.length).toBe(5)
	expect(masonStyleOf(grid.children[4])?.__writes.gridRow).toBeUndefined()

	app.dispose()
	expect(app.container.nodes.size).toBe(0)
})

it('reflows child-owned late insertion, removal and keyed reorder without rerendering Grid', async () => {
	let update!: (values: string[]) => void
	const app = await mount(ReactivePlacementCase, {
		capture: (fn: typeof update) => {
			update = fn
		},
	})

	const grid = app.host.children[0]
	const a = grid.children[0]
	flushUniversalSync(() => update(['b', 'a', 'c']))
	await Promise.resolve()
	expect(grid.children.map((v: any) => v.text)).toEqual(['b', 'a', 'c'])

	expect(grid.children[1]).toBe(a)
	flushUniversalSync(() => update(['c']))
	await Promise.resolve()
	expect(grid.children.map((v: any) => v.text)).toEqual(['c'])
	const insert = Object.getPrototypeOf(grid).insertChild
	flushUniversalSync(() => update(['d', 'c']))
	app.dispose()
	await Promise.resolve()
	expect(grid.insertChild).toBe(insert)
	expect(app.host.children).toEqual([])
})

it.each(['rootlayout', 'contentview'])(
	'supports late insertion and removal at %s driver host boundary',
	async (type) => {
		const app = await mount(SlotCase, { type, visible: false })
		const host = app.host.children[0]
		app.root.render(SlotCase, { type, visible: true })
		expect(type === 'contentview' ? host.content.text : host.children[0].text).toBe('late')
		app.root.render(SlotCase, { type, visible: false })
		expect(type === 'contentview' ? host.content : host.children.length).toBe(
			type === 'contentview' ? null : 0,
		)

		app.dispose()
	},
)

it.each([
	[UpdatingPlacement, '1'],
	[UpdatingComposite, undefined],
])(
	'tracks reactive authored coordinates and removes explicit placement and spans (%s)',
	async (component, rowLine) => {
		const app = await mount(component, { col: 2, span: 1 })
		const grid = app.host.children[0]
		app.root.render(component, { col: 0, span: 2 })
		await Promise.resolve()
		expect(masonStyleOf(grid.children[0])?.__writes.gridRow).toBe(rowLine)
		expect(masonStyleOf(grid.children[0])?.__writes.gridColumn).toBe('1 / span 2')
		expect(masonStyleOf(grid.children[1])?.__writes.gridColumn).toBeUndefined()

		app.root.render(component, { col: undefined, span: undefined })
		await Promise.resolve()
		// Removal clears the leaf write — a stale '1 / span 2' would linger.
		// UpdatingPlacement still authors row={0}, so its row line stays '1';
		// the composite emits no row at all, so its last write is undefined.
		expect(masonStyleOf(grid.children[0])?.__writes.gridRow).toBe(rowLine)
		expect(masonStyleOf(grid.children[0])?.__writes.gridColumn).toBeUndefined()

		app.dispose()
	},
)

it.each([
	{ columns: undefined, template: undefined, expected: undefined },
	{ columns: '*', template: undefined, expected: '1fr' },
	{ columns: undefined, template: 'minmax(0,1fr)', expected: 'minmax(0,1fr)' },
])('preserves CSS ownership of omitted tracks through nested Mason attach (%j)', async ({ columns, template, expected }) => {
	const app = await mount(TrackStyleCase, { columns, template })
	try {
		const grid = app.host.children[0].children[0]
		const style = masonStyleOf(grid)!
		expect(style.gridTemplateRows).toBe('auto 1fr')
		if (expected === undefined) {
			// Writing undefined would be replayed after attachment and erase a
			// class-authored template, even after NS restores its CSS cascade.
			expect(style.__writes).not.toHaveProperty('gridTemplateColumns')
		} else {
			expect(style.gridTemplateColumns).toBe(expected)
		}
	} finally {
		app.dispose()
	}
})

it.each([
	{ columns: '*', template: undefined, expected: '1fr' },
	{ columns: undefined, template: 'minmax(0,1fr)', expected: 'minmax(0,1fr)' },
])('keeps removed tracks cleared when a later sibling attaches (%j)', async ({ columns, template, expected }) => {
	const app = await mount(TrackStyleCase, { columns, template })
	try {
		const parent = app.host.children[0]
		const grid = parent.children[0]
		expect(masonStyleOf(grid)!.gridTemplateColumns).toBe(expected)

		app.root.render(TrackStyleCase, {})
		await Promise.resolve()
		expect(masonStyleOf(grid)!.gridTemplateColumns).toBeUndefined()

		app.root.render(TrackStyleCase, { extra: true })
		await Promise.resolve()
		expect(parent.children).toHaveLength(2)
		expect(parent.children[0]).toBe(grid)
		expect(masonStyleOf(grid)!.gridTemplateColumns).toBeUndefined()
		expect(masonStyleOf(grid)!.gridTemplateRows).toBe('auto 1fr')
	} finally {
		app.dispose()
	}
})
