import { ContentView, LayoutBase, Property, type View } from '@nativescript/core'
import { registerElement } from '@nativescript-community/octane'
import { Microsoft, NSWinRT } from '@octane-xplat/platform/windows'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'

interface StripSettings {
	value: string
	layout: 'hug' | 'fill'
	label?: string
}

interface HeaderSettings {
	value: string
	label: string
	disabled: boolean
	request: () => void
}

declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		xplatwindowstabstrip: Attributes<TElement, { settings?: StripSettings }>
		xplatwindowstabheader: Attributes<TElement, { settings?: HeaderSettings }>
	}
}

type ChildView = Parameters<Parameters<View['eachChildView']>[0]>[0]

class WindowsTabHeader extends ContentView {
	declare settings: HeaderSettings | undefined
	owner?: WindowsTabStrip
	peer: any
}

/** Keep the NativeScript children alive in its logical tree while WinUI owns
 * their placement in Header/TabStripFooter slots. The Grid root is deliberate:
 * the pinned Windows bridge cannot directly activate TabView. */
class WindowsTabStrip extends LayoutBase {
	declare nativeViewProtected: any
	declare settings: StripSettings | undefined
	private tabs: any
	private footer: any
	private headers: WindowsTabHeader[] = []
	private extra: ChildView[] = []
	private writing = 0
	private selection: any
	private key: any
	private generation = 0
	private slotCount = 0
	private tearingDown = false
	private focusTask: ReturnType<typeof setTimeout> | undefined
	private selectionTask: ReturnType<typeof setTimeout> | undefined

	private logicalHeaders(exclude?: ChildView): WindowsTabHeader[] {
		const headers: WindowsTabHeader[] = []
		this.eachChildView((view) => {
			if (view !== exclude && view instanceof WindowsTabHeader) {
				headers.push(view)
			}
			return true
		})
		return headers
	}

	private createTabs(headers: WindowsTabHeader[]): any {
		// The pinned bridge fails at TabItems.InsertAt/Append, including stock
		// templates and string headers. XAML-created named items support rich
		// headers. Keep user text out of markup; set names through AutomationProperties.
		const items = headers
			.map(
				(_header, index) => `
<TabViewItem x:Name="XplatTab${index}" IsClosable="False" MinWidth="0" MinHeight="0" Padding="0">
 <TabViewItem.Template>
  <ControlTemplate TargetType="TabViewItem">
   <ContentPresenter x:Name="ContentPresenter" />
  </ControlTemplate>
 </TabViewItem.Template>
</TabViewItem>`,
			)
			.join('')
		this.slotCount = headers.length
		return Microsoft.UI.Xaml.Markup.XamlReader.Load(`
<TabView xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
 xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
 IsAddTabButtonVisible="False" CanDragTabs="False" CanReorderTabs="False"
 Padding="0" Background="Transparent" SelectedIndex="-1">
 <TabView.Resources>
  <x:Double x:Key="TabViewItemMinWidth">0</x:Double>
  <x:Double x:Key="TabViewItemMaxWidth">100000</x:Double>
 </TabView.Resources>
 ${items}
</TabView>`)
	}

	createNativeView(): any {
		const root = new Microsoft.UI.Xaml.Controls.Grid()
		this.tabs = this.createTabs(this.logicalHeaders())
		this.footer = new Microsoft.UI.Xaml.Controls.StackPanel()
		this.footer.Orientation = Microsoft.UI.Xaml.Controls.Orientation.Horizontal
		this.footer.HorizontalAlignment = Microsoft.UI.Xaml.HorizontalAlignment.Left
		root.Children.Append(this.tabs)
		return root
	}

	private attachHeader(header: WindowsTabHeader, headers: WindowsTabHeader[]): void {
		const index = headers.indexOf(header)
		const peer = this.tabs.FindName('XplatTab' + index)
		if (!peer) {
			throw new Error('Windows TabList could not resolve its native tab slot')
		}
		peer.Header = header.nativeViewProtected
		header.peer = peer
		header.owner = this
	}

	private rebuild(exclude?: ChildView, previousFocus?: WindowsTabHeader): void {
		const headers = this.logicalHeaders(exclude)
		const focused =
			previousFocus ??
			this.headers.find(
				(header) =>
					header.peer &&
					Number(header.peer.FocusState) !== Number(Microsoft.UI.Xaml.FocusState.Unfocused),
			)
		this.cancelFocusTask()
		this.stopListening()
		for (const header of this.headers) {
			if (header.peer) {
				header.peer.Header = null
			}
		}
		this.tabs.TabStripFooter = null
		this.nativeViewProtected.Children.Clear()
		this.tabs = this.createTabs(headers)
		if (this.extra.length) {
			this.tabs.TabStripFooter = this.footer
		}
		for (const header of this.headers) {
			this.attachHeader(header, headers)
		}
		this.nativeViewProtected.Children.Append(this.tabs)
		if (this.isLoaded) {
			this.listen()
		} else {
			this.refresh()
		}
		if (focused && this.isLoaded) {
			const target =
				this.headers.includes(focused) && !focused.settings?.disabled
					? focused
					: this.headers.find(
							(header) =>
								header.settings?.value === this.settings?.value && !header.settings?.disabled,
						)

			const tabs = this.tabs
			const generation = this.generation
			this.focusTask = setTimeout(() => {
				this.focusTask = undefined
				if (
					this.tabs !== tabs ||
					this.generation !== generation ||
					!this.isLoaded ||
					!target?.peer
				) {
					return
				}
				target.peer.IsTabStop = true
				target.peer.Focus(Microsoft.UI.Xaml.FocusState.Keyboard)
				this.restore()
			}, 0)
		}
	}

	private cancelFocusTask(): void {
		if (this.focusTask !== undefined) {
			clearTimeout(this.focusTask)
		}
		this.focusTask = undefined
	}

	onLoaded(): void {
		super.onLoaded()
		this.listen()
	}

	private listen(): void {
		this.stopListening()
		const tabs = this.tabs
		const generation = this.generation
		this.selection = NSWinRT.asDelegate(
			'Microsoft.UI.Xaml.Controls.SelectionChangedEventHandler',
			() => {
				if (
					this.tabs !== tabs ||
					this.generation !== generation ||
					this.writing ||
					!this.isLoaded
				) {
					return
				}
				const header = this.headers[Number(tabs.SelectedIndex)]
				try {
					if (header) {
						this.request(header)
					}
				} finally {
					// A rollback inside SelectionChanged can pump a render update
					// inside the native write, leaving index and item flags inconsistent.
					// Apply the latest controlled value after the native stack unwinds.
					this.settleSelection()
				}
			},
		)
		this.key = NSWinRT.asDelegate(
			'Microsoft.UI.Xaml.Input.KeyEventHandler',
			(_sender: unknown, args: any) => {
				if (
					this.tabs !== tabs ||
					this.generation !== generation ||
					!this.isLoaded ||
					args.Handled
				) {
					return
				}
				const key = Number(args.Key)
				if (![35, 36, 37, 39].includes(key) || args.KeyStatus?.IsMenuKeyDown) {
					return
				}
				const control =
					(Number(Microsoft.UI.Input.InputKeyboardSource.GetKeyStateForCurrentThread(17)) & 1) !== 0
				if (control) {
					return
				}
				const enabled = this.headers.filter((header) => !header.settings?.disabled)
				const focused = enabled.findIndex(
					(header) =>
						Number(header.peer.FocusState) !== Number(Microsoft.UI.Xaml.FocusState.Unfocused),
				)
				if (!enabled.length || focused < 0) {
					return
				}
				const backward = key === (Number(tabs.FlowDirection) === 1 ? 39 : 37)
				const index =
					key === 36
						? 0
						: key === 35
							? enabled.length - 1
							: (focused + (backward ? -1 : 1) + enabled.length) % enabled.length
				args.Handled = true
				const target = enabled[index]!
				// WinUI rejects Focus when IsTabStop is false. Restore the controlled
				// stop after requesting selection, even when the caller rejects it.
				target.peer.IsTabStop = true
				target.peer.Focus(Microsoft.UI.Xaml.FocusState.Keyboard)
				try {
					this.request(target)
				} finally {
					this.restore()
				}
			},
		)
		tabs.SelectionChanged = this.selection
		tabs.PreviewKeyDown = this.key
		this.refresh()
	}

	onUnloaded(): void {
		this.cancelFocusTask()
		this.stopListening()
		super.onUnloaded()
	}

	private stopListening(): void {
		this.generation++
		if (this.selectionTask !== undefined) {
			clearTimeout(this.selectionTask)
			this.selectionTask = undefined
		}
		if (this.tabs) {
			this.tabs.SelectionChanged = null
			this.tabs.PreviewKeyDown = null
		}
		this.selection = undefined
		this.key = undefined
	}

	private settleSelection(): void {
		if (this.selectionTask !== undefined) {
			clearTimeout(this.selectionTask)
		}
		const tabs = this.tabs
		const generation = this.generation
		this.selectionTask = setTimeout(() => {
			this.selectionTask = undefined
			if (this.tabs === tabs && this.generation === generation && this.isLoaded) {
				this.restore()
			}
		}, 0)
	}

	private hold(action: () => void): void {
		this.writing++
		if (this.tabs) {
			this.tabs.SelectionChanged = null
		}
		try {
			action()
		} finally {
			this.writing--
			if (this.tabs && !this.writing) {
				this.tabs.SelectionChanged = this.selection ?? null
			}
		}
	}

	private request(header: WindowsTabHeader): void {
		const settings = header.settings
		if (!settings || settings.disabled || !this.isEnabled) {
			return
		}
		if (settings.value !== this.settings?.value) {
			settings.request()
		}
	}

	restore(): void {
		if (!this.tabs) {
			return
		}
		this.hold(() => {
			const selected = this.headers.findIndex(
				(header) => header.settings?.value === this.settings?.value,
			)
			this.tabs.SelectedIndex = selected
			const stop =
				selected >= 0 && !this.headers[selected]!.settings?.disabled
					? selected
					: this.headers.findIndex((header) => !header.settings?.disabled)
			this.headers.forEach((header, index) => {
				header.peer.IsTabStop = index === stop
			})
		})
	}

	refresh(): void {
		if (!this.tabs) {
			return
		}
		this.hold(() => {
			Microsoft.UI.Xaml.Automation.AutomationProperties.SetName(
				this.tabs,
				this.settings?.label ?? 'Tabs',
			)
			this.tabs.TabWidthMode =
				this.settings?.layout === 'fill'
					? Microsoft.UI.Xaml.Controls.TabViewWidthMode.Equal
					: Microsoft.UI.Xaml.Controls.TabViewWidthMode.SizeToContent
			for (const header of this.headers) {
				header.peer.IsEnabled = !header.settings?.disabled
				Microsoft.UI.Xaml.Automation.AutomationProperties.SetName(
					header.peer,
					header.settings?.label ?? '',
				)

				Microsoft.UI.Xaml.Automation.AutomationProperties.SetAutomationId(
					header.peer,
					header.id ?? '',
				)
			}
			this.restore()
		})
	}

	private insertionSlot(child: ChildView, attached: ChildView[]): number {
		let index = 0
		this.eachChildView((view) => {
			if (view === child) {
				return false
			}
			if (attached.includes(view)) {
				index++
			}
			return true
		})
		return index
	}

	_addViewToNativeVisualTree(child: ChildView, _atIndex?: number): boolean {
		if (!this.tabs || !child.nativeViewProtected) {
			return false
		}
		if (child instanceof WindowsTabHeader) {
			this.headers.splice(this.insertionSlot(child, this.headers), 0, child)
			const headers = this.logicalHeaders()
			if (this.slotCount !== headers.length) {
				this.rebuild()
			} else {
				this.attachHeader(child, headers)
				this.refresh()
			}
		} else {
			const slot = this.insertionSlot(child, this.extra)
			this.footer.Children.InsertAt(slot, child.nativeViewProtected)
			this.extra.splice(slot, 0, child)
			if (this.extra.length === 1) {
				this.tabs.TabStripFooter = this.footer
			}
		}
		return true
	}

	_removeViewFromNativeVisualTree(child: ChildView): void {
		const index = this.headers.indexOf(child as WindowsTabHeader)
		if (index >= 0) {
			const header = this.headers.splice(index, 1)[0]!
			const focused =
				header.peer &&
				Number(header.peer.FocusState) !== Number(Microsoft.UI.Xaml.FocusState.Unfocused)
					? header
					: undefined

			if (header.peer) {
				header.peer.Header = null
			}

			header.peer = undefined
			header.owner = undefined
			if (this.tabs && !this.tearingDown) {
				this.rebuild(child, focused)
			}
		} else {
			const slot = this.extra.indexOf(child)
			if (slot >= 0) {
				this.extra.splice(slot, 1)
				this.footer.Children.RemoveAt(slot)
				if (!this.extra.length) {
					this.tabs.TabStripFooter = null
				}
			}
		}
		super._removeViewFromNativeVisualTree(child)
	}

	_tearDownUI(force?: boolean): void {
		this.tearingDown = true
		this.cancelFocusTask()
		this.stopListening()
		try {
			super._tearDownUI(force)
		} finally {
			this.tearingDown = false
		}
	}

	disposeNativeView(): void {
		this.cancelFocusTask()
		this.stopListening()
		this.footer?.Children.Clear()
		for (const header of this.headers) {
			header.peer.Header = null
			header.peer = undefined
			header.owner = undefined
		}
		this.headers = []
		this.extra = []
		this.tabs = undefined
		this.footer = undefined
		super.disposeNativeView()
	}
}

new Property<WindowsTabStrip, StripSettings | undefined>({
	name: 'settings',
	valueChanged: (view) => view.refresh(),
}).register(WindowsTabStrip)

new Property<WindowsTabHeader, HeaderSettings | undefined>({
	name: 'settings',
	valueChanged: (view) => view.owner?.refresh(),
}).register(WindowsTabHeader)

registerElement('xplatwindowstabstrip', WindowsTabStrip)
registerElement('xplatwindowstabheader', WindowsTabHeader)
