import { expect, it, vi } from 'vitest'
import { createUniversalRoot, flushUniversalSync } from 'octane/universal/native'

// Only the NativeScript host objects are substituted — a plain `View` field
// plays the part of a non-Property prop, so the driver's sentinel round-trip
// repair is exercised. The installed driver, compiler output, and update
// commands are real.
vi.mock('@nativescript/core', () => {
	class View {
		visibility = 'visible'
		parent: View | null = null
		text = ''
		className = ''
		style: Record<string, unknown> = {}
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
		unsetValue: Symbol('unset'),
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
	root.render(PropRemoval as any, props)
	const label = (host.children[0] as any).children[0]
	return {
		host,
		label,
		rerender: (next: Record<string, unknown>) =>
			flushUniversalSync(() => root.render(PropRemoval as any, next)),
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
	const { unsetValue } = await import('@nativescript/core')
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

	// A dropped className resets through the Property sentinel — a real
	// NativeScript view consumes `unsetValue`; the mock keeps the write
	// observable.
	rerender({})
	expect(label.className).toBe(unsetValue)
	release()
})
