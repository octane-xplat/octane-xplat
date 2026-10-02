/**
 * Stand-in for `@nativescript/core` under vitest: the class hierarchy the
 * driver's `instanceof` checks and child-hosting calls rely on, with no
 * platform code behind it. Every class the element registry imports must
 * exist here, or the registry module fails to evaluate.
 */
type Handler = (data: any) => void
export const unsetValue = Symbol('unsetValue')
export const runPropertyNames = [
	'fontFamily',
	'fontSize',
	'fontWeight',
	'fontStyle',
	'fontVariationSettings',
	'color',
	'backgroundColor',
	'textDecoration',
]
export const styleProperties = runPropertyNames.map((name) => ({
	name,
	isSet: (style: object) => Object.hasOwn(style, name),
}))

export class MockViewBase {
	parent: MockViewBase | null = null
	className: unknown = undefined
	private styleEvents = new Map<string, Set<Handler>>()
	style: any = new Proxy({} as Record<string, unknown>, {
		get: (target, name: string) => {
			if (name === 'on')
				return (type: string, fn: Handler) => {
					const handlers = this.styleEvents.get(type) ?? new Set()
					handlers.add(fn)
					this.styleEvents.set(type, handlers)
				}
			if (name === 'off')
				return (type: string, fn: Handler) => this.styleEvents.get(type)?.delete(fn)
			return target[name] ?? this.parent?.style[name]
		},
		set: (target, name: string, value) => {
			if (value === unsetValue) delete target[name]
			else target[name] = value
			for (const fn of [...(this.styleEvents.get(`${name}Change`) ?? [])])
				fn({ eventName: `${name}Change` })
			return true
		},
	})
	eachChild(_callback: (child: MockViewBase) => boolean): void {}
	_addView(child: MockViewBase): void {
		if (child.parent) throw new Error('View already has a parent')
		child.parent = this
	}
	_removeView(child: MockViewBase): void {
		if (child.parent !== this) throw new Error('View not added')
		child.parent = null
	}
	inlineStyle: string | null = null
	hostSlot?: string
	readonly handlers = new Map<string, Set<Handler>>()

	get typeName(): string {
		return this.constructor.name
	}

	on(type: string, handler: Handler): void {
		let handlers = this.handlers.get(type)
		if (handlers === undefined) {
			handlers = new Set()
			this.handlers.set(type, handlers)
		}
		handlers.add(handler)
	}

	off(type: string, handler?: Handler): void {
		if (handler) this.handlers.get(type)?.delete(handler)
		else this.handlers.delete(type)
	}

	notify(data: { eventName: string; object?: unknown; [field: string]: unknown }): void {
		for (const handler of [...(this.handlers.get(data.eventName) ?? [])]) handler(data)
	}

	setInlineStyle(css: string): void {
		this.inlineStyle = css
	}
}

export class MockView extends MockViewBase {
	visibility = 'visible'
}

export class MockLayoutBase extends MockView {
	readonly children: MockView[] = []

	insertChild(child: MockView, index: number): void {
		child.parent = this
		this.children.splice(index, 0, child)
	}

	addChild(child: MockView): void {
		this.insertChild(child, this.children.length)
	}

	removeChild(child: MockView): void {
		const index = this.children.indexOf(child)
		if (index === -1) throw new Error(`${child.typeName} is not a child of ${this.typeName}`)
		this.children.splice(index, 1)
		child.parent = null
	}

	getChildrenCount(): number {
		return this.children.length
	}
}

export class MockContentView extends MockView {
	#content: MockView | null = null

	get content(): MockView | null {
		return this.#content
	}

	set content(view: MockView | null) {
		if (this.#content !== null) this.#content.parent = null
		this.#content = view
		if (view !== null) view.parent = this
	}
}

export class MockTextBase extends MockView {
	#text = ''
	private formatted: MockFormattedString | null = null
	get formattedText() {
		return this.formatted
	}
	set formattedText(value: MockFormattedString | null) {
		if (this.formatted) this._removeView(this.formatted)
		this.formatted = value
		if (value) this._addView(value)
	}

	get text(): string {
		return this.#text
	}

	/** Like core's `Property`: a changed write raises `textChange`, whoever wrote it. */
	set text(value: string) {
		const oldValue = this.#text
		if (oldValue === value) return
		this.#text = value
		this.notify({
			eventName: 'textChange',
			object: this,
			propertyName: 'text',
			value,
			oldValue,
		})
	}
}

export class MockSpan extends MockViewBase {
	get tappable() {
		return !!this.handlers.get('linkTap')?.size
	}
	private value = ''
	get text() {
		return this.value
	}
	set text(value: string) {
		this.value = value
		this.notify({ eventName: 'propertyChange', propertyName: 'text' })
	}
	constructor() {
		super()
		for (const name of runPropertyNames)
			Object.defineProperty(this, name, {
				get: () => this.style[name],
				set: (value) => {
					this.style[name] = value
				},
			})
	}
}

class Runs extends Array<MockSpan> {
	constructor(private owner: MockFormattedString) {
		super()
	}
	static get [Symbol.species]() {
		return Array
	}
	getItem(index: number) {
		return this[index]
	}
	splice(start: number, count: number, ...added: MockSpan[]): MockSpan[] {
		// Core really adds before removing; catch a driver's unsafe replace/move.
		for (const span of added) this.owner._addView(span)
		const removed = super.splice(start, count, ...added)
		for (const span of removed) this.owner._removeView(span)
		return removed
	}
	push(...added: MockSpan[]): number {
		for (const span of added) this.owner._addView(span)
		return super.push(...added)
	}
}
export class MockFormattedString extends MockViewBase {
	readonly spans = new Runs(this)
}

export class MockActionBar extends MockView {
	titleView: MockView | null = null
}

/** Core's `TabViewItem.view`: set once, and never replaced. */
export class MockTabViewItem extends MockViewBase {
	#view: MockView | null = null
	title: unknown = undefined

	get view(): MockView | null {
		return this.#view
	}

	set view(value: MockView | null) {
		if (this.#view === value) return
		if (this.#view !== null) {
			throw new Error(
				'Changing the view of an already loaded TabViewItem is not currently supported.',
			)
		}
		this.#view = value
		if (value !== null) value.parent = this
	}

	_removeView(view: MockViewBase): void {
		if (view.parent !== this) throw new Error('View not added to this instance.')
		view.parent = null
	}
}

/** Core's `TabView.items`: every item needs a view, and a changed array re-parents them. */
export class MockTabView extends MockView {
	#items: MockTabViewItem[] | null = null
	/** How many times `items` was assigned; each assignment costs a core lifecycle pass. */
	assignments = 0

	get items(): MockTabViewItem[] | null {
		return this.#items
	}

	set items(value: MockTabViewItem[] | null) {
		this.assignments++
		for (const item of value ?? []) {
			if (!item.view) throw new Error('TabViewItem must have a view.')
		}
		for (const item of this.#items ?? []) {
			if (!value?.includes(item)) item.parent = null
		}
		this.#items = value
		for (const item of value ?? []) item.parent = this
	}
}

export interface MockCell {
	view: MockView | null
	index: number
}

/**
 * The recycling contract of core's ListView: a changed `items` reloads, a
 * reload re-prepares every live cell, a new cell's view comes from
 * `itemTemplate`, and `itemLoading` may swap `args.view`.
 */
export class MockListView extends MockView {
	#items: unknown = null
	itemTemplate: unknown = null
	/** Live cells, like a table's visible rows. */
	readonly cells: MockCell[] = []
	reloads = 0

	get items(): unknown {
		return this.#items
	}

	set items(value: unknown) {
		if (value === this.#items) return
		this.#items = value
		this.refresh()
	}

	refresh(): void {
		this.reloads++
		for (const cell of this.cells) this.prepare(cell)
	}

	/** Bring rows into view, one new cell each. */
	show(...indices: number[]): void {
		for (const index of indices) {
			const cell: MockCell = { view: null, index }
			this.cells.push(cell)
			this.prepare(cell)
		}
	}

	/** Recycle a live cell for another row, as a table does while scrolling. */
	reuse(position: number, index: number): void {
		const cell = this.cells[position]
		cell.index = index
		this.prepare(cell)
	}

	private prepare(cell: MockCell): void {
		if (cell.view === null && typeof this.itemTemplate === 'function') {
			cell.view = (this.itemTemplate as () => MockView)()
		}
		const args = {
			eventName: 'itemLoading',
			object: this,
			index: cell.index,
			view: cell.view,
		}
		this.notify(args)
		cell.view = args.view
	}
}

const LAYOUTS = [
	'AbsoluteLayout',
	'DockLayout',
	'FlexboxLayout',
	'GridLayout',
	'LiquidGlass',
	'ProxyViewContainer',
	'RootLayout',
	'StackLayout',
	'WrapLayout',
]
const CONTENT_VIEWS = ['Frame', 'Page', 'ScrollView']
const TEXT_VIEWS = ['Button', 'HtmlView', 'Label', 'TextField', 'TextView']
const LEAVES = [
	'ActionItem',
	'ActivityIndicator',
	'DatePicker',
	'Image',
	'ListPicker',
	'NavigationButton',
	'Placeholder',
	'Progress',
	'SearchBar',
	'SegmentedBar',
	'SegmentedBarItem',
	'Slider',
	'Switch',
	'TimePicker',
	'WebView',
]

export function createCoreMock(): Record<string, unknown> {
	const core: Record<string, unknown> = {
		ViewBase: MockViewBase,
		View: MockView,
		LayoutBase: MockLayoutBase,
		ContentView: MockContentView,
		TextBase: MockTextBase,
		Span: MockSpan,
		FormattedString: MockFormattedString,
		ActionBar: MockActionBar,
		ListView: MockListView,
		TabView: MockTabView,
		TabViewItem: MockTabViewItem,
		unsetValue,
	}
	const derive = (names: readonly string[], Base: new () => object): void => {
		for (const name of names) core[name] = { [name]: class extends Base {} }[name]
	}
	derive(LAYOUTS, MockLayoutBase)
	derive(CONTENT_VIEWS, MockContentView)
	derive(TEXT_VIEWS, MockTextBase)
	derive(LEAVES, MockView)
	return core
}
