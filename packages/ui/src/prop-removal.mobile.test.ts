import { expect, it, vi } from 'vitest'
import { createUniversalRoot, flushUniversalSync } from 'octane/universal/native'

// Native hosts are substituted; the installed driver, compiler output, and
// update commands are real. Registered accessors consume NativeScript's reset
// sentinel, while ordinary fields retain their constructor values.
vi.mock('@nativescript/core/ui/core/properties', async () => vi.importMock('@nativescript/core'))

vi.mock('@nativescript/core', () => {
	const unsetValue = Symbol('unset')
	class View {
		visibility = 'visible'
		parent: View | null = null
		#text = ''
		#className = ''
		#width: unknown = 'auto'
		#localWidth = false
		#ordinary = 'constructor default'
		get ordinary() {
			return this.#ordinary
		}
		set ordinary(value: any) {
			if (value === unsetValue) {
				throw new Error('ordinary setter cannot consume unsetValue')
			}
			this.#ordinary = value
		}
		writes: unknown[] = []
		style: Record<string, unknown> = { customField: 'style default' }
		variables = new Map<string, unknown>()
		constructor() {
			Object.defineProperty(this.style, 'width', {
				get: () => this.#width,
				set: (value: unknown) => {
					this.writes.push(['width', value])
					this.#localWidth = value !== unsetValue
					this.#width = value === unsetValue ? 'auto' : value
				},
			})
			this.style.removeUnscopedCssVariable = (key: string) => this.variables.delete(key)
			this.style.setUnscopedCssVariable = (key: string, value: unknown) => {
				if (value === unsetValue) {
					this.variables.delete(key)
				} else {
					this.variables.set(key, value)
				}
			}
		}
		_cssState = {
			onChange: () => {
				if (!this.#localWidth) {
					this.#width = this.#className === 'accent' ? 80 : 'auto'
				}
			},
		}
		get text() {
			return this.#text
		}
		set text(value: any) {
			this.writes.push(['text', value])
			this.#text = value === unsetValue ? '' : value
			this.notify({ eventName: 'textChange', value: this.#text } as any)
		}
		get className() {
			return this.#className
		}
		set className(value: any) {
			this.writes.push(['className', value])
			this.#className = value === unsetValue ? '' : value
			this._cssState.onChange()
		}
		setInlineStyle(css: string) {
			for (const declaration of css.split(';')) {
				const [key, raw] = declaration.split(':').map((part) => part.trim())
				if (key && raw !== undefined) {
					if (key.startsWith('--')) {
						this.variables.set(key, raw)
					} else {
						this.style[key] = /^\d+$/.test(raw) ? Number(raw) : raw
					}
				}
			}
		}
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
		StackLayout: LayoutBase,
		FlexboxLayout: LayoutBase,
		Button: TextBase,
		Label: TextBase,
		unsetValue,
		_getProperties: () => [
			{
				name: 'text',
				set: Object.getOwnPropertyDescriptor(View.prototype, 'text')!.set,
			},
		],
		_getStyleProperties: () => [{ name: 'width', cssName: 'width' }],
	}
})

async function mount(props: Record<string, unknown>) {
	const { PropRemoval } = await import('../tests/prop-removal.fixture.mobile.tsrx')
	const { nativeScriptDriver, createNativeScriptContainer, releaseNativeScriptContainer } =
		await import('../node_modules/@nativescript-community/octane/dist/driver.js')

	const { LayoutBase } = await import('@nativescript/core')
	const host: any = new LayoutBase()
	const container = createNativeScriptContainer(host)
	const root = createUniversalRoot(container, nativeScriptDriver)
	container.root = root
	root.render(PropRemoval, props)
	const label = (host.children[0] as any).children[0]
	return {
		host,
		label,
		container,
		driver: nativeScriptDriver,
		rerender: (next: Record<string, unknown>) =>
			flushUniversalSync(() => root.render(PropRemoval, next)),
		release: () => {
			root.unmount()
			releaseNativeScriptContainer(container)
		},
	}
}

it('restores a dropped prop to the value the view held before it applied', async () => {
	const { label, rerender, release } = await mount({ text: 'packed' })
	expect(label.text).toBe('packed')

	rerender({})
	expect(label.text).toBe('')
	expect(label.id).toBe('target')
	release()
})

it('treats undefined and null as removal on native drivers', async () => {
	const { label, rerender, release } = await mount({ text: 'packed' })
	rerender({ text: undefined })
	expect(label.text).toBe('')

	rerender({ text: 'again' })
	expect(label.text).toBe('again')
	rerender({ text: null })
	expect(label.text).toBe('')
	release()
})

it('clears className and diffs removed style keys', async () => {
	const { label, rerender, release } = await mount({
		className: 'accent',
		style: { color: 'red', fontSize: 20 },
	})

	expect(label.className).toBe('accent')
	expect(label.style.color).toBe('red')

	// Dropping one style key resets only that key.
	rerender({ className: 'accent', style: { fontSize: 20 } })
	expect(label.style.color).toBeUndefined()
	expect(label.style.fontSize).toBe(20)

	// Dropping the whole style prop clears the rest.
	rerender({ className: 'accent' })
	expect(label.style.fontSize).toBeUndefined()

	rerender({})
	expect(label.className).toBe('')
	release()
})

it('does not invoke setters for never-applied undefined props', async () => {
	const { label, rerender, release } = await mount({})
	expect(label.writes).toEqual([])
	rerender({ text: undefined, className: undefined })
	expect(label.writes).toEqual([])
	release()
})

it('restores matching CSS after inline object and string overrides are removed', async () => {
	const { label, rerender, release } = await mount({
		className: 'accent',
		style: { width: 120 },
	})
	expect(label.style.width).toBe(120)
	rerender({ className: 'accent', style: {} })
	expect(label.style.width).toBe(80)
	rerender({ className: 'accent', style: 'width: 140; color: red' })
	expect(label.style.width).toBe(140)
	rerender({ className: 'accent', style: { width: 160 } })
	expect(label.style.color).toBeUndefined()
	expect(label.style.width).toBe(160)
	rerender({ className: 'accent' })
	expect(label.style.width).toBe(80)
	rerender({})
	expect(label.style.width).toBe('auto')
	release()
})

it('restores captured ordinary style defaults', async () => {
	const { label, rerender, release } = await mount({
		style: { customField: 'authored' },
	})
	rerender({ style: { customField: undefined } })
	expect(label.style.customField).toBe('style default')
	rerender({ style: { customField: 'again' } })
	rerender({})
	expect(label.style.customField).toBe('style default')
	release()
})

it('resets registered props without echoing a native edit event', async () => {
	const { label, container, driver, release } = await mount({
		text: 'authored',
	})
	const node = [...container.nodes.values()].find((entry: any) => entry.view === label) as any
	const dispatched: unknown[] = []
	const originalRoot = container.root
	container.root = {
		eventScope: (_priority: unknown, run: () => unknown) => run(),
		dispatchEvent: (_id: number, data: unknown) => dispatched.push(data),
	} as any
	const apply = (commands: any[]) =>
		driver
			.prepareBatch(container, { renderer: 'nativescript', version: 1, commands }, {} as never)
			.apply()
	apply([
		{
			op: 'event',
			id: node.id,
			type: 'textChange',
			listener: { id: 1, priority: 'discrete' },
		},
		{ op: 'update', id: node.id, props: { ordinary: 'authored' } },
	])
	expect(label.text).toBe('')
	expect(dispatched).toEqual([])
	apply([{ op: 'update', id: node.id, props: {} }])
	expect(label.ordinary).toBe('constructor default')
	label.text = 'user edit'
	expect(dispatched).toEqual([expect.objectContaining({ value: 'user edit' })])
	container.root = originalRoot
	release()
})

it('removes authored CSS variables when the inline string is removed', async () => {
	const { label, rerender, release } = await mount({ style: '--accent: red; width: 120' })
	expect(label.variables.get('--accent')).toBe('red')
	rerender({ style: { width: 140 } })
	expect(label.variables.has('--accent')).toBe(false)
	expect(label.style.width).toBe(140)
	release()
})
