// oxlint-disable-next-line xplat/no-ns-deep-import -- Provider leaves must avoid importing their own root barrel.
import { View } from '@nativescript/core/ui/core/view'

// The GTK host registers its supported native controls on the shared renderer.
// Classes required by its built-in registry fail explicitly if reached.
class UnsupportedView extends View {
  constructor() {
    super()
    throw new Error(`NativeScript Core <${new.target.name}> is unavailable on GTK`)
  }
}

export class ActionBar extends UnsupportedView {}
export class ActionItem extends UnsupportedView {}
export class ActivityIndicator extends UnsupportedView {}
export class Button extends UnsupportedView {}
export class ContentView extends UnsupportedView {}
export class DatePicker extends UnsupportedView {}
export class FormattedString extends UnsupportedView {}
export class Frame extends UnsupportedView {}
export class HtmlView extends UnsupportedView {}
export class Image extends UnsupportedView {}
export class Label extends UnsupportedView {}
export class LiquidGlass extends UnsupportedView {}
export class ListPicker extends UnsupportedView {}
export class ListView extends UnsupportedView {}
export class NavigationButton extends UnsupportedView {}
export class Page extends UnsupportedView {}
export class Placeholder extends UnsupportedView {}
export class Progress extends UnsupportedView {}
export class ProxyViewContainer extends UnsupportedView {}
export class RootLayout extends UnsupportedView {}
export class SearchBar extends UnsupportedView {}
export class SegmentedBar extends UnsupportedView {}
export class SegmentedBarItem extends UnsupportedView {}
export class Slider extends UnsupportedView {}
export class Span extends UnsupportedView {}
export class Switch extends UnsupportedView {}
export class TabView extends UnsupportedView {}
export class TabViewItem extends UnsupportedView {}
export class TextBase extends UnsupportedView {}
export class TextField extends UnsupportedView {}
export class TextView extends UnsupportedView {}
export class TimePicker extends UnsupportedView {}
export class WebView extends UnsupportedView {}
