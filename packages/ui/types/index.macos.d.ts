// Components exposed on AppKit use ordinary function signatures so they
// remain valid JSX elements in the AppKit renderer's TypeScript program.
import type * as P from './props'

type Component<Props = Record<string, unknown>> = (props: Props & { children?: any }) => unknown

export type * from './props'

export declare const View: Component<P.ViewProps>
export declare const Column: Component<P.ViewProps>
export declare const Row: Component<P.RowProps>
export declare const Grid: Component<P.GridProps>
export declare const Stack: Component<P.StackProps>
export declare const Absolute: Component<P.AbsoluteProps>
export declare const Spacer: Component<P.SpacerProps>
export declare const Text: Component<P.TextProps>
export declare const RichText: Component<P.RichTextProps>
export declare const RichTextSpan: Component<P.RichTextSpanProps>
export declare const Pressable: Component<P.PressableProps>
export declare const Button: Component<P.ButtonProps>
export declare const Collapsible: Component<P.CollapsibleProps>
export declare const Accordion: Component<P.AccordionProps>
export declare const Checkbox: Component<P.CheckboxProps>
export declare const RadioGroup: Component<P.RadioGroupProps>
export declare const DropdownMenu: Component<P.DropdownMenuProps>
export declare const ContextMenu: Component<P.ContextMenuProps>
export declare const Badge: Component<P.BadgeProps>
export declare const Separator: Component<P.SeparatorProps>
export declare const Skeleton: Component<P.SkeletonProps>
export declare const Avatar: Component<P.AvatarProps>
export declare const AvatarGroup: Component<P.AvatarGroupProps>
export declare const FormField: Component<P.FormFieldProps>
export declare const FieldGroup: Component<P.FieldGroupProps>
export declare const InputNumber: Component<P.InputNumberProps>
export declare const PinInput: Component<P.PinInputProps>
export declare const Select: Component<P.SelectProps>
export declare const SelectMenu: Component<P.SelectProps>
export declare const Combobox: Component<P.SelectProps>
export declare const InputMenu: Component<P.SelectProps>
export declare const InputTags: Component<P.InputTagsProps>
export declare const InputRating: Component<P.InputRatingProps>
export declare const CheckboxGroup: Component<P.CheckboxGroupProps>
export declare const Breadcrumb: Component<P.BreadcrumbProps>
export declare const Pagination: Component<P.PaginationProps>
export declare const Stepper: Component<P.StepperProps>
export declare const NavigationMenu: Component<P.NavigationMenuProps>
export declare const CommandPalette: Component<P.CommandPaletteProps>
export declare const Table: Component<P.TableProps>
export declare const Timeline: Component<P.TimelineProps>
export declare const Tree: Component<P.TreeProps>
export declare const Alert: Component<P.AlertProps>
export declare const Card: Component<P.CardProps>
export declare const Chip: Component<P.ChipProps>
export declare const Kbd: Component<P.KbdProps>
export declare const Empty: Component<P.EmptyProps>
export declare const Banner: Component<P.BannerProps>
export declare const User: Component<P.UserProps>
export declare const ProgressGroup: Component<P.ProgressGroupProps>
export declare const Link: Component<P.LinkProps>
export declare const NavLink: Component<P.NavLinkProps>
export declare const TextInput: Component<P.TextInputProps>
export declare const TextArea: Component<P.TextAreaProps>
export declare const SearchInput: Component<P.SearchInputProps>
export declare const SegmentedControl: Component<P.SegmentedControlProps>
export declare const ScrollBox: Component<P.ScrollViewProps>
export declare const ScrollView: Component<P.ScrollViewProps>
/**
 * AppKit fallback with keyed rows and one nonvirtualized scroll view.
 * Offscreen rows remain mounted; use a platform-native list for large data.
 */
export declare function VirtualList<T = any>(props: P.VirtualListProps<T> & { children?: any }): unknown
export declare const Pager: Component<P.PagerProps>
export declare const Image: Component<P.ImageProps>
export declare const WebView: Component<P.WebViewProps>
export declare const Video: Component<P.VideoProps>
export declare const CameraView: Component<P.CameraViewProps>
export declare const Overlay: Component<P.OverlayProps>
export declare const Popover: Component<P.PopoverProps>
export declare const Sheet: Component<P.SheetProps>
export declare const Tabs: Component<P.TabsProps>
export declare const Screen: Component<P.ScreenProps>
export declare const Switch: Component<P.SwitchProps>
export declare const SafeArea: Component<P.SafeAreaProps>
export declare const KeyboardAvoiding: Component<P.KeyboardAvoidingProps>
export declare const Drawer: Component<P.DrawerProps>
export declare const ActivityIndicator: Component<P.ActivityIndicatorProps>
export declare const Meter: Component<P.MeterProps>
export declare const Slider: Component<P.SliderProps>
export declare const Icon: Component<P.IconProps>
export declare const Heading: Component<P.HeadingProps>

export declare function setTranslate(el: any, x?: number, y?: number): void
export declare function useAnimation(initial?: number, property?: string): P.AnimatedValue
export declare function useThemeScheme(): P.ColorScheme
export declare function getThemeScheme(): P.ColorScheme
export declare function setThemePreference(value: 'light' | 'dark' | 'system'): void
export declare function getThemePreference(): 'light' | 'dark' | 'system'
export declare function themeSchemeClasses(): string
export declare function onThemeSchemeChange(listener: () => void): () => void
export declare function applyThemeClasses(view: any): void
export declare function useColorScheme(): P.ColorScheme
export declare function getColorScheme(): P.ColorScheme
export declare function styled<T>(component: T, options?: any): T
export declare function openWindow(options?: P.OpenWindowOptions): any
export declare function useSafeAreaInsets(): P.SafeAreaInsets
export declare function useMeasure(options?: P.UseMeasureOptions): P.MeasureResult
export declare function registerIcon(name: string, glyph: P.IconGlyph): void
export declare function registerIcons(record: Record<string, P.IconGlyph>): void
export declare function showToast(content: P.ToastContent, options?: P.ToastOptions): void

export declare const isNative: true
export declare function registerStack(name: string, stack: any): void
export declare function getStack(name: string): any
export declare function stackEntries(): IterableIterator<[string, any]>
export declare function pushRoute(route: P.Route): void
export declare function popRoute(stack?: string): void
export declare function routeStacks(): string[]
export declare function pushDeepLink(url: string): void
export declare function routeFor(stack: string): P.Route | null
export declare function currentRoute(): P.Route | null
export declare function currentModalRoute(): P.Route | null
export declare function canGoBack(stack?: string): boolean
export declare function useCanGoBack(stack?: string): boolean
export declare function useRoute(stack?: string): P.Route | null
export declare function useModalRoute(): P.Route | null
export declare function redirect(route: P.Route): never
export declare function addBackInterceptor(fn: () => boolean): () => void
export declare function registerScreens(table: P.ScreenTable, routes?: P.RouteMeta[]): void
export declare function registerRoutes(manifest: P.RouteManifest): void
export declare function screenFor(name: string): P.ScreenTable[string] | undefined
export declare function hrefFor(route: P.Route): string
export declare function layoutsForRoute(name: string): any[]
export declare function deriveRouteManifest(files: Record<string, any>, prefer: readonly string[], dir?: string): P.RouteManifest
export declare function createStore<T>(initial: T): P.Store<T>
export declare function useStore<T>(store: P.ReadableStore<T>): T
export declare const openSheet: P.OpenSheet
export declare function closeSheet(result?: P.ModalOpenResult): void
export declare function sheetHost(): null
