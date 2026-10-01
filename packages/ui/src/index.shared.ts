// Foundations and common controls
export { View } from './View'
/** Vertical flex container, exported under Astryx's component name. */
export { View as VStack } from './View'
/** Horizontal flex container, exported under Astryx's component name. */
export { Row as HStack } from './Row'
export { Grid } from './Grid'
export { Stack } from './Stack'
export { Absolute } from './Absolute'
export type { PanEvent, SwipeEvent, SetTranslate } from './props'
export { setTranslate } from './translate'
export { Spacer } from './Spacer'
export { Text } from './Text'
export { Markdown, MarkdownScreen } from './Markdown'
export type { MdDoc, MdNode, MdInline } from './Markdown'
export { RichText, RichTextSpan } from './RichText'
export { Pressable } from './Pressable'
export { Button } from './Button'
export { Collapsible } from './Collapsible'
export { Accordion } from './Accordion'
/** Self-drawn checkbox, exported under Astryx's component name. */
export { Checkbox as CheckboxInput } from './Checkbox'
/** Single-choice option list, exported under Astryx's component name. */
export { RadioGroup as RadioList } from './RadioGroup'
export { DropdownMenu } from './DropdownMenu'
export { ContextMenu } from './ContextMenu'
export { Badge } from './Badge'
/** Visual separator between content sections, exported under Astryx's name. */
export { Separator as Divider } from './Separator'
export { Skeleton } from './Skeleton'
export { Avatar } from './Avatar'
export { AvatarGroup } from './AvatarGroup'
export type {
	AccordionItemSpec,
	AccordionProps,
	AvatarGroupProps,
	AvatarProps,
	BadgeProps,
	ButtonProps,
	CheckboxProps,
	CollapsibleProps,
	ContextMenuProps,
	DropdownMenuProps,
	MenuItem,
	RadioGroupProps,
	RadioOption,
	SegmentedControlProps,
	SeparatorProps,
	SkeletonProps,
} from './props'

// Forms and data entry
/** Labeled control wrapper, exported under Astryx's component name. */
export { FormField as Field } from './FormField'
export { FieldGroup } from './FieldGroup'
/** Reusable labeled row, exported under Astryx's component name. */
export { ListItem as Item } from './ListItem'
/** Bounded numeric entry, exported under Astryx's component name. */
export { InputNumber as NumberInput } from './InputNumber'
export { PinInput } from './PinInput'
/** Option picker, exported under Astryx's component name. */
export { Select as Selector } from './Select'
/** Multi-choice option picker, exported under Astryx's component name. */
export { SelectMenu as MultiSelector, Combobox, InputMenu } from './aliases'
export { InputTags } from './InputTags'
export { InputRating } from './InputRating'
/** Multi-choice checkbox list, exported under Astryx's component name. */
export { CheckboxGroup as CheckboxList } from './CheckboxGroup'
export type {
	CheckboxGroupProps,
	FieldGroupProps,
	ListItemComponent,
	ListItemProps,
	ListItemSlotProps,
	FormFieldProps,
	InputNumberProps,
	InputRatingProps,
	InputTagsProps,
	PinInputProps,
	SelectOption,
	SelectProps,
} from './props'

// Navigation and command surfaces
/** Ancestor path trail, exported under Astryx's component name. */
export { Breadcrumb as Breadcrumbs } from './Breadcrumb'
export { Pagination } from './Pagination'
export { Stepper } from './Stepper'
export { NavigationMenu } from './NavigationMenu'
export { CommandPalette } from './CommandPalette'
export type {
	BreadcrumbItem,
	BreadcrumbProps,
	CommandPaletteProps,
	NavigationMenuItem,
	NavigationMenuProps,
	PaginationProps,
	StepperProps,
	StepperStep,
} from './props'

// Content and display
export { Table } from './Table'
export { Timeline } from './Timeline'
/** Expandable hierarchy, exported under Astryx's component name. */
export { Tree as TreeList } from './Tree'
export { Alert } from './Alert'
export { Card } from './Card'
export { Chip } from './Chip'
export { Kbd } from './Kbd'
/** Empty-state block, exported under Astryx's component name. */
export { Empty as EmptyState } from './Empty'
export { Banner } from './Banner'
export { User } from './User'
export { ProgressGroup } from './ProgressGroup'
export type {
	AlertProps,
	BannerProps,
	CardProps,
	ChipProps,
	EmptyProps,
	KbdProps,
	ProgressGroupProps,
	TableColumn,
	TableProps,
	TimelineItem,
	TimelineProps,
	TreeNode,
	TreeProps,
	UserProps,
} from './props'

// Links, input, scrolling, media, and overlays
export { Link } from './Link'
export { NavLink } from './NavLink'
export { TextInput } from './TextInput'
export { TextArea } from './TextArea'
export { SearchInput } from './SearchInput'
export { SegmentedControl } from './SegmentedControl'
export { ScrollBox } from './ScrollBox'
export { ScrollView } from './ScrollView'
export { VirtualList } from './VirtualList'
export type { VirtualListProps } from './props'
export { Image } from './Image'
export { WebView } from './WebView'
export type { WebViewContentSize, WebViewHandle, WebViewLoadEvent, WebViewProps } from './props'
export { Overlay } from './Overlay'
export { Popover } from './Popover'
export { Hoverable } from './Hoverable'
export { Tooltip } from './Tooltip'
export { showToast } from './toast-anchor'
export type {
	HoverableProps,
	OverlayProps,
	PopoverAnchorRef,
	PopoverProps,
	PopoverPlacement,
	ToastContent,
	ToastOptions,
	ToastPosition,
	TooltipProps,
} from './props'

// Animation, theme, styling, and host services
export { useAnimation } from './anim'
export type { AnimatedValue } from './anim'
export {
	useThemeScheme,
	getThemeScheme,
	setThemePreference,
	getThemePreference,
	themeSchemeClasses,
	onThemeSchemeChange,
	applyThemeClasses,
} from './theme/theme-scheme'

export { useColorScheme, getColorScheme } from './theme/colorScheme'
export type { ColorScheme } from './theme/colorScheme'
export { styled } from './styled'
export { openWindow } from './windows'

// Screens, visual controls, and icons
export { Screen } from './Screen'
export { Tabs } from './Tabs'
export type { TabSpec } from './Tabs'
export { Switch } from './Switch'
export { SafeArea } from './SafeArea'
export { KeyboardAvoiding } from './KeyboardAvoiding'
export { Drawer } from './Drawer'
export { useSafeAreaInsets } from './safeAreaInsets'
export type { SafeAreaInsets } from './safeAreaInsets'
export { useMeasure } from './useMeasure'
export type { MeasureBounds, MeasureResult, UseMeasureOptions } from './props'
/** Loading indicator, exported under Astryx's component name. */
export { ActivityIndicator as Spinner } from './ActivityIndicator'
export { Meter } from './Meter'
export { Slider } from './Slider'
export { Icon } from './Icon'
export { Heading } from './Heading'
export { registerIcon, registerIcons } from './icons'
export type { IconGlyph } from './icons'
export type {
	ActivityIndicatorProps,
	HeadingProps,
	IconProps,
	MeterProps,
	RefreshProps,
	SearchInputProps,
	SliderProps,
} from './props'

// Platform state and routing
export { isNative } from './platform'
export { registerStack, getStack, stackEntries } from './stacks'
export {
	pushRoute,
	popRoute,
	routeStacks,
	pushDeepLink,
	routeFor,
	currentRoute,
	currentModalRoute,
	canGoBack,
	useCanGoBack,
	useRoute,
	useModalRoute,
	redirect,
	addBackInterceptor,
	registerScreens,
	registerRoutes,
	addRoutes,
	screenFor,
	hrefFor,
	layoutsForRoute,
} from './route'

export { useBackInterceptor } from './use-back'

export {
	deriveRouteManifest,
	defineRoutes,
	mergeRouteManifests,
	manifestToJson,
} from './route-table'

export type {
	BeforeLoad,
	BeforeLoadArgs,
	LinkProps,
	NavLinkProps,
	Route,
	RouteContext,
	RouteHead,
	RouteHeadExport,
	RouteMeta,
	RouteManifest,
	RouteManifestJson,
	RouteJson,
	RouteDataMode,
	RouteNameOfPath,
	RouteParamsFromSpecs,
	RoutePathParams,
	RoutePresentationsFromSpecs,
	RouteSpec,
	RouteSpecSet,
	ManifestRouteNames,
	ManifestRouteParams,
	ManifestRoutePresentations,
	SpecRouteInfo,
	ScreenTable,
	ModalOpenResult,
	OpenWindowOptions,
} from './props'

// Stores, sheets, and shared prop types
export { createStore } from './store'
export type { Store, ReadableStore } from './store'
export { useStore } from './use-store'
export { Sheet } from './Sheet'
export { openSheet, closeSheet } from './sheet-service'
export type { SheetProps, SheetOpenOptions, OpenSheet } from './props'
export type {
	AbsoluteProps,
	DividerProps,
	HStackProps,
	VStackProps,
	ItemProps,
	CheckboxInputProps,
	CheckboxListProps,
	RadioListProps,
	FieldProps,
	NumberInputProps,
	SelectorProps,
	MultiSelectorProps,
	BreadcrumbsProps,
	TreeListProps,
	EmptyStateProps,
	SpinnerProps,
	DrawerProps,
	GridProps,
	ImageProps,
	KeyboardAvoidingProps,
	LayoutChildProps,
	PressableProps,
	RichTextProps,
	RichTextSpanProps,
	RowProps,
	ScreenProps,
	SafeAreaProps,
	ScrollBoxProps,
	ScrollViewProps,
	SpacerProps,
	StackProps,
	SwitchProps,
	TabsProps,
	TextAreaProps,
	TextInputProps,
	TextProps,
	ViewProps,
} from './props'
