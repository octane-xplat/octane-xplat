import { ContentView, LayoutBase, Property, type View } from '@nativescript/core'
import { registerElement } from '@nativescript-community/octane'
import { Microsoft, NSWinRT } from '@octane-xplat/platform/windows'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'

interface SelectSettings {
  value?: string
  open: boolean
  blocked: boolean
  label: string
  maxMenuHeight: number
  onOpenChange: (open: boolean) => void
  onPick: (value: string) => void
}

interface OptionSettings {
  value: string
  label: string
  disabled: boolean
}

declare module '@octane-xplat/jsx/intrinsics' {
  interface NativeElements<TElement> {
    xplatwindowsselect: Attributes<TElement, { settings?: SelectSettings }>
    xplatwindowsselectoption: Attributes<TElement, { settings?: OptionSettings }>
  }
}

type ChildView = Parameters<Parameters<View['eachChildView']>[0]>[0]

class WindowsSelectOption extends ContentView {
  declare settings: OptionSettings | undefined
  owner?: WindowsSelectControl
  peer: any
}

/** The outer Mason view draws the trigger. WinUI supplies the ComboBox peer,
 * popup, keyboard navigation, light dismissal and option selection. */
class WindowsSelectControl extends LayoutBase {
  declare nativeViewProtected: any
  declare settings: SelectSettings | undefined
  private combo: any
  private options: WindowsSelectOption[] = []
  private slotCount = 0
  private generation = 0
  private writing = 0
  private receiving = 0
  private tearingDown = false
  private selection: any
  private opened: any
  private closed: any
  private chromeLayoutDelegate: any
  private accessors: Record<string, PropertyDescriptor> = {}
  private settleTask: ReturnType<typeof setTimeout> | undefined

  private logicalOptions(exclude?: ChildView): WindowsSelectOption[] {
    const options: WindowsSelectOption[] = []

    this.eachChildView((view) => {
      if (view !== exclude && view instanceof WindowsSelectOption) {
        options.push(view)
      }

      return true
    })

    return options
  }

  private createCombo(options: WindowsSelectOption[]): any {
    // Named XAML slots avoid the pinned bridge's failing collection insertion.
    // User labels/values never enter markup. Stretch is required for hosted
    // NativeScript ContentViews to receive a nonzero option height. The
    // focus-target Grid also supplies finite popup automation bounds for
    // hosted framework content; a bare ContentPresenter does not.
    const items = options
      .map(
        (_option, index) => `
<ComboBoxItem x:Name="XplatOption${index}" MinWidth="0" MinHeight="32" Padding="0"
 HorizontalContentAlignment="Stretch" VerticalContentAlignment="Stretch">
 <ComboBoxItem.Template>
  <ControlTemplate TargetType="ComboBoxItem">
   <Grid x:Name="LayoutRoot" Background="Transparent" Control.IsTemplateFocusTarget="True">
    <ContentPresenter x:Name="ContentPresenter" Content="{TemplateBinding Content}"
     HorizontalAlignment="Stretch" VerticalAlignment="Stretch" />
   </Grid>
  </ControlTemplate>
 </ComboBoxItem.Template>
</ComboBoxItem>`,
      )
      .join('')

    this.slotCount = options.length
    return Microsoft.UI.Xaml.Markup.XamlReader.Load(`
<ComboBox xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
 xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
 MinWidth="0" MinHeight="0" Padding="0" BorderThickness="0"
 HorizontalAlignment="Stretch" VerticalAlignment="Stretch"
 SelectionChangedTrigger="Committed" SelectedIndex="-1">
 ${items}
</ComboBox>`)
  }

  createNativeView(): any {
    const root = new Microsoft.UI.Xaml.Controls.Grid()

    this.accessors = {}
    for (const key of ['Name', 'Margin', 'Opacity']) {
      let owner = root,
        descriptor: PropertyDescriptor | undefined

      while (owner && !descriptor) {
        descriptor = Object.getOwnPropertyDescriptor(owner, key)
        owner = Object.getPrototypeOf(owner)
      }

      if (!descriptor?.get || (key !== 'Name' && !descriptor.set)) {
        throw new Error('Windows Selector requires projected framework accessors: ' + key)
      }

      this.accessors[key] = descriptor
    }

    this.combo = this.createCombo(this.logicalOptions())
    root.Children.Append(this.combo)
    return root
  }

  private attach(option: WindowsSelectOption, options: WindowsSelectOption[]): void {
    const peer = this.combo.FindName('XplatOption' + options.indexOf(option))

    if (!peer) {
      throw new Error('Windows Selector could not resolve its native option slot')
    }

    peer.Content = option.nativeViewProtected
    option.peer = peer
    option.owner = this
  }

  private rebuild(exclude?: ChildView): void {
    this.stopListening()
    for (const option of this.options) {
      if (option.peer) {
        option.peer.Content = null
      }
    }

    this.nativeViewProtected.Children.Clear()

    const options = this.logicalOptions(exclude)

    this.combo = this.createCombo(options)
    for (const option of this.options) {
      this.attach(option, options)
    }

    this.nativeViewProtected.Children.Append(this.combo)
    if (this.isLoaded) {
      this.listen()
    } else {
      this.refresh()
    }
  }

  onLoaded(): void {
    super.onLoaded()
    this.listen()
  }

  private listen(): void {
    this.stopListening()

    const combo = this.combo
    const generation = this.generation
    const receive = (action: () => void) => {
      if (
        this.combo !== combo ||
        this.generation !== generation ||
        this.writing ||
        !this.isLoaded
      ) {
        return
      }

      this.receiving++
      try {
        action()
      } finally {
        this.receiving--
        // Applying controlled state inside SelectionChanged can reenter a
        // native write. Reconcile only after that event has unwound.
        if (this.combo === combo && this.generation === generation && this.isLoaded) {
          this.settle()
        }
      }
    }

    this.selection = NSWinRT.asDelegate(
      'Microsoft.UI.Xaml.Controls.SelectionChangedEventHandler',
      () =>
        receive(() => {
          const option = this.options[Number(combo.SelectedIndex)]?.settings

          if (
            option &&
            !option.disabled &&
            !this.settings?.blocked &&
            this.isEnabled &&
            combo.IsEnabled &&
            option.value !== this.settings?.value
          ) {
            this.settings?.onPick(option.value)
          }
        }),
    )

    const reportOpen = (open: boolean) =>
      receive(() => {
        if (
          !this.settings?.blocked &&
          this.isEnabled &&
          combo.IsEnabled &&
          open !== this.settings?.open
        ) {
          this.settings?.onOpenChange(open)
        }
      })

    this.opened = NSWinRT.asDelegate('Windows.Foundation.EventHandler`1<Object>', () =>
      reportOpen(true),
    )

    this.closed = NSWinRT.asDelegate('Windows.Foundation.EventHandler`1<Object>', () =>
      reportOpen(false),
    )

    this.chromeLayoutDelegate = NSWinRT.asDelegate(
      'Windows.Foundation.EventHandler`1<Object>',
      () => {
        if (this.combo === combo && this.generation === generation && this.isLoaded) {
          this.resetChrome()
        }
      },
    )

    combo.LayoutUpdated = this.chromeLayoutDelegate
    combo.SelectionChanged = this.selection
    combo.DropDownOpened = this.opened
    combo.DropDownClosed = this.closed
    combo.ApplyTemplate()
    this.resetChrome()
    this.refresh()
  }

  private stopListening(): void {
    this.generation++
    if (this.settleTask !== undefined) {
      clearTimeout(this.settleTask)
    }

    this.settleTask = undefined
    if (this.combo) {
      this.combo.SelectionChanged = null
      this.combo.DropDownOpened = null
      this.combo.DropDownClosed = null
      this.combo.LayoutUpdated = null
    }

    this.selection = this.opened = this.closed = this.chromeLayoutDelegate = undefined
  }

  private resetChrome(): void {
    if (this.combo.IsDropDownOpen) {
      return
    }

    // GetChild returns a base wrapper without derived properties. Borrow the
    // known Grid's typed framework accessors on these wrappers. Keep
    // WinUI's popup template and placement; the measured Mason drawing
    // replaces only the collapsed presentation.
    const visit = (node: any) => {
      const name = this.accessors.Name!.get!.call(node)

      if (name === 'Popup') {
        return
      }

      if (name === 'HighlightBackground') {
        const margin = this.accessors.Margin!.get!.call(node)

        if (margin.Left !== 0 || margin.Top !== 0 || margin.Right !== 0 || margin.Bottom !== 0) {
          this.accessors.Margin!.set!.call(node, { Left: 0, Top: 0, Right: 0, Bottom: 0 })
        }
      }

      if (
        name === 'Background' ||
        name === 'Pill' ||
        name === 'ContentPresenter' ||
        name === 'HighlightBackground' ||
        name === 'DropDownGlyph'
      ) {
        if (Number(this.accessors.Opacity!.get!.call(node)) !== 0) {
          this.accessors.Opacity!.set!.call(node, 0)
        }

        if (name === 'ContentPresenter') {
          return
        }
      }

      const tree = Microsoft.UI.Xaml.Media.VisualTreeHelper

      for (let index = 0; index < Number(tree.GetChildrenCount(node)); index++) {
        visit(tree.GetChild(node, index))
      }
    }

    for (
      let index = 0;
      index < Number(Microsoft.UI.Xaml.Media.VisualTreeHelper.GetChildrenCount(this.combo));
      index++
    ) {
      visit(Microsoft.UI.Xaml.Media.VisualTreeHelper.GetChild(this.combo, index))
    }
  }

  private settle(): void {
    if (this.settleTask !== undefined) {
      return
    }

    const combo = this.combo
    const generation = this.generation

    this.settleTask = setTimeout(() => {
      this.settleTask = undefined
      if (this.combo === combo && this.generation === generation && this.isLoaded) {
        this.refresh()
      }
    }, 0)
  }

  refresh(): void {
    const combo = this.combo

    if (!combo) {
      return
    }

    if (this.receiving) {
      this.settle()
      return
    }

    this.writing++
    try {
      const settings = this.settings

      Microsoft.UI.Xaml.Automation.AutomationProperties.SetName(combo, settings?.label ?? '')
      Microsoft.UI.Xaml.Automation.AutomationProperties.SetAutomationId(combo, this.id ?? '')
      combo.IsEnabled = this.isEnabled && !settings?.blocked
      combo.MaxDropDownHeight = settings?.maxMenuHeight ?? 280
      for (const option of this.options) {
        option.peer.IsEnabled = !option.settings?.disabled
        option.peer.IsTabStop = !option.settings?.disabled
        Microsoft.UI.Xaml.Automation.AutomationProperties.SetName(
          option.peer,
          option.settings?.label ?? '',
        )

        Microsoft.UI.Xaml.Automation.AutomationProperties.SetAutomationId(
          option.peer,
          option.id ?? '',
        )
      }

      const index = this.options.findIndex((option) => option.settings?.value === settings?.value)

      if (Number(combo.SelectedIndex) !== index) {
        combo.SelectedIndex = index
      }

      const open = Boolean(settings?.open && !settings.blocked && this.isEnabled)

      if (Boolean(combo.IsDropDownOpen) !== open) {
        combo.IsDropDownOpen = open
      }
    } finally {
      this.writing--
    }
  }

  _addViewToNativeVisualTree(child: ChildView, _atIndex?: number): boolean {
    if (!this.combo || !child.nativeViewProtected || !(child instanceof WindowsSelectOption)) {
      return false
    }

    const options = this.logicalOptions()

    this.options.push(child)
    this.options.sort((a, b) => options.indexOf(a) - options.indexOf(b))
    if (options.length !== this.slotCount) {
      this.rebuild()
    } else {
      this.attach(child, options)
      this.refresh()
    }

    return true
  }

  _removeViewFromNativeVisualTree(child: ChildView): void {
    const index = this.options.indexOf(child as WindowsSelectOption)

    if (index >= 0) {
      const option = this.options.splice(index, 1)[0]!

      if (option.peer) {
        option.peer.Content = null
      }

      option.peer = option.owner = undefined
      if (this.combo && !this.tearingDown) {
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
    for (const option of this.options) {
      option.peer.Content = null
      option.peer = option.owner = undefined
    }

    this.options = []
    this.combo = undefined
    this.accessors = {}
    super.disposeNativeView()
  }
}

new Property<WindowsSelectControl, SelectSettings | undefined>({
  name: 'settings',
  valueChanged: (view) => view.refresh(),
}).register(WindowsSelectControl)

new Property<WindowsSelectOption, OptionSettings | undefined>({
  name: 'settings',
  valueChanged: (view) => view.owner?.refresh(),
}).register(WindowsSelectOption)

registerElement('xplatwindowsselect', WindowsSelectControl)
registerElement('xplatwindowsselectoption', WindowsSelectOption)
