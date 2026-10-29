import { Property, View } from '@nativescript/core'
import { registerElement } from '@nativescript-community/octane'
import { Microsoft } from '@octane-xplat/platform/windows'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'

declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		xplatwindowscheckbox: Attributes<
			TElement,
			{
				checked?: boolean | 'indeterminate'
				readOnly?: boolean
				requestChange?: (checked: boolean) => void
			}
		>
	}
}

const checkedProperty = new Property<WindowsCheckboxControl, boolean | 'indeterminate'>({
	name: 'checked',
	defaultValue: false,
})

/** A transparent native input over the shared checkbox's drawn row. */
class WindowsCheckboxControl extends View {
	declare checked: boolean | 'indeterminate'
	declare nativeViewProtected: any
	readOnly = false
	requestChange?: (checked: boolean) => void
	private eventNative: any
	private eventHandlers?: { checked: () => void; unchecked: () => void }
	private writing = 0

	createNativeView() {
		const native = new Microsoft.UI.Xaml.Controls.CheckBox()
		native.MinWidth = 0
		native.MinHeight = 0
		native.Template = Microsoft.UI.Xaml.Markup.XamlReader.Load(
			'<ControlTemplate xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" TargetType="CheckBox"><Border Background="Transparent" /></ControlTemplate>',
		)
		// Mixed reporting needs three-state enabled; ordinary activation stays binary.
		native.IsThreeState = this.checked === 'indeterminate'
		this.writeNativeState(native, this.checked)
		return native
	}

	initNativeView() {
		super.initNativeView()
		const native = this.nativeViewProtected
		this.eventNative = native
		const changed = (nativeState: boolean) => {
			// Leaving mixed state always requests true, independent of WinUI's native cycle.
			const next = this.checked === 'indeterminate' ? true : nativeState
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

	private writeChecked(value: boolean | 'indeterminate') {
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

			this.writeNativeState(native, value)
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

	private writeNativeState(native: any, value: boolean | 'indeterminate') {
		native.IsThreeState = value === 'indeterminate'
		if (value === 'indeterminate') {
			// Direct nullable writes failed native mixed-state checks in the preview.
			// Use the dependency-property route to pass null without Boolean boxing.
			native.SetValue(Microsoft.UI.Xaml.Controls.Primitives.ToggleButton.IsCheckedProperty, null)
		} else {
			native.IsChecked = value
		}
	}

	[checkedProperty.setNative](value: boolean | 'indeterminate') {
		this.writeChecked(value)
	}
}

checkedProperty.register(WindowsCheckboxControl)
registerElement('xplatwindowscheckbox', WindowsCheckboxControl)
