import { View as MasonView, Scroll as MasonScroll } from '@octane-xplat/nativescript-masonkit'
import {
  ActionBar,
  ActionItem,
  ActivityIndicator,
  Button,
  LiquidGlass,
  ContentView,
  DatePicker,
  FormattedString,
  Frame,
  HtmlView,
  Image,
  Label,
  ListPicker,
  ListView,
  NavigationButton,
  Page,
  Placeholder,
  Progress,
  ProxyViewContainer,
  RootLayout,
  SearchBar,
  SegmentedBar,
  SegmentedBarItem,
  Slider,
  Span,
  Switch,
  TabView,
  TabViewItem,
  TextField,
  TextView,
  TimePicker,
  ViewBase,
  WebView,
} from '@nativescript/core'

export type ElementConstructor = new () => ViewBase

/**
 * Lowercase tag name -> view constructor. The keys are the JSX tag names of
 * `intrinsics.ts`; an app extends the vocabulary with `registerElement`.
 */
export const ELEMENTS: Map<string, ElementConstructor> = new Map()

type ElementReplacedListener = (tag: string, element: ElementConstructor) => void

const replacedListeners: Set<ElementReplacedListener> = new Set()

/**
 * Register (or replace) the view class a tag instantiates. Registering an
 * already-registered tag with a different class notifies `onElementReplaced`
 * listeners; the driver listens and recreates every live instance of the tag
 * in place, which is what lets a hot-reloaded element module reach a running
 * app without a remount.
 */
export function registerElement(tag: string, element: ElementConstructor): void {
  const previous = ELEMENTS.get(tag)
  ELEMENTS.set(tag, element)
  if (previous !== undefined && previous !== element) {
    for (const listener of replacedListeners) {
      listener(tag, element)
    }
  }
}

/** Observe a tag's class being replaced — the driver recreates live instances. Returns the unsubscribe. */
export function onElementReplaced(listener: ElementReplacedListener): () => void {
  replacedListeners.add(listener)
  return () => {
    replacedListeners.delete(listener)
  }
}

// MasonKit narrows its declared style type despite inheriting NativeScript ViewBase at runtime.
// Keep the conversion at the constructor registry boundary.
const BUILTIN_ELEMENTS: ReadonlyArray<[string, ElementConstructor]> = [
  ['actionbar', ActionBar],
  ['actionitem', ActionItem],
  ['activityindicator', ActivityIndicator],
  ['button', Button],
  ['contentview', ContentView],
  ['datepicker', DatePicker],
  ['formattedstring', FormattedString],
  ['frame', Frame],
  ['htmlview', HtmlView],
  ['image', Image],
  ['label', Label],
  ['listpicker', ListPicker],
  ['listview', ListView],
  ['navigationbutton', NavigationButton],
  ['page', Page],
  ['placeholder', Placeholder],
  ['progress', Progress],
  ['proxyviewcontainer', ProxyViewContainer],
  ['rootlayout', RootLayout],
  ['scrollview', MasonScroll as unknown as ElementConstructor],
  ['searchbar', SearchBar],
  ['segmentedbar', SegmentedBar],
  ['segmentedbaritem', SegmentedBarItem],
  ['slider', Slider],
  ['span', Span],
  ['switch', Switch],
  ['tabview', TabView],
  ['tabviewitem', TabViewItem],
  ['textfield', TextField],
  ['textview', TextView],
  ['timepicker', TimePicker],
  ['webview', WebView],
  ['liquidglass', LiquidGlass],
  ['masonview', MasonView as unknown as ElementConstructor],
]

for (const [tag, element] of BUILTIN_ELEMENTS) {
  registerElement(tag, element)
}

/**
 * Web-shaped handler names NativeScript spells differently. Anything else
 * lowercases the first character after `on` (`onLoaded` -> `loaded`).
 */
const EVENT_ALIASES = new Map<string, string>([
  ['onClick', 'tap'],
  ['onPress', 'tap'],
  ['onTap', 'tap'],
  ['onDoubleTap', 'doubleTap'],
  ['onLongPress', 'longPress'],
  ['onChange', 'textChange'],
  ['onSubmit', 'returnPress'],
])

export const EVENT_PROP = /^on[A-Z]/

export function eventNameFor(prop: string): string {
  const alias = EVENT_ALIASES.get(prop)
  if (alias !== undefined) {
    return alias
  }
  const raw = prop.slice(2)
  return raw.charAt(0).toLowerCase() + raw.slice(1)
}
