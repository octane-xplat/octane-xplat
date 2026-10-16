import { expect, it, vi } from 'vitest'
import { createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import {
	PlacementCase,
	ReactivePlacementCase,
	SlotCase,
	UpdatingPlacement,
	UpdatingComposite,
} from '../tests/grid-placement.fixture.mobile.tsrx'

// The compiler, scheduler and installed driver are real; native host views
// are substituted. This does not establish device layout or hit-testing.
vi.mock('@nativescript/core', () => {
	class View {
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
	const { nativeScriptDriver, createNativeScriptContainer, releaseNativeScriptContainer } =
		await import('../node_modules/@nativescript-community/octane/dist/driver.js')

	const { LayoutBase } = await import('@nativescript/core')
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

it('preserves raw and composite root coordinates, explicit zero and spans beside automatic children', async () => {
	const app = await mount(PlacementCase, { values: ['a', 'b'] })
	const grid = app.host.children[0]
	expect(grid.children.map((v: any) => [v.row, v.col])).toEqual([
		[0, 0],
		[0, 0],
		[0, 2],
		[1, 0],
	])

	expect(grid.children[1].colSpan).toBe(2)
	app.root.render(PlacementCase, { values: ['b', 'a', 'c'] })
	await Promise.resolve()
	expect(grid.children.map((v: any) => [v.row, v.col])).toEqual([
		[0, 0],
		[0, 0],
		[0, 2],
		[1, 0],
		[1, 1],
	])

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
	expect(grid.children.map((v: any) => [v.text, v.row, v.col])).toEqual([
		['b', 0, 0],
		['a', 0, 1],
		['c', 1, 0],
	])

	expect(grid.children[1]).toBe(a)
	flushUniversalSync(() => update(['c']))
	await Promise.resolve()
	expect(grid.children.map((v: any) => [v.text, v.row, v.col])).toEqual([['c', 0, 0]])
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

it.each([UpdatingPlacement, UpdatingComposite])(
	'tracks reactive authored coordinates and removes explicit placement and spans (%s)',
	async (component) => {
		const app = await mount(component, { col: 2, span: 1 })
		const grid = app.host.children[0]
		app.root.render(component, { col: 0, span: 2 })
		await Promise.resolve()
		expect(grid.children.map((v: any) => [v.row, v.col, v.colSpan])).toEqual([
			[0, 0, 2],
			[0, 2, 1],
		])

		app.root.render(component, { col: undefined, span: undefined })
		await Promise.resolve()
		expect(grid.children.map((v: any) => [v.row, v.col, v.colSpan])).toEqual([
			[0, 0, 1],
			[0, 1, 1],
		])

		app.dispose()
	},
)
