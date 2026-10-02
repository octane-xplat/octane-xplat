// Components exposed on AppKit use ordinary function signatures so they
// remain valid JSX elements in the AppKit renderer's TypeScript program.
import type * as P from './generated/props.js'
import type { MdDoc } from './generated/Markdown.js'
import type { SafeAreaInsets } from './generated/safeAreaInsets.js'

type Component<Props = Record<string, unknown>> = (props: Props & { children?: any }) => unknown

export type * from './generated/props.js'
export type { MdDoc, MdNode, MdInline } from './generated/Markdown.js'

export {
	ChatComposer,
	ChatComposerDrawer,
	ChatComposerInput,
	ChatComposerTokenElement,
	ChatDictationButton,
	ChatLayout,
	ChatLayoutScrollButton,
	ChatMessage,
	ChatMessageBubble,
	ChatMessageList,
	ChatMessageMetadata,
	ChatSendButton,
	ChatSystemMessage,
	ChatTokenizedText,
	ChatToolCalls,
	useChatComposerContext,
	useChatComposerTokens,
	useChatDictation,
	useChatLayoutContext,
	useChatNewMessages,
	useChatPasteAsToken,
	useChatStreamScroll,
	useSpeechRecognition,
} from './generated/index.shared.js'

export declare const View: Component<P.ViewProps>
/** Vertical flex container, exported under Astryx's component name. */
export declare const VStack: Component<P.VStackProps>
/** Horizontal flex container, exported under Astryx's component name. */
export declare const HStack: Component<P.HStackProps>
export declare const Grid: Component<P.GridProps>
export declare const Stack: Component<P.StackProps>
export declare const StackItem: Component<P.StackItemProps>
export declare const Center: Component<P.CenterProps>
export declare const Section: Component<P.SectionProps>
export declare const AspectRatio: Component<P.AspectRatioProps>
export declare const VisuallyHidden: Component<P.VisuallyHiddenProps>
export declare const Absolute: Component<P.AbsoluteProps>
export declare const Spacer: Component<P.SpacerProps>
export declare const Text: Component<P.TextProps>
export declare const Markdown: Component<{ data?: MdDoc }>
export declare const MarkdownScreen: Component<{ data?: MdDoc; error?: unknown }>
export declare const RichText: Component<P.RichTextProps>
export declare const RichTextSpan: Component<P.RichTextSpanProps>
export declare const Pressable: Component<P.PressableProps>
export declare const Button: Component<P.ButtonProps>
export declare const IconButton: Component<P.IconButtonProps>
export declare const ButtonGroup: Component<P.ButtonGroupProps>
export declare const ToggleButton: Component<P.ToggleButtonProps>
export declare const ToggleButtonGroup: Component<P.ToggleButtonGroupProps>
export declare const Collapsible: Component<P.CollapsibleProps>
export declare const Accordion: Component<P.AccordionProps>
/** Self-drawn checkbox, exported under Astryx's component name. */
export declare const CheckboxInput: Component<P.CheckboxInputProps>
/** Single-choice option list, exported under Astryx's component name. */
export declare const RadioList: Component<P.RadioListProps>
export declare const DropdownMenu: Component<P.DropdownMenuProps>
export declare const MoreMenu: Component<P.MoreMenuProps>
export declare const ContextMenu: Component<P.ContextMenuProps>
export declare const Badge: Component<P.BadgeProps>
/** Visual separator between content sections, exported under Astryx's name. */
export declare const Divider: Component<P.DividerProps>
export declare const Skeleton: Component<P.SkeletonProps>
export declare const Avatar: Component<P.AvatarProps>
export declare const AvatarGroup: Component<P.AvatarGroupProps>
/** Labeled control wrapper, exported under Astryx's component name. */
export declare const Field: Component<P.FieldProps>
export declare const FieldGroup: Component<P.FieldGroupProps>
export declare const FormLayout: Component<P.FormLayoutProps>
export declare const InputGroup: Component<P.InputGroupProps>
export declare const InputGroupText: Component<P.InputGroupTextProps>
/** Reusable labeled row, exported under Astryx's component name. */
export declare const Item: Component<P.ItemProps>
/** Bounded child-based content list; not a virtualized or OS list. */
export declare const List: Component<P.ListProps>
export declare const ListItem: Component<P.ListItemProps>
export declare const CheckboxIndicator: Component<P.IndicatorProps<'multiSelection'>>
export declare const CheckIndicator: Component<P.IndicatorProps<'singleSelection'>>
export declare const RadioIndicator: Component<P.IndicatorProps<'singleSelection'>>
/** Bounded numeric entry, exported under Astryx's component name. */
export declare const NumberInput: Component<P.NumberInputProps>
export declare const PinInput: Component<P.PinInputProps>
/** Option picker, exported under Astryx's component name. */
export declare const Selector: Component<P.SelectorProps>
/** Multi-choice option picker, exported under Astryx's component name. */
export declare const MultiSelector: Component<P.MultiSelectorProps>
export declare const BaseTypeahead: Component<P.BaseTypeaheadProps>
export declare const Typeahead: Component<P.TypeaheadProps>
export declare const TypeaheadItem: Component<P.TypeaheadItemProps>
export declare function createStaticSource<T extends P.SearchableItem>(items: T[], options?: P.CreateStaticSourceOptions<T>): P.SearchSource<T>
export declare const Token: Component<P.TokenProps>
export declare const Tokenizer: Component<P.TokenizerProps>
export declare const ComplexSelector: Component<P.ComplexSelectorProps<any>>
export declare const InputRating: Component<P.InputRatingProps>
/** Multi-choice checkbox list, exported under Astryx's component name. */
export declare const CheckboxList: Component<P.CheckboxListProps>
/** Ancestor path trail, exported under Astryx's component name. */
export declare const Breadcrumbs: Component<P.BreadcrumbsProps>
export declare const Pagination: Component<P.PaginationProps>
export declare const Stepper: Component<P.StepperProps>
export declare const NavigationMenu: Component<P.NavigationMenuProps>
export declare const CommandPalette: Component<P.CommandPaletteProps>
export declare const AppShell: Component<P.AppShellProps>
export declare const AppShellMobileContext: any
export declare function useAppShellMobile(): P.AppShellMobileContextValue
export declare const TopNav: Component<P.TopNavProps>
export declare const TopNavHeading: Component<P.TopNavHeadingProps>
export declare const TopNavItem: Component<P.TopNavItemProps>
export declare const TopNavMenu: Component<P.TopNavMenuProps>
export declare const TopNavMegaMenu: Component<P.TopNavMegaMenuProps>
export declare const TopNavMegaMenuItem: Component<P.TopNavMegaMenuItemProps>
export declare const TopNavMegaMenuFeaturedCard: Component<P.TopNavMegaMenuFeaturedCardProps>
export declare const TopNavRenderContext: any
export declare function useTopNavRenderMode(): P.TopNavRenderMode
export declare const SideNav: Component<P.SideNavProps>
export declare const SideNavSection: Component<P.SideNavSectionProps>
export declare const SideNavHeading: Component<P.SideNavHeadingProps>
export declare const SideNavItem: Component<P.SideNavItemProps>
export declare const SideNavCollapseButton: Component<P.SideNavCollapseButtonProps>
export declare const SideNavRenderContext: any
export declare function useSideNavCollapse(): P.SideNavCollapseState | null
export declare function useSideNavRenderMode(): P.SideNavRenderMode
export declare const MobileNav: Component<P.MobileNavProps>
export declare const MobileNavToggle: Component<P.MobileNavToggleProps>
export declare const NavIcon: Component<P.NavIconProps>
export declare const NavHeadingMenu: Component<P.NavHeadingMenuProps>
export declare const NavHeadingMenuItem: Component<P.NavHeadingMenuItemProps>
export declare const NavHeadingMenuContext: any
export declare const NavHeadingCloseContext: any
export declare function useNavHeadingMenuContext(): P.NavHeadingMenuContextValue | null
export declare function useNavHeadingCloseContext(): P.NavHeadingCloseContextValue | null
export declare const TabList: Component<P.TabListProps>
export declare const Tab: Component<P.TabProps>
export declare const TabMenu: Component<P.TabMenuProps>
export declare function useTabListContext(): P.TabListContextValue
export declare const Toolbar: Component<P.ToolbarProps>
export declare const OverflowList: Component<P.OverflowListProps>
export declare function useResizable(config: P.UseResizableSingleConfig): P.ResizableRegion
export declare function useResizable(config: P.UseResizableMultiConfig): Record<string, P.ResizableRegion>
export declare const ResizeHandle: Component<P.ResizeHandleProps>
export declare function pixel(value: number): P.ResizablePixelSize
export declare function percent(value: number, constraint: { min: P.ResizablePixelSize } | { max: P.ResizablePixelSize }): P.ResizablePercentSize
export declare const Table: Component<P.TableProps>
export declare const Timeline: Component<P.TimelineProps>
/** Expandable hierarchy, exported under Astryx's component name. */
export declare const TreeList: Component<P.TreeListProps>
export declare const Alert: Component<P.AlertProps>
export declare const Card: Component<P.CardProps>
export declare const ClickableCard: Component<P.ClickableCardProps>
export declare const SelectableCard: Component<P.SelectableCardProps>
export declare const Chip: Component<P.ChipProps>
export declare const Kbd: Component<P.KbdProps>
/** Empty-state block, exported under Astryx's component name. */
export declare const EmptyState: Component<P.EmptyStateProps>
export declare const Banner: Component<P.BannerProps>
export declare const User: Component<P.UserProps>
export declare const ProgressGroup: Component<P.ProgressGroupProps>
export declare const Link: Component<P.LinkProps>
export declare const NavLink: Component<P.NavLinkProps>
export declare const TextInput: Component<P.TextInputProps>
export declare const TextArea: Component<P.TextAreaProps>
export declare const SearchInput: Component<P.SearchInputProps>
export declare const SegmentedControl: Component<P.SegmentedControlProps>
export declare const ScrollableArea: Component<P.ScrollableAreaProps>
/** AppKit fallback with keyed rows and one nonvirtualized scroll view. */
export declare function VirtualList<T = any>(
	props: P.VirtualListProps<T> & { children?: any },
): unknown

export declare const Image: Component<P.ImageProps>
export declare const PowerSearch: Component<P.PowerSearchProps>
export declare const PowerSearchToken: Component<P.PowerSearchTokenProps>
export declare const PowerSearchFilterEditor: Component<P.PowerSearchEditorProps>
export { createPowerSearchConfig, usePowerSearchConfig, resolveOperatorLabel } from './generated/power-search-config.js'
export declare const WebView: Component<P.WebViewProps>
export declare const CameraView: Component
export declare const Overlay: Component<P.OverlayProps>
export declare const Popover: Component<P.PopoverProps>
export declare const Dialog: Component<P.DialogProps>
export declare const DialogHeader: Component<P.DialogHeaderProps>
export declare const AlertDialog: Component<P.AlertDialogProps>
export declare const BottomSheet: Component<P.BottomSheetProps>
export declare const BottomSheetSwitcher: Component<P.BottomSheetSwitcherProps>
export declare const HoverCard: Component<P.HoverCardProps>
export declare const Carousel: Component<P.CarouselProps>
export declare const Lightbox: Component<P.LightboxProps>
export declare const Toast: Component<P.ToastProps>
export declare const ToastViewport: Component<P.ToastViewportProps>
export declare const Tooltip: Component<P.TooltipProps>
export { Markdown, MarkdownScreen } from './generated/Markdown.js'
export declare const Tabs: Component<P.TabsProps>
export declare const Screen: Component<P.ScreenProps>
export declare const Switch: Component<P.SwitchProps>
export declare const SafeArea: Component<P.SafeAreaProps>
export declare const KeyboardAvoiding: Component<P.KeyboardAvoidingProps>
export declare const Drawer: Component<P.DrawerProps>
/** Loading indicator, exported under Astryx's component name. */
export declare const Spinner: Component<P.SpinnerProps>
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
export declare function useSafeAreaInsets(): SafeAreaInsets
export declare function useMeasure(options?: P.UseMeasureOptions): P.MeasureResult
export declare function registerIcon(name: string, glyph: P.IconGlyph): void
export declare function registerIcons(record: Record<string, P.IconGlyph>): void
export declare const showToast: P.ShowToastFn
export declare function useToast(): P.ShowToastFn
export declare function useImperativeDialog(): P.ImperativeDialogReturn
export declare function useImperativeAlertDialog(): P.ImperativeAlertDialogReturn
export declare function useHoverCard(options?: P.HoverCardOptions): P.HoverCardReturn
export declare function useLightbox(options: P.UseLightboxOptions): P.UseLightboxReturn
export declare function useScrollableArea(options?: P.UseScrollableAreaOptions): P.UseScrollableAreaResult
export declare const defaultIndicators: {
	[N in P.IndicatorName]: P.IndicatorComponent<P.IndicatorMap[N]>
}
export declare const indicatorScope: string
export declare function registerIndicator<N extends P.IndicatorName>(
	name: N,
	component: P.IndicatorComponent<P.IndicatorMap[N]>,
): void
export declare function registerIndicators(registry: P.IndicatorRegistry): void
export declare function getIndicator<N extends P.IndicatorName>(
	name: N,
): P.IndicatorComponent<P.IndicatorMap[N]> | undefined
export declare function useIndicator<N extends P.IndicatorName>(
	name: N,
): P.IndicatorComponent<P.IndicatorMap[N]> | undefined

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
/** Layer a programmatic manifest (from `defineRoutes`) over the registered
 *  routes — same-name entries win over the base with a warn. */
export declare function addRoutes(manifest: P.RouteManifest): void
export declare function screenFor(name: string): P.ScreenTable[string] | undefined
export declare function hrefFor(route: P.Route): string
export declare function layoutsForRoute(name: string): any[]
export declare function deriveRouteManifest(
	files: Record<string, any>,
	prefer: readonly string[],
	dir?: string,
): P.RouteManifest

export declare function defineRoutes(
	input: readonly P.RouteSpec[] | P.RouteSpecSet,
): P.RouteManifest

export declare function mergeRouteManifests(...manifests: P.RouteManifest[]): P.RouteManifest
export declare function createStore<T>(initial: T): P.Store<T>
export declare function useStore<T>(store: P.ReadableStore<T>): T
export declare const openBottomSheet: P.OpenBottomSheet
export declare function closeBottomSheet(result?: P.ModalOpenResult): void
export declare function bottomSheetHost(): null
