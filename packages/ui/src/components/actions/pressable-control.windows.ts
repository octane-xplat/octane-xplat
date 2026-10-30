import { Property, TextBase, View } from '@nativescript/core'
import { Microsoft, NSWinRT } from '@octane-xplat/platform/windows'
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'

interface ActionSettings {
	label?: string
	accessible?: boolean
	onPress?: () => void
}

declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		xplatwindowsbutton: Attributes<TElement, { settings?: ActionSettings }>
		xplatwindowslink: Attributes<TElement, { settings?: ActionSettings }>
	}
}

const settingsProperty = new Property<WindowsActionControl, ActionSettings | undefined>({
	name: 'settings',
	valueChanged: (control) => control.syncAccessibility(),
})

/** WinUI owns keyboard, pointer and Invoke activation. The Mason parent draws
 * the content; this transparent peer covers its measured frame. */
class WindowsActionControl extends View {
	declare nativeViewProtected: any
	declare settings: ActionSettings | undefined
	protected kind: 'Button' | 'HyperlinkButton' = 'Button'
	private eventNative: any
	private click: any
	private layoutDelegate: any

	createNativeView(): any {
		const native = new Microsoft.UI.Xaml.Controls[this.kind]()
		native.MinWidth = 0
		native.MinHeight = 0
		native.Template = Microsoft.UI.Xaml.Markup.XamlReader.Load(
			`<ControlTemplate xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" TargetType="${this.kind}"><Border Background="Transparent" /></ControlTemplate>`,
		)
		return native
	}

	initNativeView(): void {
		super.initNativeView()
		const native = this.nativeViewProtected
		this.eventNative = native
		this.click = NSWinRT.asDelegate('Microsoft.UI.Xaml.RoutedEventHandler', () => {
			if (this.eventNative === native && this.isLoaded && this.isEnabled && native.IsEnabled) {
				this.settings?.onPress?.()
			}
		})
		this.layoutDelegate = NSWinRT.asDelegate('Windows.Foundation.EventHandler`1<Object>', () => {
			if (this.eventNative === native && this.isLoaded) {
				this.syncAccessibility()
			}
		})
		native.Click = this.click
		native.LayoutUpdated = this.layoutDelegate
		this.syncAccessibility()
	}

	syncAccessibility(): void {
		const native = this.eventNative
		if (!native) {
			return
		}

		// Content is drawn outside the peer's template. Collect its live text so
		// ordinary Button/Link children still supply their implicit name.
		const parts: string[] = []
		const visit = (view: View) => {
			if (view === this || view.accessible === false) {
				return
			}
			if (view.accessibilityLabel) {
				parts.push(view.accessibilityLabel)
			} else if (view instanceof TextBase) {
				if (view.text != null) {
					parts.push(String(view.text))
				}
			} else {
				view.eachChildView((child) => {
					visit(child)
					return true
				})
			}
		}
		if (this.settings?.label === undefined && this.parent instanceof View) {
			this.parent.eachChildView((child) => {
				visit(child)
				return true
			})
		}
		const label = this.settings?.label ?? parts.join(' ').trim()
		if (this.accessibilityLabel !== label) {
			this.accessibilityLabel = label
		}
		// Gesture-only Pressables do not add a keyboard stop, matching the web leaf.
		const tabStop = Boolean(this.settings?.onPress) && this.settings?.accessible !== false
		if (native.IsTabStop !== tabStop) {
			native.IsTabStop = tabStop
		}
	}

	disposeNativeView(): void {
		const native = this.eventNative
		this.eventNative = undefined
		if (native) {
			native.Click = null
			native.LayoutUpdated = null
		}
		this.click = undefined
		this.layoutDelegate = undefined
		super.disposeNativeView()
	}
}

class WindowsLinkControl extends WindowsActionControl {
	protected kind = 'HyperlinkButton' as const
}

settingsProperty.register(WindowsActionControl)
registerElement('xplatwindowsbutton', WindowsActionControl)
registerElement('xplatwindowslink', WindowsLinkControl)
