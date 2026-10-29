import { Property, View } from '@nativescript/core'
import { registerElement } from '@nativescript-community/octane'
import { Microsoft } from '@octane-xplat/platform/windows'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'

declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		xplatwindowstoggle: Attributes<
			TElement,
			{
				checked?: boolean
				readOnly?: boolean
				requestChange?: (checked: boolean) => void
			}
		>
	}
}

const checkedProperty = new Property<WindowsToggleControl, boolean>({
	name: 'checked',
	defaultValue: false,
})

/** A transparent native input over the shared Switch's drawn track. */
class WindowsToggleControl extends View {
	declare checked: boolean
	declare nativeViewProtected: any
	readOnly = false
	requestChange?: (checked: boolean) => void
	private eventNative: any
	private eventHandlers?: { checked: () => void; unchecked: () => void }
	private writing = 0

	createNativeView() {
		const native = new Microsoft.UI.Xaml.Controls.Primitives.ToggleButton()
		native.Template = Microsoft.UI.Xaml.Markup.XamlReader.Load(
			'<ControlTemplate xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" TargetType="ToggleButton"><Border Background="Transparent" /></ControlTemplate>',
		)
		native.IsThreeState = false
		native.IsChecked = this.checked
		return native
	}

	initNativeView() {
		super.initNativeView()
		const native = this.nativeViewProtected
		this.eventNative = native
		const changed = (next: boolean) => {
			if (this.eventNative !== native || this.writing || next === this.checked) {
				return
			}

			// IsChecked projects as IReference<Boolean> in the Windows preview.
			// The two native events carry the state without treating that object as a bool.
			this.writeChecked(this.checked)
			if (this.isEnabled && native.IsEnabled && !this.readOnly) {
				this.requestChange?.(next)
			}
		}

		this.eventHandlers = { checked: () => changed(true), unchecked: () => changed(false) }
		native.Checked = this.eventHandlers.checked
		native.Unchecked = this.eventHandlers.unchecked
	}

	disposeNativeView() {
		const native = this.eventNative
		this.eventNative = undefined
		this.eventHandlers = undefined
		if (native) {
			native.Checked = null
			native.Unchecked = null
		}

		super.disposeNativeView()
	}

	private writeChecked(value: boolean) {
		const native = this.nativeViewProtected
		const handlers = this.eventNative === native ? this.eventHandlers : undefined
		this.writing++
		try {
			// Avoid entering JS through synchronous native events during a host prop write.
			// User/automation events remain subscribed outside this owned write.
			if (handlers) {
				native.Checked = null
				native.Unchecked = null
			}

			native.IsChecked = value
		} finally {
			try {
				if (handlers && this.eventNative === native && this.eventHandlers === handlers) {
					native.Checked = handlers.checked
					native.Unchecked = handlers.unchecked
				}
			} finally {
				this.writing--
			}
		}
	}

	[checkedProperty.setNative](value: boolean) {
		this.writeChecked(value)
	}
}

checkedProperty.register(WindowsToggleControl)
registerElement('xplatwindowstoggle', WindowsToggleControl)
