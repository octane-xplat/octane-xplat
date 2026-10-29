import { Property, View } from '@nativescript/core'
import { registerElement } from '@nativescript-community/octane'
import { Microsoft, NSWinRT } from '@octane-xplat/platform/windows'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'

interface SliderSettings {
	value: number
	min: number
	max: number
	increment: number
	page: number
	readOnly: boolean
}

declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		xplatwindowsslider: Attributes<
			TElement,
			{
				settings?: SliderSettings
				requestChange?: (value: number) => void
			}
		>
	}
}

const defaults: SliderSettings = {
	value: 0,
	min: 0,
	max: 100,
	increment: 1,
	page: 10,
	readOnly: false,
}

const settingsProperty = new Property<WindowsSliderControl, SliderSettings>({
	name: 'settings',
	defaultValue: defaults,
	valueChanged: (control, _previous, settings) => control.applySettings(settings),
})

/** Hit-test-excluded peers need explicit focus when the shared track receives a press. */
export function focusSliderInput(view: View | null) {
	if (!view?.isLoaded || !view.isEnabled || view.nativeViewProtected?.IsEnabled === false) {
		return false
	}

	return Boolean(view.nativeViewProtected?.Focus(Microsoft.UI.Xaml.FocusState.Pointer))
}

/** Keep a later focus target, including when the preview's FocusManager returns null. */
function hasOtherSliderFocus(view: View, native: any, owner: any): boolean {
	const ancestors = new Set<any>()
	let root = view
	for (let parent = view.parent; parent instanceof View; parent = parent.parent) {
		ancestors.add(parent.nativeViewProtected)
		root = parent
	}

	const isOther = (current: any) =>
		current && current !== native && !(ancestors.has(current) && current.IsTabStop === false)
	try {
		const manager = Microsoft.UI.Xaml.Input.FocusManager
		const current =
			typeof manager.GetFocusedElementWithRoot === 'function'
				? manager.GetFocusedElementWithRoot(owner)
				: manager.GetFocusedElement(owner)

		if (current) {
			return Boolean(isOther(current))
		}
	} catch {
		// This preview's reader can fail even while native Control.FocusState is set.
	}

	let found = false
	const visit = (current: Pick<View, 'nativeViewProtected' | 'eachChildView'>) => {
		const peer = current.nativeViewProtected
		try {
			if (peer?.XamlRoot === owner && Number(peer.FocusState) > 0 && isOther(peer)) {
				found = true
				return
			}
		} catch {
			// Layout peers need not expose Control.FocusState; inspect their children.
		}
		current.eachChildView?.((child) => {
			visit(child)
			return !found
		})
	}
	visit(root)
	return found
}

/** Restore the input peer after this host's pointer-release focus reset. */
export function queueSliderInputFocus(view: View | null): () => void {
	const native = view?.nativeViewProtected
	const owner = native?.XamlRoot
	let active = true
	let task: ReturnType<typeof setTimeout> | undefined
	const cancel = () => {
		active = false
		if (task !== undefined) {
			clearTimeout(task)
		}
	}
	if (!view?.isLoaded || !view.isEnabled || native?.IsEnabled === false || !owner) {
		return cancel
	}

	// Core's UI dispatch runs inline here; a native timer task returns after release cleanup.
	// A JS DispatcherQueueHandler is rejected by this preview's IAgileObject projection.
	task = setTimeout(() => {
		if (!active || view.nativeViewProtected !== native || native.XamlRoot !== owner) {
			return
		}

		active = false
		if (!hasOtherSliderFocus(view, native, owner)) {
			focusSliderInput(view)
		}
	}, 0)
	return cancel
}

/** WinUI supplies keyboard/RangeValue behavior; the shared Mason host draws and owns pan. */
class WindowsSliderControl extends View {
	declare settings: SliderSettings
	declare nativeViewProtected: any
	requestChange?: (value: number) => void
	private eventNative: any
	private delegate: any
	private writing = 0

	createNativeView() {
		const native = new Microsoft.UI.Xaml.Controls.Slider()
		native.MinWidth = 0
		native.MinHeight = 0
		native.IsHitTestVisible = false
		native.Template = Microsoft.UI.Xaml.Markup.XamlReader.Load(
			'<ControlTemplate xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" TargetType="Slider"><Border Background="Transparent" /></ControlTemplate>',
		)
		this.writeSettings(native, this.settings)
		return native
	}

	initNativeView() {
		super.initNativeView()
		const native = this.nativeViewProtected
		this.eventNative = native
		this.writeSettings(native, this.settings)
		this.delegate = NSWinRT.asDelegate(
			'Microsoft.UI.Xaml.Controls.Primitives.RangeBaseValueChangedEventHandler',
			() => {
				if (this.eventNative !== native || this.writing) {
					return
				}

				const next = Number(native.Value)
				if (next === this.settings.value) {
					return
				}

				// Restore the caller's model before requesting a change, including rejected writes.
				this.writeSettings(native, this.settings)
				if (this.isLoaded && this.isEnabled && native.IsEnabled && !this.settings.readOnly) {
					this.requestChange?.(next)
				}
			},
		)
		native.ValueChanged = this.delegate
	}

	disposeNativeView() {
		const native = this.eventNative
		this.eventNative = undefined
		this.delegate = undefined
		if (native) {
			native.ValueChanged = null
		}

		super.disposeNativeView()
	}

	private writeSettings(native: any, settings: SliderSettings) {
		const delegate = this.eventNative === native ? this.delegate : undefined
		this.writing++
		try {
			if (delegate) {
				native.ValueChanged = null
			}

			// Expand first so a disjoint bounds update never creates Minimum > Maximum.
			native.Minimum = Math.min(Number(native.Minimum), settings.min)
			native.Maximum = Math.max(Number(native.Maximum), settings.max)
			native.Minimum = settings.min
			native.Maximum = settings.max
			const increment = settings.increment
			native.SmallChange = increment
			native.LargeChange = settings.page
			native.StepFrequency = increment
			native.Value = settings.value
		} finally {
			try {
				if (delegate && this.eventNative === native && this.delegate === delegate) {
					native.ValueChanged = delegate
				}
			} finally {
				this.writing--
			}
		}
	}

	applySettings(settings: SliderSettings) {
		const native = this.nativeViewProtected
		if (native && this.eventNative === native) {
			this.writeSettings(native, settings)
		}
	}
}

settingsProperty.register(WindowsSliderControl)
registerElement('xplatwindowsslider', WindowsSliderControl)
