import { ContentView, LayoutBase, Property, type View } from '@nativescript/core'
import { registerElement } from '@nativescript-community/octane'
import { Microsoft, NSWinRT } from '@octane-xplat/platform/windows'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'
import { reportActionError } from '../../internal/rendering/action-error'

interface MenuSettings {
	open: boolean
	blocked: boolean
	label: string
	onOpenChange(open: boolean): void
}

interface ItemSettings {
	label: string
	disabled: boolean
	onSelect?: () => void
}

declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		xplatwindowsmenu: Attributes<TElement, { settings?: MenuSettings }>
		xplatwindowsmenuitem: Attributes<TElement, { settings?: ItemSettings }>
	}
}

type ChildView = Parameters<Parameters<View['eachChildView']>[0]>[0]

class WindowsMenuItem extends ContentView {
	declare settings: ItemSettings | undefined
	owner?: WindowsMenuControl
	peer: any
}

/** A measured Microsoft Grid anchors an in-window overlay hosting a
 * MenuFlyoutPresenter with genuine MenuFlyoutItem peers. Every real popup
 * surface on the pinned runtime (MenuFlyout or Primitives.Popup) reports its
 * content under an offscreen Popup that no OS pointer press can reach, so
 * the menu renders inside the window's own content — the ComboBox popup
 * pattern — behind a transparent backdrop that owns outside dismissal.
 * The shared Button owns trigger activation and the caller owns open state. */
class WindowsMenuControl extends LayoutBase {
	declare nativeViewProtected: any
	declare settings: MenuSettings | undefined
	private canvas: any
	private slots: any
	private host: any
	private items: WindowsMenuItem[] = []
	private slotCount = 0
	private presenterId = ''
	private generation = 0
	private writing = 0
	private receiving = 0
	private popupOpen = false
	private tearingDown = false
	private keyDown: any
	private tapped: any
	private layoutDelegate: any
	private clicks: any[] = []
	private minWidthAccessor: PropertyDescriptor | undefined
	private restoreFocus: any
	private settleTask: ReturnType<typeof setTimeout> | undefined
	private focusTask: ReturnType<typeof setTimeout> | undefined
	private reportReceiver: (() => ((open: boolean) => void) | undefined) | undefined

	private diag(stage: string, error: unknown): void {
		console.error('[xplat-menu] ' + stage + ' failed', error)
		try {
			Microsoft.UI.Xaml.Automation.AutomationProperties.SetName(
				this.nativeViewProtected,
				'XPLAT-MENU-' + stage + ':' + String(error).slice(0, 120),
			)
		} catch {}
	}

	private logicalItems(exclude?: ChildView): WindowsMenuItem[] {
		const items: WindowsMenuItem[] = []
		this.eachChildView((view) => {
			if (view !== exclude && view instanceof WindowsMenuItem) {
				items.push(view)
			}
			return true
		})
		return items
	}

	private createSlots(items: WindowsMenuItem[]): any {
		this.presenterId = `XplatMenu${this._domId}_${++this.generation}`
		this.slotCount = items.length
		const slots = items
			.map(
				(_item, index) => `
<MenuFlyoutItem x:Name="XplatItem${index}" MinHeight="32" Padding="0" IsTabStop="False"
 HorizontalContentAlignment="Stretch" VerticalContentAlignment="Stretch">
 <MenuFlyoutItem.Template>
  <ControlTemplate TargetType="MenuFlyoutItem">
   <Grid x:Name="LayoutRoot" Background="Transparent" Control.IsTemplateFocusTarget="True">
    <ContentPresenter Content="{TemplateBinding Tag}" IsHitTestVisible="False"
     HorizontalAlignment="Stretch" VerticalAlignment="Stretch" />
   </Grid>
  </ControlTemplate>
 </MenuFlyoutItem.Template>
</MenuFlyoutItem>`,
			)
			.join('')
		// Only framework-generated identifiers enter markup. Labels and callbacks
		// stay in properties; named slots avoid collection-insertion failures.
		return Microsoft.UI.Xaml.Markup.XamlReader.Load(`
<Canvas xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
 xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
 <Grid x:Name="XplatDismiss" Background="Transparent" />
 <MenuFlyoutPresenter x:Name="XplatPresenter" IsTabStop="False">
  ${slots}
 </MenuFlyoutPresenter>
</Canvas>`)
	}

	private findAccessor(target: any, key: string): PropertyDescriptor {
		let owner: any = target,
			descriptor: PropertyDescriptor | undefined
		while (owner && !descriptor) {
			descriptor = Object.getOwnPropertyDescriptor(owner, key)
			owner = Object.getPrototypeOf(owner)
		}
		if (!descriptor?.get || !descriptor.set) {
			throw new Error('Windows menu requires projected framework accessors: ' + key)
		}
		return descriptor
	}

	createNativeView(): any {
		// XamlReader returns base wrappers without typed framework accessors.
		// Keep the loaded namescope for slots and a constructed Grid for layout.
		const root = new Microsoft.UI.Xaml.Controls.Grid()
		this.slots = this.createSlots(this.logicalItems())
		this.canvas = this.slots
		this.minWidthAccessor = this.findAccessor(root, 'MinWidth')
		return root
	}

	private setItemVisibility(item: WindowsMenuItem, visible: boolean): void {
		try {
			item.visibility = visible ? 'visible' : 'collapse'
		} catch (error) {
			this.diag('visibility', error)
		}
	}

	private presenter(): any {
		return this.slots.FindName('XplatPresenter')
	}

	private dismiss(): any {
		return this.slots.FindName('XplatDismiss')
	}

	private childCollection(container: any): any {
		return container?.Children
	}

	private findHostPanel(): any {
		if (this.host) {
			return this.host
		}
		// The app content lives in a composition island that composites above
		// the XAML tree. The deepest ancestor panel of the anchor is the {N}
		// page root — the topmost element inside the island — so the overlay
		// mounts there and renders above the island's content.
		try {
			const tree = Microsoft.UI.Xaml.Media.VisualTreeHelper
			let node: any = this.nativeViewProtected
			let host: any
			for (let depth = 0; depth < 24 && node; depth++) {
				const children = this.childCollection(node)
				if (children && typeof children.Append === 'function') {
					host = node
				}
				let parent
				try {
					parent = tree.GetParent(node)
				} catch {
					parent = undefined
				}
				if (!parent) {
					break
				}
				node = parent
			}
			if (host) {
				this.host = host
				return host
			}
		} catch {}
		return undefined
	}

	private show(): void {
		const host = this.findHostPanel()
		if (!host || this.popupOpen) {
			return
		}
		try {
			const xamlRoot = this.nativeViewProtected.XamlRoot
			const size = xamlRoot.Size
			this.canvas.Width = Number(size.Width)
			this.canvas.Height = Number(size.Height)
			const dismiss = this.dismiss()
			this.minWidthAccessor!.set!.call(dismiss, Number(size.Width))
			this.minHeightSet(dismiss, Number(size.Height))
			const location = this.anchorLocation(host)
			const canvasStatics = Microsoft.UI.Xaml.Controls.Canvas
			canvasStatics.SetLeft(this.presenter(), location.x)
			canvasStatics.SetTop(this.presenter(), location.y)
			// {N}-managed children inside the island accept pointer input; each
			// item view gets an absolute frame on its MenuItem peer's row. The
			// anchor Grid does not clip, so rows render below the trigger.
			try {
				const topLeft = this.nativeViewProtected
					.TransformToVisual(host)
					.TransformPoint({ X: 0, Y: 0 })
				const anchorX = Number(topLeft.X)
				const anchorY = Number(topLeft.Y)
				const width =
					Number(this.nativeViewProtected.ActualWidth) ||
					Number(this.getMeasuredWidth?.()) ||
					0
				this.items.forEach((item, index) => {
					// left/top are dropped by the Windows CSS parser; the
					// absolute frame comes from explicit size + translate. Raw
					// native props backstop custom elements whose style
					// plumbing does not reach the native.
					const offsetX = location.x - anchorX
					const offsetY = location.y - anchorY + index * 32
					try {
						item.style.width = width
						item.style.height = 32
						item.style.translateX = offsetX
						item.style.translateY = offsetY
					} catch (error) {
						this.diag('item-layout', error)
					}
					try {
						const native = item.nativeViewProtected
						native.Width = width
						native.Height = 32
						const translate = new Microsoft.UI.Xaml.Media.TranslateTransform()
						translate.X = offsetX
						translate.Y = offsetY
						native.RenderTransform = translate
						// A panel only hit-tests where it has a Background —
						// transparent still registers; none passes input through.
						if (!native.Background) {
							native.Background =
								new Microsoft.UI.Xaml.Media.SolidColorBrush({
									A: 1,
									R: 0,
									G: 0,
									B: 0,
								})
						}
					} catch (error) {
						this.diag('item-native-layout', error)
					}
					this.setItemVisibility(item, true)
				})
			} catch (error) {
				this.diag('item-layout', error)
			}
			this.requestLayout?.()
			host.Children.Append(this.canvas)
			try {
				canvasStatics.SetZIndex(this.canvas, 2147483647)
			} catch {}
			this.popupOpen = true
			this.captureFocus()
			this.focusFirstWithRetry(4)
		} catch (error) {
			this.popupOpen = false
			this.diag('open', error)
		}
	}

	private minHeightSet(target: any, value: number): void {
		try {
			target.MinHeight = value
		} catch {}
	}

	private anchorLocation(host: any): { x: number; y: number } {
		// Transform into the host's coordinate space: Mason/{N} locations do not
		// share the host panel's origin or scale.
		const anchor = this.nativeViewProtected
		try {
			if (typeof anchor?.TransformToVisual === 'function') {
				const transform = anchor.TransformToVisual(host)
				const height = Number(anchor.ActualHeight) || 0
				const bottom = transform.TransformPoint({ X: 0, Y: height })
				const top = transform.TransformPoint({ X: 0, Y: 0 })
				const y = Number(bottom?.Y)
				const x = Number(top?.X)
				if (Number.isFinite(x) && Number.isFinite(y)) {
					return { x, y }
				}
			}
		} catch {}
		const height = Number(anchor?.ActualHeight) || 0
		try {
			const location = this.getLocationOnScreen?.()
			if (location && Number.isFinite(Number(location.x))) {
				return { x: Number(location.x), y: Number(location.y) + height }
			}
		} catch {}
		return { x: 0, y: height }
	}

	private hide(report: boolean): void {
		if (!this.popupOpen) {
			return
		}
		this.popupOpen = false
		try {
			for (const item of this.items) {
				this.setItemVisibility(item, false)
			}
			const children = this.childCollection(this.host)
			if (children) {
				const count = Number(children.Size)
				for (let index = count - 1; index >= 0; index--) {
					if (children.GetAt?.(index) === this.canvas) {
						children.RemoveAt(index)
						break
					}
				}
			}
		} catch (error) {
			this.diag('close-remove', error)
		}
		this.giveBackFocus()
		if (report) {
			const receive = this.reportReceiver?.()
			receive?.(false)
		}
	}

	private attach(item: WindowsMenuItem, items: WindowsMenuItem[]): void {
		const peer = this.slots.FindName('XplatItem' + items.indexOf(item))
		if (!peer) {
			throw new Error('Windows menu could not resolve its native item slot')
		}
		item.peer = peer
		item.owner = this
		try {
			(item.style as any).position = 'absolute'
		} catch (error) {
			this.diag('item-position', error)
		}
		this.setItemVisibility(item, this.popupOpen)
	}

	private rebuild(exclude?: ChildView): void {
		this.stopListening()
		const items = this.logicalItems(exclude)
		this.slots = this.createSlots(items)
		this.canvas = this.slots
		for (const item of this.items) {
			this.attach(item, items)
		}
		if (this.isLoaded) {
			this.listen()
		} else {
			this.refresh()
		}
	}

	onLoaded(): void {
		super.onLoaded()
		try {
			this.listen()
		} catch (error) {
			this.diag('listen', error)
		}
	}

	private listen(): void {
		this.stopListening()
		const canvas = this.canvas
		const generation = this.generation
		const current = () => this.canvas === canvas && this.generation === generation && this.isLoaded
		const receive = (action: () => void) => {
			if (!current() || this.writing) {
				return
			}
			this.receiving++
			try {
				action()
			} finally {
				this.receiving--
				if (this.canvas === canvas && this.generation === generation && this.isLoaded) {
					this.settle()
				}
			}
		}
		this.reportReceiver = () => (open: boolean) =>
			receive(() => {
				if (open !== this.settings?.open && (!open || !this.settings?.blocked)) {
					this.settings?.onOpenChange(open)
				}
			})
		this.clicks = this.items.map((item) => {
			const click = NSWinRT.asDelegate('Microsoft.UI.Xaml.RoutedEventHandler', () =>
				receive(() => {
					if (
						!item.settings ||
						item.settings.disabled ||
						this.settings?.blocked ||
						!this.isEnabled
					) {
						return
					}
					try {
						item.settings.onSelect?.()
					} catch (error) {
						reportActionError(error)
					}
					// Finite action rows close once on activation, and the
					// close is reported so a controlling owner sees it.
					this.hide(true)
				}),
			)
			item.peer.Click = click
			try {
				// Loaded item chrome can swallow its own Click; Tapped still
				// routes through the element's hit region.
				item.peer.Tapped = click
			} catch (error) {
				this.diag('peer-tap', error)
			}
			return click
		})
		try {
			this.keyDown = NSWinRT.asDelegate(
				'Microsoft.UI.Xaml.Input.KeyEventHandler',
				(_sender: any, args: any) =>
					receive(() => {
						const key = Number(args?.Key)
						if (key === 27) {
							this.hide(true)
						} else if (key === 38 || key === 40) {
							this.focusSibling(key === 40 ? 1 : -1)
						}
					}),
			)
			this.presenter().KeyDown = this.keyDown
			for (const item of this.items) {
				item.peer.KeyDown = this.keyDown
			}
		} catch (error) {
			this.keyDown = undefined
			this.diag('keydown', error)
		}
		try {
			this.tapped = NSWinRT.asDelegate(
				'Microsoft.UI.Xaml.Input.TappedEventHandler',
				() => receive(() => this.hide(true)),
			)
			this.dismiss().Tapped = this.tapped
		} catch (error) {
			this.tapped = undefined
			this.diag('dismiss-tap', error)
		}
		try {
			// A bare presenter is hit-transparent; presses fall through to the
			// backdrop and dismiss the menu. A transparent brush gives the menu
			// region its own hit region so presses reach the items.
			this.presenter().Background = new Microsoft.UI.Xaml.Media.SolidColorBrush({
				A: 1,
				R: 0,
				G: 0,
				B: 0,
			})
		} catch (error) {
			this.diag('presenter-bg', error)
		}
		try {
			for (const item of this.items) {
				const native = item.nativeViewProtected
				if (!native) {
					continue
				}
				native.Tapped = NSWinRT.asDelegate(
					'Microsoft.UI.Xaml.Input.TappedEventHandler',
					() =>
						receive(() => {
							if (
								!item.settings ||
								item.settings.disabled ||
								this.settings?.blocked ||
								!this.isEnabled
							) {
								return
							}
							try {
								item.settings.onSelect?.()
							} catch (error) {
								reportActionError(error)
							}
							this.hide(true)
						}),
				)
			}
		} catch (error) {
			this.diag('item-tap', error)
		}
		this.layoutDelegate = NSWinRT.asDelegate('Windows.Foundation.EventHandler`1<Object>', () => {
			if (!current()) {
				return
			}
			const width = Number(this.nativeViewProtected.ActualWidth)
			const wantsOpen = this.settings?.open && !this.settings.blocked && this.isEnabled
			if ((width > 0 && wantsOpen && !this.popupOpen) || (this.popupOpen && width > 0)) {
				this.settle()
			}
		})
		this.nativeViewProtected.LayoutUpdated = this.layoutDelegate
		this.refresh()
	}

	private stopListening(): void {
		this.generation++
		if (this.settleTask !== undefined) {
			clearTimeout(this.settleTask)
		}
		this.settleTask = undefined
		if (this.focusTask !== undefined) {
			clearTimeout(this.focusTask)
		}
		this.focusTask = undefined
		try {
			this.hide(true)
		} catch {}
		if (this.slots) {
			try {
				this.slots.FindName('XplatPresenter').KeyDown = null
			} catch {}
			try {
				this.slots.FindName('XplatDismiss').Tapped = null
			} catch {}
		}
		if (this.nativeViewProtected) {
			this.nativeViewProtected.LayoutUpdated = null
		}
		for (const item of this.items) {
			if (item.peer) {
				item.peer.Click = null
				try {
					item.peer.KeyDown = null
				} catch {}
			}
		}
		this.keyDown = this.tapped = this.layoutDelegate = undefined
		this.clicks = []
		this.restoreFocus = undefined
		this.reportReceiver = undefined
	}

	private enabledItems(): WindowsMenuItem[] {
		return this.items.filter((item) => !item.settings?.disabled)
	}

	private tryFocus(element: any, state: any): void {
		if (!element) {
			return
		}
		try {
			if (typeof element.Focus === 'function' && element.Focus(state)) {
				return
			}
		} catch {}
		try {
			NSWinRT.toPromise(Microsoft.UI.Xaml.Input.FocusManager.TryFocusAsync(element, state))
		} catch (error) {
			this.diag('focus-throw', error)
		}
	}

	private captureFocus(): void {
		try {
			const manager = Microsoft.UI.Xaml.Input.FocusManager
			this.restoreFocus = manager.GetFocusedElement(this.nativeViewProtected.XamlRoot)
		} catch {
			this.restoreFocus = undefined
		}
	}

	private triggerElement(): any {
		let candidate: any
		const visit = (view: any): boolean => {
			if (view === this) {
				return false
			}
			const native = view?.nativeViewProtected
			if (native && native.IsTabStop === true) {
				candidate = native
			}
			;(view as any)?.eachChildView?.(visit)
			return true
		}
		;(this.parent as any)?.eachChildView?.(visit)
		return candidate
	}

	private giveBackFocus(): void {
		// Menu focus returns to the trigger, not to whatever held focus before
		// the open; an Invoke-opened menu may never have had trigger focus.
		const element = this.triggerElement() ?? this.restoreFocus
		this.restoreFocus = undefined
		this.tryFocus(element, Microsoft.UI.Xaml.FocusState.Programmatic)
	}

	private focusFirstWithRetry(attempts: number): void {
		this.focusTask = setTimeout(() => {
			this.focusTask = undefined
			if (!this.popupOpen || !this.isLoaded) {
				return
			}
			const peers = this.enabledItems().map((item) => item.peer)
			let focused: any
			try {
				focused = Microsoft.UI.Xaml.Input.FocusManager.GetFocusedElement(
					this.nativeViewProtected.XamlRoot,
				)
			} catch {}
			if (peers.includes(focused)) {
				return
			}
			this.tryFocus(this.presenter(), Microsoft.UI.Xaml.FocusState.Keyboard)
			this.tryFocus(peers[0], Microsoft.UI.Xaml.FocusState.Keyboard)
			if (attempts > 1) {
				this.focusFirstWithRetry(attempts - 1)
			}
		}, attempts === 4 ? 0 : 50)
	}

	private focusSibling(direction: number): void {
		const candidates = this.enabledItems().map((item) => item.peer)
		if (!candidates.length) {
			return
		}
		let index = -1
		try {
			const manager = Microsoft.UI.Xaml.Input.FocusManager
			const current = manager.GetFocusedElement(this.nativeViewProtected.XamlRoot)
			index = candidates.indexOf(current)
		} catch {}
		this.tryFocus(
			candidates[(index + direction + candidates.length) % candidates.length],
			Microsoft.UI.Xaml.FocusState.Keyboard,
		)
	}

	private settle(): void {
		if (this.settleTask !== undefined) {
			return
		}
		const canvas = this.canvas
		const generation = this.generation
		this.settleTask = setTimeout(() => {
			this.settleTask = undefined
			if (this.canvas === canvas && this.generation === generation && this.isLoaded) {
				this.refresh()
			}
		}, 0)
	}

	refresh(): void {
		try {
			this.refreshSafe()
		} catch (error) {
			this.diag('refresh', error)
		}
	}

	private refreshSafe(): void {
		if (!this.canvas) {
			return
		}
		if (this.receiving) {
			this.settle()
			return
		}
		this.writing++
		try {
			const automation = Microsoft.UI.Xaml.Automation.AutomationProperties
			for (const item of this.items) {
				item.peer.IsEnabled = !item.settings?.disabled && !this.settings?.blocked
				// The overlay leaves the tree while closed, so items can't take
				// Tab then; IsTabStop must track enabled for focus to accept.
				item.peer.IsTabStop = item.peer.IsEnabled
				automation.SetName(item.peer, item.settings?.label ?? '')
				automation.SetAutomationId(item.peer, item.id ?? '')
			}

			const presenter = this.presenter()
			const label = this.settings?.label ?? 'Menu'
			if (automation.GetName(presenter) !== label) {
				automation.SetName(presenter, label)
			}
			if (automation.GetAutomationId(presenter) !== this.presenterId) {
				automation.SetAutomationId(presenter, this.presenterId)
			}
			const width = Number(this.nativeViewProtected.ActualWidth)
			if (width > 0 && Number(this.minWidthAccessor!.get!.call(presenter)) !== width) {
				this.minWidthAccessor!.set!.call(presenter, width)
			}

			const open = Boolean(
				this.settings?.open && !this.settings.blocked && this.isEnabled && this.isLoaded,
			)
			if (open !== this.popupOpen && Number(this.nativeViewProtected.ActualWidth) > 0) {
				if (open) {
					this.show()
				} else {
					this.hide(false)
				}
			}
		} finally {
			this.writing--
		}
	}

	_addViewToNativeVisualTree(child: ChildView, _atIndex?: number): boolean {
		if (!this.canvas || !(child instanceof WindowsMenuItem) || !child.nativeViewProtected) {
			return false
		}
		try {
			const items = this.logicalItems()
			this.items.push(child)
			this.items.sort((a, b) => items.indexOf(a) - items.indexOf(b))
			if (items.length !== this.slotCount) {
				this.rebuild()
			} else {
				this.attach(child, items)
				this.refresh()
			}
		} catch (error) {
			this.diag('attach', error)
		}
		// Only {N}-managed children receive Mason layout and pointer input; the
		// item views mount as ordinary anchor children with absolute positions
		// so they do not grow the anchor's own measure.
		return super._addViewToNativeVisualTree(child, _atIndex)
	}

	_removeViewFromNativeVisualTree(child: ChildView): void {
		const index = this.items.indexOf(child as WindowsMenuItem)
		if (index >= 0) {
			const item = this.items.splice(index, 1)[0]!
			item.peer = item.owner = undefined
			if (this.canvas && !this.tearingDown) {
				this.rebuild(child)
			}
		}
		super._removeViewFromNativeVisualTree(child)
	}

	onUnloaded(): void {
		this.stopListening()
		super.onUnloaded()
	}

	_tearDownUI(force?: boolean): void {
		this.tearingDown = true
		this.stopListening()
		try {
			super._tearDownUI(force)
		} finally {
			this.tearingDown = false
		}
	}

	disposeNativeView(): void {
		this.stopListening()
		for (const item of this.items) {
			item.peer = item.owner = undefined
		}
		this.items = []
		this.canvas = this.slots = this.host = undefined
		super.disposeNativeView()
	}
}

new Property<WindowsMenuControl, MenuSettings | undefined>({
	name: 'settings',
	valueChanged: (view) => view.refresh(),
}).register(WindowsMenuControl)

new Property<WindowsMenuItem, ItemSettings | undefined>({
	name: 'settings',
	valueChanged: (view) => view.owner?.refresh(),
}).register(WindowsMenuItem)

registerElement('xplatwindowsmenu', WindowsMenuControl)
registerElement('xplatwindowsmenuitem', WindowsMenuItem)
