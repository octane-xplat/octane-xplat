import { Property, View } from '@nativescript/core'
import { Microsoft, NSWinRT } from '@octane-xplat/platform/windows'
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'

interface RadioSettings {
	group: WindowsRadioGroup
	value: string
}

declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		xplatwindowsradio: Attributes<TElement, { settings?: RadioSettings }>
	}
}

const settingsProperty = new Property<WindowsRadioControl, RadioSettings | undefined>({
	name: 'settings',
	valueChanged: (control, previous, settings) => control.configure(previous, settings),
})

let nextGroup = 0

class WindowsRadioControl extends View {
	declare nativeViewProtected: any
	declare settings: RadioSettings | undefined
	group!: WindowsRadioGroup
	option = ''
	configure(previous: RadioSettings | undefined, settings: RadioSettings | undefined): void {
		previous?.group.remove(this)
		if (!settings) {
			return
		}
		this.group = settings.group
		this.option = settings.value
		this.group.add(this)
		if (this.peer) {
			this.peer.GroupName = this.group.name
		}
		this.group.restore()
	}
	model = false
	private eventNative: any
	private checked: any
	private key: any
	private lost: any
	private press: any
	get peer(): any {
		return this.eventNative
	}

	createNativeView(): any {
		const native = new Microsoft.UI.Xaml.Controls.RadioButton()
		native.MinWidth = 0
		native.MinHeight = 0
		native.GroupName = this.group.name
		native.IsTabStop = this.option === this.group.focusValue
		native.Template = Microsoft.UI.Xaml.Markup.XamlReader.Load(
			'<ControlTemplate xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" TargetType="RadioButton"><Border Background="Transparent" /></ControlTemplate>',
		)
		native.IsChecked = this.model
		return native
	}
	initNativeView(): void {
		super.initNativeView()
		const native = this.nativeViewProtected
		this.eventNative = native
		this.checked = () => {
			if (
				this.eventNative !== native ||
				this.group.writing ||
				!this.isLoaded ||
				!this.isEnabled ||
				!native.IsEnabled ||
				this.model
			) {
				return
			}
			this.group.choose(this)
		}
		this.key = NSWinRT.asDelegate(
			'Microsoft.UI.Xaml.Input.KeyEventHandler',
			(_sender: unknown, args: any) => {
				if (
					this.eventNative !== native ||
					!this.isLoaded ||
					!this.isEnabled ||
					!native.IsEnabled ||
					args.Handled
				) {
					return
				}
				const key = Number(args.Key)
				if (![13, 35, 36, 37, 38, 39, 40].includes(key) || args.KeyStatus?.IsMenuKeyDown) {
					return
				}
				let control = false
				try {
					control =
						(Number(Microsoft.UI.Input.InputKeyboardSource.GetKeyStateForCurrentThread(17)) & 1) !==
						0
				} catch {
					return
				}
				if (control && [13, 35, 36].includes(key)) {
					return
				}
				args.Handled = true
				if (key === 13) {
					this.group.choose(this)
				} else {
					this.group.navigate(this, key, control)
				}
			},
		)
		this.lost = NSWinRT.asDelegate('Microsoft.UI.Xaml.RoutedEventHandler', () => {
			if (this.eventNative === native && !this.group.writing) {
				this.group.queueFocusReset()
			}
		})
		this.press = NSWinRT.asDelegate('Microsoft.UI.Xaml.Input.PointerEventHandler', () => {
			if (this.eventNative === native && this.isLoaded && this.isEnabled && native.IsEnabled) {
				this.group.focus(this, Microsoft.UI.Xaml.FocusState.Pointer)
			}
		})
		native.Checked = this.checked
		native.PreviewKeyDown = this.key
		native.LostFocus = this.lost
		native.PointerPressed = this.press
		this.group.add(this)
		this.group.restore()
	}
	listen(on: boolean): void {
		if (this.eventNative) {
			this.eventNative.Checked = on ? this.checked : null
		}
	}
	disposeNativeView(): void {
		this.group.cancelFocusReset()
		const native = this.eventNative
		this.eventNative = undefined
		if (native) {
			native.Checked = null
			native.PreviewKeyDown = null
			native.LostFocus = null
			native.PointerPressed = null
		}
		this.group.remove(this)
		super.disposeNativeView()
	}
}

export class WindowsRadioGroup {
	readonly name: string = `xplat-radio-${++nextGroup}`
	root: View | null = null
	readOnly = false
	disabled = false
	requestChange?: (value: string) => void
	controls: WindowsRadioControl[] = []
	selected: string | undefined
	focusValue: string | undefined
	writing = 0
	private focusTask: ReturnType<typeof setTimeout> | undefined
	add(view: WindowsRadioControl): void {
		if (!this.controls.includes(view)) {
			this.controls.push(view)
		}
	}
	remove(view: WindowsRadioControl): void {
		this.controls = this.controls.filter((item) => item !== view)
		this.restore()
	}
	update(
		selected: string | undefined,
		disabled: boolean,
		readOnly: boolean,
		requestChange: (value: string) => void,
	): void {
		if (selected !== this.selected) {
			this.focusValue = selected
		}
		this.selected = selected
		this.disabled = disabled
		this.readOnly = readOnly
		this.requestChange = requestChange
		this.restore()
	}
	ordered(): WindowsRadioControl[] {
		const result: WindowsRadioControl[] = []
		const visit = (view: Pick<View, 'eachChildView'>) => {
			if (this.controls.includes(view as WindowsRadioControl)) {
				result.push(view as WindowsRadioControl)
			}
			view.eachChildView((child) => {
				visit(child)
				return true
			})
		}
		if (this.root) {
			visit(this.root)
		}
		// Newly created peers may not yet be inserted into the model tree.
		return [...result, ...this.controls.filter((view) => !result.includes(view))]
	}

	hold(action: () => void): void {
		this.writing++
		for (const view of this.controls) {
			view.listen(false)
		}
		try {
			action()
		} finally {
			this.writing--
			if (!this.writing) {
				for (const view of this.controls) {
					view.listen(true)
				}
			}
		}
	}
	tabStops(): void {
		const enabled = this.ordered().filter(
			(view) => view.isEnabled && view.peer?.IsEnabled !== false,
		)
		const anchor =
			enabled.find((view) => view.option === this.focusValue) ??
			enabled.find((view) => view.option === this.selected) ??
			enabled[0]
		for (const view of this.controls) {
			if (view.peer) {
				view.peer.IsTabStop = !this.disabled && view === anchor
			}
		}
	}
	restore(): void {
		this.hold(() => {
			for (const view of this.controls) {
				view.model = view.option === this.selected
				if (view.peer) {
					view.peer.IsChecked = false
				}
			}
			for (const view of this.controls) {
				if (view.model && view.peer) {
					view.peer.IsChecked = true
				}
			}
			this.tabStops()
		})
	}
	choose(view: WindowsRadioControl): void {
		if (
			!view.isLoaded ||
			!view.isEnabled ||
			!view.peer?.IsEnabled ||
			view.option === this.selected
		) {
			return
		}
		// Native mutual exclusion may already have cleared the caller-selected peer.
		// Restore the whole group before requesting a caller-owned value change.
		this.restore()
		if (!this.disabled && !this.readOnly) {
			this.requestChange?.(view.option)
		}
	}
	focus(view: WindowsRadioControl, state: number): boolean {
		this.cancelFocusReset()
		let accepted = false
		this.hold(() => {
			this.focusValue = view.option
			// WinUI refuses Focus on a peer whose IsTabStop is false.
			this.tabStops()
			accepted = Boolean(view.peer.Focus(state))
			this.restore()
		})

		return accepted
	}
	navigate(from: WindowsRadioControl, key: number, control: boolean): void {
		const enabled = this.ordered().filter(
			(view) => view.isLoaded && view.isEnabled && view.peer?.IsEnabled,
		)
		const index = enabled.indexOf(from)
		const rtl = Number(from.peer?.FlowDirection) === 1
		const delta = key === 38 || key === (rtl ? 39 : 37) ? -1 : 1
		const targetIndex =
			key === 36
				? 0
				: key === 35
					? enabled.length - 1
					: Math.max(0, Math.min(enabled.length - 1, index + delta))
		const target = enabled[targetIndex]
		if (!target || !this.focus(target, Microsoft.UI.Xaml.FocusState.Keyboard)) {
			return
		}
		if (!control) {
			this.choose(target)
		}
	}
	cancelFocusReset(): void {
		if (this.focusTask !== undefined) {
			clearTimeout(this.focusTask)
		}
		this.focusTask = undefined
	}
	queueFocusReset(): void {
		this.cancelFocusReset()
		this.focusTask = setTimeout(() => {
			this.focusTask = undefined
			if (!this.controls.some((view) => view.peer && Number(view.peer.FocusState) > 0)) {
				this.focusValue = this.selected
				this.hold(() => this.tabStops())
			}
		}, 0)
	}
}

settingsProperty.register(WindowsRadioControl)
registerElement('xplatwindowsradio', WindowsRadioControl)
