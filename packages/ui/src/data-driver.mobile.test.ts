import { expect, it, vi } from 'vitest'
import { createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Retained } from '../tests/data-lifecycle.fixture.mobile.tsrx'

// Only the NativeScript host objects are substituted. The installed driver,
// compiler output, scheduler, events, and visibility commands are real.
vi.mock('@nativescript/core', () => {
	class View {
		visibility = 'visible'
		parent: View | null = null
		text = ''
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
		View,
		LayoutBase,
		ContentView,
		TextBase,
		Button: TextBase,
		Label: TextBase,
		unsetValue: Symbol('unset'),
	}
})

it('NativeScript driver permits retained suspense and delivers native taps and uncaught errors', async () => {
	// A direct driver import bypasses the object-driver alias for the renderer
	// entry. This is the installed package that the mobile app actually uses.
	const { nativeScriptDriver, createNativeScriptContainer, releaseNativeScriptContainer } =
		await import('../node_modules/@nativescript-community/octane/dist/driver.js')

	const { LayoutBase } = await import('@nativescript/core')
	expect(nativeScriptDriver.capabilities.visibility).toBe(true)
	const host = new LayoutBase()
	const container = createNativeScriptContainer(host)
	const uncaught = vi.fn()
	const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
	const root = createUniversalRoot(container, nativeScriptDriver, { onUncaughtError: uncaught })
	container.root = root
	let resolve!: (value: string) => void
	const pending = new Promise<string>((done) => {
		resolve = done
	})

	const error = new Error('native handler failure')
	const fail = vi.fn(() => {
		throw error
	})

	try {
		root.render(Retained, { pending, fail })
		const body = (host as any).children[0]
		body.notify({ eventName: 'tap' })
		flushUniversalSync(() => {})
		expect((host as any).children[0]).toBe(body)
		expect(body.visibility).toBe('collapse')
		expect((host as any).children[1].text).toBe('pending')
		resolve('resolved')
		await vi.waitFor(() => expect(body.text).toBe('resolved'))
		expect(body.visibility).toBe('visible')

		;(host as any).children[1].notify({ eventName: 'tap' })
		expect(fail).toHaveBeenCalledOnce()
		expect(uncaught).toHaveBeenCalledWith(error)
		expect(warning).not.toHaveBeenCalled()
	} finally {
		root.unmount()
		releaseNativeScriptContainer(container)
		warning.mockRestore()
	}
})
