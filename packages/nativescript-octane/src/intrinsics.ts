/**
 * JSX intrinsic elements for the NativeScript renderer.
 *
 * Tag names are all-lowercase, matching the keys the driver's element registry
 * instantiates. Props are derived from the installed `@nativescript/core` view
 * classes, so inherited attributes come along for free and the set tracks the
 * core version rather than a hand-maintained list.
 *
 * TypeScript reaches this namespace through `jsxImportSource` (the package's
 * `jsx-runtime` subpath re-exports it). An app adds its own tags — and
 * attributes a plugin registers on every view — by augmenting the exported
 * interfaces:
 *
 * ```ts
 * declare module '@octane-xplat/nativescript-octane/intrinsics' {
 *   interface NativeScriptElements {
 *     drawer: Attributes<typeof Drawer>;
 *   }
 *   interface CommonAttributes {
 *     menu?: MenuAction[];
 *   }
 * }
 * ```
 */
import type * as NS from '@nativescript/core'
import type { CSSProperties } from 'octane/jsx-runtime'
export type NativeScriptNode = unknown
type Ref<TInstance> =
  | ((instance: TInstance | null) => void | (() => void))
  | {
      current: TInstance | null
    }
  | readonly Ref<TInstance>[]
  | null
  | undefined
/**
 * The driver assigns every non-event prop onto the view instance, so a JSX
 * attribute is a NativeScript view property rather than a DOM attribute.
 */
export type ViewProperties<TInstance> = {
  [
    K in keyof TInstance as TInstance[K] extends (...args: never[]) => unknown ? never : K
  ]?: TInstance[K]
}
/** NativeScript hands the raw event payload to the listener. */
type NSEventData<TInstance> = NS.EventData & {
  object: TInstance
}
type NSGestureData<TInstance> = NS.GestureEventData & {
  object: TInstance
}
/** NativeScript declares each event as a `static <name>Event` on the view class. */
type EventNames<TClass> = {
  [K in keyof TClass]: K extends `${infer Name}Event` ? Name : never
}[keyof TClass]
type DerivedEvents<TClass, TInstance> = {
  [Name in Extract<EventNames<TClass>, string> as `on${Capitalize<Name>}`]?: (
    event: NSEventData<TInstance>,
  ) => void
}
/**
 * Gestures are available on every view rather than declared as `static …Event`,
 * and the driver aliases a few web-shaped names onto NativeScript events.
 */
export interface CommonEvents<TInstance> {
  onTap?: (event: NSGestureData<TInstance>) => void
  /** Alias for `tap`. */
  onClick?: (event: NSGestureData<TInstance>) => void
  /** Alias for `tap`. */
  onPress?: (event: NSGestureData<TInstance>) => void
  onDoubleTap?: (event: NSGestureData<TInstance>) => void
  onLongPress?: (event: NSGestureData<TInstance>) => void
  onSwipe?: (event: NS.SwipeGestureEventData) => void
  onPan?: (event: NS.PanGestureEventData) => void
  onPinch?: (event: NS.PinchGestureEventData) => void
  onRotation?: (event: NS.RotationGestureEventData) => void
  onTouch?: (event: NS.TouchGestureEventData) => void
  /** Alias for `textChange`. */
  onChange?: (event: NSEventData<TInstance>) => void
  /** Alias for `returnPress`. */
  onSubmit?: (event: NSEventData<TInstance>) => void
  onFocus?: (event: NSEventData<TInstance>) => void
  onBlur?: (event: NSEventData<TInstance>) => void
}
/** Octane's class composition contract, shared unchanged with the DOM. */
export type { ClassValue } from 'octane/jsx-runtime'
import type { ClassValue } from 'octane/jsx-runtime'
/** Mason engine style keys accepted through `style`/`className` — under a
 * masonview parent a child's leaf style consumes them; on a masonview they
 * are the container's own layout. These are the only way to set raw layout
 * properties: direct props of the same names are rejected by the driver. */
export interface MasonStyleProps {
  display?: string
  position?: string
  inset?: number | string
  left?: number | string
  top?: number | string
  right?: number | string
  bottom?: number | string
  direction?: string
  boxSizing?: string
  flexDirection?: string
  flexWrap?: string
  justifyContent?: string
  justifyItems?: string
  justifySelf?: string
  alignItems?: string
  alignContent?: string
  alignSelf?: string
  textAlign?: string
  gap?: number | string
  rowGap?: number | string
  columnGap?: number | string
  flexGrow?: number
  flexShrink?: number
  flexBasis?: number | string
  order?: number
  aspectRatio?: number
  overflow?: string
  overflowX?: string
  overflowY?: string
  scrollbarWidth?: number
  gridTemplateRows?: string
  gridTemplateColumns?: string
  gridTemplateAreas?: string
  gridAutoFlow?: string
  gridAutoRows?: string
  gridAutoColumns?: string
  gridRow?: string
  gridColumn?: string
  gridRowStart?: string | number
  gridRowEnd?: string | number
  gridColumnStart?: string | number
  gridColumnEnd?: string | number
  gridArea?: string
}
export interface CommonAttributes {
  /** Resolved against `app.css`. */
  className?: ClassValue
  class?: ClassValue
  /** A string is parsed as inline CSS; an object is assigned onto `view.style`. */
  style?: string | Partial<NS.Style> | MasonStyleProps | CSSProperties
  /**
   * Name of the property on a slot-hosting parent (e.g. a drawer's
   * `mainContent` / `leftDrawer`) this child should be assigned to instead of
   * being added as a regular layout child.
   */
  hostSlot?: string
  /**
   * ARIA-shaped accessibility values; shared components emit plain strings
   * through the escape-props helpers rather than the NativeScript enums.
   */
  accessibilityRole?: string
  accessibilityState?: string
  accessibilityLiveRegion?: string
  /** Platform escape bags — applied onto the native view by the leaf's
   *  applyEscapeProps, not by the driver. */
  ios?: Record<string, unknown>
  android?: Record<string, unknown>
  windows?: Record<string, unknown>
  macos?: Record<string, unknown>
}
export interface ListViewAttributes {
  /**
   * Renders one row into a recycled cell. The cell keeps its own Octane
   * root: it is diffed in place when the cell is rebound to another row,
   * when `items` changes, or when this function's identity changes, and the
   * value passed is always the current `items[index]`. Takes precedence over
   * `itemTemplate`.
   */
  renderItem?: (item: any, index: number) => NativeScriptNode
}
export interface OctaneAttributes<TInstance> {
  key?: string | number
  ref?: Ref<TInstance>
  children?: NativeScriptNode
}
type Overridden =
  | keyof CommonAttributes
  | keyof OctaneAttributes<unknown>
  | keyof CommonEvents<unknown>
/** Props of a JSX tag backed by a `@nativescript/core`-style view class; the type to use for app-registered tags. */
export type Attributes<TClass extends abstract new (...args: never[]) => unknown> = Omit<
  ViewProperties<InstanceType<TClass>> & DerivedEvents<TClass, InstanceType<TClass>>,
  Overridden
> &
  CommonAttributes &
  CommonEvents<InstanceType<TClass>> &
  OctaneAttributes<InstanceType<TClass>>
export interface NativeScriptElements {
  actionbar: Attributes<typeof NS.ActionBar>
  actionitem: Attributes<typeof NS.ActionItem>
  activityindicator: Attributes<typeof NS.ActivityIndicator>
  button: Attributes<typeof NS.Button>
  contentview: Attributes<typeof NS.ContentView>
  datepicker: Attributes<typeof NS.DatePicker>
  formattedstring: Attributes<typeof NS.FormattedString>
  frame: Attributes<typeof NS.Frame>
  htmlview: Attributes<typeof NS.HtmlView>
  image: Attributes<typeof NS.Image>
  label: Attributes<typeof NS.Label>
  listpicker: Attributes<typeof NS.ListPicker>
  listview: Attributes<typeof NS.ListView> & ListViewAttributes
  navigationbutton: Attributes<typeof NS.NavigationButton>
  page: Attributes<typeof NS.Page>
  placeholder: Attributes<typeof NS.Placeholder>
  progress: Attributes<typeof NS.Progress>
  proxyviewcontainer: Attributes<typeof NS.ProxyViewContainer>
  rootlayout: Attributes<typeof NS.RootLayout>
  scrollview: Attributes<typeof NS.ScrollView>
  searchbar: Attributes<typeof NS.SearchBar>
  segmentedbar: Attributes<typeof NS.SegmentedBar>
  segmentedbaritem: Attributes<typeof NS.SegmentedBarItem>
  slider: Attributes<typeof NS.Slider>
  span: Attributes<typeof NS.Span>
  switch: Attributes<typeof NS.Switch>
  tabview: Attributes<typeof NS.TabView>
  tabviewitem: Attributes<typeof NS.TabViewItem>
  textfield: Attributes<typeof NS.TextField>
  textview: Attributes<typeof NS.TextView>
  timepicker: Attributes<typeof NS.TimePicker>
  webview: Attributes<typeof NS.WebView>
  /** The single layout container — all layout flows through `style`/`className`; layout prop names are rejected by the driver. */
  masonview: Attributes<typeof NS.View>
  /** iOS 26 glass surface (plain layout elsewhere); behaves as a GridLayout. */
  liquidglass: Attributes<typeof NS.LiquidGlass>
}
export declare namespace JSX {
  interface IntrinsicElements extends NativeScriptElements {}
  interface ElementChildrenAttribute {
    children: {}
  }
  type Element = unknown
  type ElementType = string | ((props: any) => unknown)
}
