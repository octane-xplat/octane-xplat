// GTK/GJS surface. Add shared leaves only with maintained GTK runtime checks.
export { Text } from './components/content/Text'
export { Pressable } from './components/actions/Pressable'
export { View } from './components/layout/View'
export { VStack } from './components/layout/VStack'
export { HStack } from './components/layout/HStack'
export { Grid, GridSpan } from './components/layout/Grid'
export { Stack } from './components/layout/Stack'
export { StackItem } from './components/layout/StackItem'
export { Center } from './components/layout/Center'
export { Section } from './components/collections/Section'
export { Layout, LayoutHeader, LayoutContent, LayoutFooter, LayoutPanel } from './components/layout/Layout'
export { Absolute } from './components/layout/Absolute'
export { Spacer } from './components/layout/Spacer'
export { Badge } from './components/feedback/Badge'
export { Separator as Divider } from './components/feedback/Separator'
export { ColorSwatch } from './components/forms/ColorSwatch'
export { SizeContext, SizeProvider, useSize } from './components/layout/size-context'
export type {
	TextProps,
	PressableProps,
	ViewProps,
	VStackProps,
	HStackProps,
	GridProps,
	GridSpanProps,
	StackProps,
	StackItemProps,
	CenterProps,
	SectionProps,
	LayoutProps,
	LayoutHeaderProps,
	LayoutContentProps,
	LayoutFooterProps,
	LayoutPanelProps,
	AbsoluteProps,
	SpacerProps,
	BadgeProps,
	SeparatorProps,
	ColorSwatchProps,
	ElementSize,
	PanEvent,
	PanState,
	SwipeEvent,
} from './props'

export { useMeasure } from './components/layout/useMeasure'
export { AspectRatio } from './components/layout/AspectRatio'
export type {
	MeasureBounds,
	MeasureResult,
	UseMeasureOptions,
	AspectRatioProps,
	AspectRatioFit,
	AspectRatioShape,
} from './props'

export { setTranslate } from './internal/layout/translate'
export { useAnimation } from './internal/platform/anim'
export type { SetTranslate, AnimatedValue, AnimationResult } from './props'

export { useScrollableArea } from './components/layout/use-scrollable-area'
export type {
	ScrollAxis,
	ScrollAxisState,
	ScrollableAreaState,
	ScrollKeyboardAccess,
	ScrollOverscroll,
	ScrollStickyContainment,
	UseScrollableAreaOptions,
	UseScrollableAreaViewportProps,
	UseScrollableAreaContentProps,
	UseScrollableAreaResult,
} from './props'

export { ScrollableArea } from './components/layout/ScrollableArea'
export { ActivityIndicator as Spinner } from './components/feedback/ActivityIndicator'
export type {
	ScrollableAreaProps,
	ScrollableAreaHandle,
	ActivityIndicatorProps,
	SpinnerProps,
} from './props'

export { Icon } from './components/media/Icon'
export { IconRegistryProvider } from './components/media/IconRegistryProvider'
export { createIconRegistry, registerIcon, registerIcons } from './components/media/icons'
export type { IconGlyph, IconRegistry } from './components/media/icons'
export type {
	IconProps,
	BuiltinIconName,
	IconName,
	IconNameRegistry,
	IconRegistryProviderProps,
} from './props'

export { Tooltip } from './components/overlays/Tooltip'
export type { TooltipProps, PopoverPlacement } from './props'

export { Popover } from './components/overlays/Popover'
export type { PopoverProps, PopoverAlignment, PopoverAnchorRef } from './props'

export { Select as Selector } from './components/forms/Select'
export { SelectMenu as MultiSelector } from './internal/rendering/aliases'
export type {
	SelectorProps,
	MultiSelectorProps,
	SelectOption,
	SelectProps,
	SelectBaseProps,
	SelectSingleProps,
	SelectMultipleProps,
	SelectPresentation,
	SelectVariant,
} from './props'

export { pixel, percent } from './components/layout/resize-math'
export { isNative } from './internal/platform/platform'
export { mergeProps } from './internal/layout/merge-props'
export { useObjectRef } from './internal/accessibility/use-object-ref'
export { refList, mergedRef } from './internal/accessibility/ref-list'
export { createStaticSource } from './components/forms/typeahead-source'
export { rgbaToThumbHash, rgbaToThumbHashUri } from './components/media/hash-image'
export {
	proportional,
	generateColumns,
	resolveColumnWidths,
	defaultCellRenderer,
	capitalize,
	DEFAULT_MIN_COLUMN_WIDTH,
} from './table/column-utils'
export { paginateData } from './table/paginate-data'
export { sortTableData } from './table/use-table-sortable-state'
export { toSearchFilters } from './table/to-search-filters'
export {
	defineTheme,
	isDefinedTheme,
	registerTheme,
	getRegisteredTheme,
	getRegisteredThemes,
	resolveThemeToken,
	resolveThemeTokens,
	defaultThemeTokens,
} from './theme/defined-theme'
export { generateThemeCss } from './theme/theme-css'
export {
	useThemeScheme,
	getThemeScheme,
	useThemePreference,
	setThemePreference,
	getThemePreference,
	onThemeSchemeChange,
} from './theme/theme-scheme'
export type { ThemePreference, ThemeScheme } from './theme/theme-scheme'
export { themeSchemeClasses, applyThemeClasses } from './theme/theme-host'
export type { ThemeClassHost } from './theme/theme-host'
export { Theme } from './theme/Theme'
export type { ThemeProps } from './theme/Theme'
export { useTheme, useThemeName } from './theme/use-theme'
export type { UseThemeReturn } from './theme/use-theme'
export { useColorScheme, getColorScheme } from './theme/colorScheme'
export type { ColorScheme } from './theme/colorScheme'
export { useMediaQuery } from './internal/platform/use-media-query'
export { useClipboard } from './internal/platform/use-clipboard'
export type { UseClipboardOptions, UseClipboardResult } from './internal/platform/use-clipboard'
export { copyText } from './internal/platform/clipboard-write'
export { useAnnounce } from './components/content/use-announce'
export type { AnnouncePoliteness } from './components/content/use-announce'
export { useFocus, useFocusRing } from './internal/accessibility/use-focus'
export type { FocusEventPayload, UseFocusOptions, UseFocusRingResult } from './internal/accessibility/use-focus'
export { useFocusVisible, isFocusVisible } from './internal/accessibility/use-focus-visible'
export type { FocusInputModality, UseFocusVisibleResult } from './internal/accessibility/use-focus-visible'
export { useFocusWithin } from './internal/accessibility/use-focus-within'
export type { UseFocusWithinOptions, UseFocusWithinResult } from './internal/accessibility/use-focus-within'
export { useLandmark } from './internal/accessibility/use-landmark'
export type { UseLandmarkOptions, LandmarkProps } from './internal/accessibility/use-landmark'
export { useKeyboard } from './internal/keyboard/use-keyboard'
export type { KeyboardEvent, UseKeyboardOptions, UseKeyboardResult } from './internal/keyboard/use-keyboard'
export { useGridFocus } from './components/collections/use-grid-focus'
export type { GridFocusOptions, GridFocusResult } from './components/collections/use-grid-focus'
export { InternationalizationProvider } from './components/forms/InternationalizationProvider.tsrx'
export {
	useLocale,
	useDirection,
	useTranslator,
	getLocaleDirection,
	frFR,
} from './internal/platform/internationalization'
export { LinkProvider } from './components/navigation/LinkProvider'
export { useLinkComponent } from './components/navigation/use-link-component'
export { LinkContext } from './components/navigation/link-context'
export {
	createPowerSearchConfig,
	usePowerSearchConfig,
	resolveOperatorLabel,
} from './components/forms/power-search-config'
export { isSameDay, isDateInRange, getWeekNumber } from './components/forms/calendar-core'
export { Button } from './components/actions/Button'
export { IconButton } from './components/media/IconButton'
export { ToggleButton, ToggleButtonGroup } from './components/actions/ToggleButton'
export { ButtonGroup } from './components/actions/ButtonGroup'
export { ClickableCard } from './components/actions/ClickableCard'
export { Card } from './components/actions/Card'
export { Link } from './components/navigation/Link'
export { styled } from './internal/layout/styled'
export { Kbd } from './components/content/Kbd'
export { Heading } from './components/content/Heading'
export { Code } from './components/content/Code'
export { CodeBlock } from './components/content/CodeBlock'
export { ProgressBar } from './components/feedback/ProgressBar'
export { StatusDot } from './components/feedback/StatusDot'
export { Citation } from './components/content/Citation'
export { Outline } from './components/collections/Outline'
export { Blockquote } from './components/content/Blockquote'
export { Timestamp } from './components/forms/Timestamp'
export { Timer } from './components/forms/Timer'
export { Skeleton } from './components/feedback/Skeleton'
export { VisuallyHidden } from './components/content/VisuallyHidden'
export { Chip } from './components/actions/Chip'
export { Alert } from './components/overlays/Alert'
export { Banner } from './components/feedback/Banner'
export { Empty as EmptyState } from './components/feedback/Empty'
export { Meter } from './components/feedback/Meter'
export { ProgressGroup } from './components/feedback/ProgressGroup'
export { MetadataList } from './components/content/MetadataList'
export { MetadataListItem } from './components/content/MetadataListItem'
export { Timeline } from './components/forms/Timeline'
export { Item } from './components/collections/Item'
export { List } from './components/collections/List'
export { ListItem } from './components/collections/ListItem'
export { Toolbar } from './components/layout/Toolbar'
export { Step } from './components/collections/Step'
export { Stepper } from './components/collections/Stepper'
export { Pagination } from './components/collections/Pagination'
export { FieldLabel } from './components/forms/FieldLabel'
export { FieldStatus } from './components/forms/FieldStatus'
export type {
	ButtonProps,
	ButtonVariant,
	IconButtonProps,
	ToggleButtonProps,
	ToggleButtonGroupProps,
	ToggleButtonGroupSingleProps,
	ToggleButtonGroupMultipleProps,
	ButtonGroupProps,
	ClickableCardProps,
	CardProps,
	LinkProps,
	KbdProps,
	HeadingProps,
	CodeProps,
	CodeBlockProps,
	ProgressBarProps,
	StatusDotProps,
	CitationProps,
	OutlineProps,
	BlockquoteProps,
	TimestampProps,
	TimerProps,
	SkeletonProps,
	VisuallyHiddenProps,
	ChipProps,
	AlertProps,
	BannerProps,
	EmptyStateProps,
	MeterProps,
	ProgressGroupProps,
	MetadataListProps,
	MetadataListItemProps,
	TimelineProps,
	ItemProps,
	ListItemProps,
	ListProps,
	ToolbarProps,
	StepProps,
	StepperProps,
	PaginationProps,
	FieldLabelProps,
	FieldStatusComponentProps,
} from './props'
export type {
	SearchableItem,
	SearchRequest,
	SearchSource,
	CreateStaticSourceOptions,
	TableColumn,
	ColumnWidth,
	ProportionalWidth,
	PixelWidth,
	TableSortableColumnConfig,
	LinkProviderProps,
	InternationalizationProviderProps,
	InternationalizationMessages,
	PowerSearchConfig,
	DateRange,
	ISODateString,
} from './props'
export type { CalendarDay, CalendarMonthGrid } from './components/forms/calendar-core'
export type { DefinedTheme, DefineThemeInput, TokenValue } from './theme/defined-theme'
export type { FlatRef } from './internal/accessibility/ref-list'

export { TextInput } from './components/forms/TextInput'
export type {
	TextInputProps,
	TextInputHandle,
	FieldControlProps,
	FieldControlSize,
	FieldStatus as FieldStatusInfo,
	FieldStatusType,
	FieldStatusVariant,
} from './props'

export { TextArea } from './components/forms/TextArea'
export type { TextAreaProps } from './props'

export { SearchInput } from './components/forms/SearchInput'
export type { SearchInputProps } from './props'

export { FormField as Field } from './components/forms/FormField'
export { FormLayout } from './components/forms/FormLayout'
export type {
	FormFieldProps,
	FieldProps,
	FormLayoutProps,
	FormLayoutDirection,
	FormOptionality,
} from './props'

export { InputGroup, InputGroupText } from './components/forms/InputGroup'
export type { InputGroupProps, InputGroupTextProps, InputGroupSize } from './props'

export { FieldGroup } from './components/forms/FieldGroup'
export { useFieldControl } from './components/forms/field-context'
export type { FieldGroupProps } from './props'

export {
	CheckboxIndicator,
	CheckIndicator,
	RadioIndicator,
	defaultIndicators,
	getIndicator,
	registerIndicator,
	registerIndicators,
	indicatorScope,
} from './components/feedback/indicators'
export { useIndicator } from './components/feedback/use-indicator'
export type {
	IndicatorComponent,
	IndicatorFamily,
	IndicatorFamilyMap,
	IndicatorMap,
	IndicatorName,
	IndicatorNameOfFamily,
	IndicatorPosition,
	IndicatorProps,
	IndicatorRegistry,
	IndicatorSize,
	IndicatorState,
} from './props'

export { Checkbox as CheckboxInput } from './components/forms/Checkbox'
export { Switch } from './components/forms/Switch'
export type { CheckboxProps, CheckboxInputProps, SwitchProps } from './props'

export { RadioGroup as RadioList } from './components/forms/RadioGroup'
export { RadioListItem } from './components/forms/RadioListItem'
export type { RadioGroupProps, RadioListProps, RadioListItemProps, RadioOption } from './props'

export { InputNumber as NumberInput } from './components/forms/InputNumber'
export type { InputNumberProps, NumberInputProps } from './props'

export { CheckboxGroup as CheckboxList } from './components/forms/CheckboxGroup'
export { CheckboxListItem } from './components/forms/CheckboxListItem'
export type { CheckboxGroupProps, CheckboxListProps, CheckboxListItemProps } from './props'

export { SegmentedControl } from './components/forms/SegmentedControl'
export { SegmentedControlItem } from './components/forms/SegmentedControlItem'
export type { SegmentedControlProps, SegmentedControlItemProps } from './props'

export { PinInput } from './components/forms/PinInput'
export type { PinInputProps } from './props'

export { Slider } from './components/forms/Slider'
export type { SliderProps, SliderMark } from './props'

export { InputRating } from './components/forms/InputRating'
export type { InputRatingProps } from './props'

export { SelectorOption } from './components/forms/SelectorOption'
export type { SelectorOptionProps } from './props'

export { Image } from './components/media/Image'
export type {
	ImageProps,
	ImageContentFit,
	ImageContentPosition,
	ImageContentPositionObject,
	ImageContentPositionString,
	ImageContentPositionValue,
	ImageDecoding,
	ImageSourceLike,
} from './props'

export { thumbHashUri } from './components/media/thumbhash'

export { Thumbnail } from './components/media/Thumbnail'
export type { ThumbnailProps } from './props'

export { Avatar, AvatarStatusDot } from './components/media/Avatar'
export { AvatarGroup, AvatarGroupOverflow } from './components/media/AvatarGroup'
export type {
	AvatarProps,
	AvatarGroupProps,
	AvatarGroupOverflowProps,
	AvatarSize,
	AvatarStatusDotProps,
	AvatarStatusDotVariant,
} from './props'

export { User } from './components/content/User'
export type { UserProps } from './props'

export { DropdownMenu } from './components/overlays/DropdownMenu'
export { ContextMenu } from './components/overlays/ContextMenu'
export { MoreMenu } from './components/overlays/MoreMenu'
export {
	DropdownMenuItem,
	DropdownMenuLink,
	DropdownMenuSection,
	DropdownMenuSeparator,
	DropdownMenuDivider,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSubMenu,
} from './components/overlays/MenuParts'
export {
	DropdownMenuItem as ContextMenuItem,
	DropdownMenuLink as ContextMenuLink,
	DropdownMenuSection as ContextMenuSection,
	DropdownMenuSeparator as ContextMenuSeparator,
	DropdownMenuDivider as ContextMenuDivider,
	DropdownMenuCheckboxItem as ContextMenuCheckboxItem,
	DropdownMenuRadioGroup as ContextMenuRadioGroup,
	DropdownMenuRadioItem as ContextMenuRadioItem,
	DropdownMenuSubMenu as ContextMenuSubMenu,
} from './components/overlays/MenuParts'
export {
	DropdownMenuItem as BreadcrumbMenuItem,
	DropdownMenuLink as BreadcrumbMenuLink,
	DropdownMenuSection as BreadcrumbMenuSection,
	DropdownMenuSeparator as BreadcrumbMenuSeparator,
	DropdownMenuDivider as BreadcrumbMenuDivider,
	DropdownMenuCheckboxItem as BreadcrumbMenuCheckboxItem,
	DropdownMenuRadioGroup as BreadcrumbMenuRadioGroup,
	DropdownMenuRadioItem as BreadcrumbMenuRadioItem,
	DropdownMenuSubMenu as BreadcrumbMenuSubMenu,
} from './components/overlays/MenuParts'
export { DropdownMenuContext, useDropdownMenuContext } from './components/overlays/menu-context'
export type {
	DropdownMenuProps,
	DropdownMenuButtonProps,
	ContextMenuProps,
	MoreMenuProps,
	MoreMenuPlacement,
	MoreMenuAlignment,
	MoreMenuPresentation,
	MenuOption,
	MenuItem,
	MenuItemData,
	MenuActionData,
	MenuLinkData,
	MenuSectionData,
	MenuSeparatorData,
	MenuSubMenuData,
	MenuDividerData,
	MenuCheckboxData,
	MenuRadioOptionData,
	MenuRadioGroupData,
	MenuItemProps,
	MenuLinkProps,
	MenuSectionProps,
	MenuCheckboxItemProps,
	MenuRadioGroupProps,
	MenuRadioItemProps,
	MenuDividerProps,
	MenuSeparatorProps,
	MenuSubMenuProps,
	MenuContextValue,
} from './props'
export type {
	MenuItemProps as DropdownMenuItemProps,
	MenuLinkProps as DropdownMenuLinkProps,
	MenuSectionProps as DropdownMenuSectionProps,
	MenuSeparatorProps as DropdownMenuSeparatorProps,
	MenuDividerProps as DropdownMenuDividerProps,
	MenuCheckboxItemProps as DropdownMenuCheckboxItemProps,
	MenuRadioGroupProps as DropdownMenuRadioGroupProps,
	MenuRadioItemProps as DropdownMenuRadioItemProps,
	MenuSubMenuProps as DropdownMenuSubMenuProps,
} from './props'
export type {
	MenuItemProps as ContextMenuItemProps,
	MenuLinkProps as ContextMenuLinkProps,
	MenuSectionProps as ContextMenuSectionProps,
	MenuSeparatorProps as ContextMenuSeparatorProps,
	MenuDividerProps as ContextMenuDividerProps,
	MenuCheckboxItemProps as ContextMenuCheckboxItemProps,
	MenuRadioGroupProps as ContextMenuRadioGroupProps,
	MenuRadioItemProps as ContextMenuRadioItemProps,
	MenuSubMenuProps as ContextMenuSubMenuProps,
} from './props'
export type {
	MenuItemProps as BreadcrumbMenuItemProps,
	MenuLinkProps as BreadcrumbMenuLinkProps,
	MenuSectionProps as BreadcrumbMenuSectionProps,
	MenuSeparatorProps as BreadcrumbMenuSeparatorProps,
	MenuDividerProps as BreadcrumbMenuDividerProps,
	MenuCheckboxItemProps as BreadcrumbMenuCheckboxItemProps,
	MenuRadioGroupProps as BreadcrumbMenuRadioGroupProps,
	MenuRadioItemProps as BreadcrumbMenuRadioItemProps,
	MenuSubMenuProps as BreadcrumbMenuSubMenuProps,
} from './props'

export { Breadcrumb as Breadcrumbs, BreadcrumbItem } from './components/navigation/Breadcrumb'
export { HoverCard } from './components/overlays/HoverCard'
export { useHoverCard } from './components/overlays/use-hover-card'
export { useLayer } from './components/overlays/use-layer'
export { usePopover } from './components/overlays/use-popover'
export type {
	BreadcrumbsProps,
	BreadcrumbItemProps,
	BreadcrumbEntry,
	BreadcrumbMenuOption,
	BreadcrumbsVariant,
	HoverCardProps,
	HoverCardPlacement,
	HoverCardOptions,
	HoverCardReturn,
	LayerOptions,
	ContextLayerOptions,
	FixedLayerOptions,
	ContextLayerReturn,
	FixedLayerReturn,
	ContextRenderProps,
	FixedRenderProps,
	UsePopoverOptions,
	UsePopoverReturn,
} from './props'

export { Overlay } from './components/overlays/Overlay'
export { Dialog, DialogHeader } from './components/overlays/Dialog'
export { useImperativeDialog } from './components/overlays/use-imperative-dialog'
export { AlertDialog } from './components/overlays/AlertDialog'
export { useImperativeAlertDialog } from './components/overlays/use-imperative-alert-dialog'
export { FocusScope, getFocusScopeCapabilities } from './components/overlays/FocusScope'
export { LayerProvider, LayerContext, useLayerContext } from './components/overlays/layer-provider'
export type {
	OverlayProps,
	DialogProps,
	DialogHeaderProps,
	DialogOptions,
	ImperativeDialogReturn,
	AlertDialogProps,
	ImperativeAlertDialogReturn,
	FocusScopeProps,
	FocusScopeCapabilities,
	LayerProviderProps,
	LayerContextValue,
} from './props'

export { CommandPalette } from './components/overlays/CommandPalette'
export { Lightbox } from './components/overlays/Lightbox'
export { useLightbox } from './components/overlays/use-lightbox'
export { Drawer } from './components/navigation/Drawer'
export { Toast } from './components/overlays/Toast'
export { ToastViewport } from './components/overlays/toast-viewport'
export { showToast, useToast } from './components/overlays/toast-service'
export type {
	ShowToastFn,
	ToastCollisionBehavior,
	ToastContentRenderFn,
	ToastContentRenderProps,
	ToastDismissFn,
	ToastDismissReason,
	ToastHandle,
	ToastEntry,
	ToastOptions,
	ToastPosition,
	ToastProps,
	ToastType,
	ToastViewportProps,
	LayerToastConfig,
	CommandPaletteProps,
	CommandPaletteItem,
	CommandPaletteMenuItem,
	LightboxMedia,
	LightboxMediaType,
	LightboxProps,
	LightboxTriggerProps,
	UseLightboxOptions,
	UseLightboxReturn,
	DrawerProps,
} from './props'

export { BottomSheet, BottomSheetSwitcher } from './components/overlays/BottomSheet'
export { openBottomSheet, closeBottomSheet } from './components/overlays/bottom-sheet-service'
export { useImperativeBottomSheet } from './components/overlays/use-imperative-bottom-sheet'
export type {
	BottomSheetHandle,
	BottomSheetOpenOptions,
	BottomSheetProps,
	BottomSheetSnapPoint,
	BottomSheetSwitcherProps,
	OpenBottomSheet,
	ImperativeBottomSheetReturn,
	HostedComponent,
	HostedComponentProps,
	ModalOpenResult,
} from './props'

// Slice G — navigation, app chrome, screens, windows. Shared leaves back
// every component; GTK leaves cover host seams only (insets, keyboard,
// href opening, window service, resizable basis/persist, screen shell).
export { Screen } from './components/layout/Screen'
export { Tabs } from './components/collections/Tabs'
export type { TabSpec } from './components/collections/Tabs'
export { SafeArea } from './components/layout/SafeArea'
export { KeyboardAvoiding } from './components/layout/KeyboardAvoiding'
export { useSafeAreaInsets } from './components/layout/safeAreaInsets'
export type { SafeAreaInsets } from './components/layout/safeAreaInsets'
export { useKeyboardInset } from './internal/keyboard/use-keyboard-inset.tsrx'
export { useContainerReveal } from './components/layout/use-container-reveal'
export { useImageMode } from './components/media/use-image-mode'
export { openWindow } from './internal/platform/windows'
export { RouteOutlet } from './routing/RouteOutlet'
export { useResizable, ResizeHandle } from './components/layout/Resizable'
export { AppShell } from './components/layout/AppShell'
export { AppShellMobileContext } from './components/layout/AppShell'
export {
	TopNav,
	TopNavHeading,
	TopNavItem,
	TopNavMenu,
	TopNavMegaMenu,
	TopNavMegaMenuItem,
	TopNavMegaMenuFeaturedCard,
	TopNavRenderContext,
	useTopNavRenderMode,
} from './components/navigation/TopNav'
export {
	SideNav,
	SideNavSection,
	SideNavHeading,
	SideNavItem,
	SideNavCollapseButton,
	useSideNavCollapse,
	SideNavRenderContext,
	useSideNavRenderMode,
} from './components/navigation/SideNav'
export { MobileNav, MobileNavToggle, useAppShellMobile } from './components/navigation/MobileNav'
export { NavIcon } from './components/navigation/NavIcon'
export {
	NavHeadingMenu,
	NavHeadingMenuItem,
	NavHeadingMenuContext,
	NavHeadingCloseContext,
	useNavHeadingMenuContext,
	useNavHeadingCloseContext,
} from './components/navigation/NavMenu'
export { TabList, Tab, TabMenu, useTabListContext } from './components/collections/TabList'
export { NavigationMenu } from './components/navigation/NavigationMenu'
export { NavLink } from './components/navigation/NavLink'
export type {
	ScreenProps,
	ScreenComponent,
	TabsProps,
	SafeAreaProps,
	SafeAreaEdge,
	KeyboardAvoidingProps,
	UseKeyboardInsetOptions,
	UseContainerRevealOptions,
	UseContainerRevealReturn,
	UseImageModeOptions,
	ImageSampleRegion,
	OpenWindowOptions,
	WindowHandle,
	RouteOutletProps,
	ResizableConfig,
	ResizableDirection,
	ResizablePercentSize,
	ResizablePixelSize,
	ResizableMinConfig,
	ResizableMaxConfig,
	ResizableRegionSizing,
	ResizableProps,
	ResizableRegion,
	ResizableRegionConfig,
	ResizableSize,
	ResizeHandleProps,
	UseResizableMultiConfig,
	UseResizableSingleOptions,
	UseResizableSingleConfig,
	AppShellProps,
	AppShellMobileContextValue,
	AppShellVariant,
	AppShellBreakpoint,
	MobileNavConfig,
	MobileNavProps,
	MobileNavToggleProps,
	NavElementSize,
	NavHeadingMenuSize,
	NavHeadingCloseContextValue,
	NavHeadingMenuContextValue,
	NavHeadingMenuItemProps,
	NavHeadingMenuProps,
	NavIconProps,
	NavItemSize,
	SideNavCollapseButtonProps,
	SideNavCollapseState,
	SideNavCollapsibleConfig,
	SideNavControlledCollapsible,
	SideNavImperativeCollapseHandle,
	SideNavRenderMode,
	SideNavHeadingProps,
	SideNavItemProps,
	SideNavProps,
	SideNavSectionProps,
	TabListContextValue,
	TabListLayout,
	TabListOverflow,
	TabListPattern,
	TabListSize,
	TabListProps,
	TabMenuOption,
	TabMenuProps,
	TabProps,
	TopNavHeadingProps,
	TopNavItemProps,
	TopNavMenuItemData,
	TopNavMenuProps,
	TopNavMegaMenuFeaturedCardProps,
	TopNavMegaMenuItemProps,
	TopNavMegaMenuProps,
	TopNavProps,
	TopNavRenderMode,
	TopNavSlot,
	NavigationMenuItem,
	NavigationMenuProps,
	NavLinkComponentType,
	NavLinkProps,
	NavigationActivationEvent,
	NavigationTargetProps,
	NavigationLinkTargetProps,
} from './props'// Slice H — collections and tables. All components/hooks resolve to the
// shared universal leaves; the renderer gained the NativeScript-shaped view
// surface they measure and seek with (scrollTo, eachChildView,
// getLocationRelativeTo, getChildAt/getChildrenCount,
// getMeasuredWidth/Height, parent).
export { Collapsible, CollapsibleGroup } from './components/collections/Collapsible'
export { Accordion } from './components/collections/Accordion'
export { GridList } from './components/collections/GridList'
export { useGridList } from './components/collections/use-grid-list'
export type { UseGridListOptions, UseGridListResult } from './components/collections/use-grid-list'
export { OverflowList } from './components/collections/OverflowList'
export { VirtualList } from './components/collections/VirtualList'
export { Carousel } from './components/layout/Carousel'
export { Tree as TreeList } from './components/collections/Tree'
export { Table } from './Table'
export { TableHeader } from './Table'
export { TableBody } from './Table'
export { TableFooter } from './Table'
export { TableRow } from './Table'
export { TableCell } from './Table'
export { TableHeaderCell } from './Table'
export { TableSelectionToolbar } from './table/TableSelectionToolbar'
export { useTableSelection, useTableSelectionState } from './table/use-table-selection'
export { useTableSortable } from './table/use-table-sortable'
export { useTableSortableState } from './table/use-table-sortable-state'
export { useTablePagination } from './table/use-table-pagination'
export {
	useTableColumnSettings,
	useTableColumnSettingsState,
} from './table/use-table-column-settings'
export { useTableColumnResize } from './table/use-table-column-resize'
export { useTableFilterState } from './table/use-table-filter-state'
export { useTableFiltering } from './table/use-table-filtering'
export { useTableStickyColumns } from './table/use-table-sticky-columns'
export { useTableGroupedRows } from './table/use-table-grouped-rows'
export { useTableRowIndex } from './table/use-table-row-index'
export { useTableRowStatus } from './table/use-table-row-status'
export { useTableRowExpansion } from './table/use-table-row-expansion'
export { useTableTreeState } from './table/use-table-tree-state'
export { useTableTreeData } from './table/use-table-tree-data'
export { TableContext } from './table/table-context'
export type {
	AccordionBaseProps,
	AccordionItemSpec,
	AccordionMultipleProps,
	AccordionProps,
	AccordionSingleProps,
	CarouselHandle,
	CarouselProps,
	CollapsibleGroupProps,
	CollapsibleProps,
	GridListProps,
	OverflowItem,
	OverflowListProps,
	ScreenTable,
	TableCellProps,
	TableBodyProps,
	TableColumnAlign,
	TableDensity,
	TableDividers,
	TableFilterFieldRef,
	TableFooterProps,
	TableHeaderCellProps,
	TableHeaderProps,
	TableProps,
	TableRowProps,
	TableSelectionToolbarProps,
	TableTextOverflow,
	TableVerticalAlign,
	TreeListNode,
	TreeListProps,
	TreeProps,
	VirtualListHandle,
	VirtualListProps,
	VirtualListScrollOptions,
} from './props'
export type {
	BodyCellRenderProps,
	BodyRowRenderProps,
	HeaderCellRenderProps,
	HeaderRowRenderProps,
	ScrollWrapperRenderProps,
	TableContextAction,
	TableContextActions,
	TableContextValue,
	TableFilterState,
	TableFilterValue,
	TableFilterVariant,
	TableHostProps,
	TablePlugin,
	TableRenderProps,
	TableRowStatus,
	TableRowStatusColor,
	TableSelectionState,
	TableSemanticRowStatus,
	TableSortComparator,
	TableSortDirection,
	TableSortEntry,
	TableSortState,
	TableTreeRowMeta,
	UseTableGroupedRowsConfig,
	UseTableGroupedRowsResult,
	UseTableRowExpansionConfig,
	UseTableStickyColumnsConfig,
	UseTableTreeDataConfig,
} from './table/types'
export type {
	UseTableSelectionConfig,
	UseTableSelectionStateConfig,
	UseTableSelectionStateResult,
} from './table/use-table-selection'
export type { UseTableSortableConfig } from './table/use-table-sortable'
export type {
	UseTableSortableStateConfig,
	UseTableSortableStateResult,
} from './table/use-table-sortable-state'
export type { UseTablePaginationConfig } from './table/use-table-pagination'
export type {
	ColumnSettingsOption,
	UseTableColumnSettingsConfig,
	UseTableColumnSettingsStateConfig,
	UseTableColumnSettingsStateReturn,
} from './table/use-table-column-settings'
export type { UseTableColumnResizeConfig } from './table/use-table-column-resize'
export type { UseTableFilteringConfig } from './table/use-table-filtering'
export type { UseTableRowIndexConfig } from './table/use-table-row-index'
export type { UseTableRowStatusConfig } from './table/use-table-row-status'
export type {
	UseTableTreeStateConfig,
	UseTableTreeStateResult,
} from './table/use-table-tree-state'
export type { UseTableFilterStateResult } from './table/use-table-filter-state'

// Slice I — remaining inputs (typeahead/token/complex-selector, dates, colors,
// power search, rich text). Shared leaves; GTK leaves: LinearGradient.gtk.tsrx,
// coarse-pointer.gtk.ts. See research/GTK-SLICES.md row I.
export { RichText, RichTextSpan } from './components/content/RichText'
export { SelectableCard } from './components/actions/SelectableCard'
export { BaseTypeahead } from './components/forms/BaseTypeahead'
export { Typeahead } from './components/forms/Typeahead'
export { TypeaheadItem } from './components/forms/TypeaheadItem'
export { Token } from './components/forms/Token'
export { Tokenizer } from './components/forms/Tokenizer'
export { ComplexSelector } from './components/collections/ComplexSelector'
export {
	PowerSearch,
	PowerSearchToken,
	PowerSearchFilterEditor,
} from './components/forms/PowerSearch'
export { Calendar } from './components/forms/Calendar'
export { DateInput } from './components/forms/DateInput'
export { TimeInput } from './components/forms/TimeInput'
export { DateTimeInput } from './components/forms/DateTimeInput'
export { DateRangeInput } from './components/forms/DateRangeInput'
export {
	useCalendarDays,
	useCalendarConstraints,
	useCalendarNavigation,
} from './components/forms/calendar-hooks'
export { ColorArea } from './components/forms/ColorArea'
export { ColorSlider } from './components/forms/ColorSlider'
export { ColorField } from './components/forms/ColorField'
export { ColorPicker } from './components/forms/ColorPicker'

export type {
	UseCalendarDaysOptions,
	UseCalendarDaysReturn,
	UseCalendarConstraintsOptions,
	UseCalendarConstraintsReturn,
	UseCalendarNavigationOptions,
	UseCalendarNavigationReturn,
} from './components/forms/calendar-hooks'

export type {
	RichTextProps,
	RichTextSpanProps,
	SelectableCardProps,
	BaseTypeaheadProps,
	TypeaheadProps,
	TypeaheadItemProps,
	TypeaheadInputHandle,
	TypeaheadKeyDownHandler,
	TypeaheadKeyEvent,
	TokenColor,
	TokenProps,
	TokenSize,
	TokenizerChange,
	TokenizerHandle,
	TokenizerOverflowBehavior,
	TokenizerProps,
	TokenizerSize,
	ComplexSelectorHandle,
	ComplexSelectorProps,
	ComplexSelectorRenderProps,
	ComplexSelectorRenderState,
	ComplexSelectorSize,
	ComplexSelectorVariant,
	PowerSearchProps,
	PowerSearchSize,
	PowerSearchTokenProps,
	PowerSearchEditorProps,
	PowerSearchFilterEditorProps,
	PowerSearchComponentOverride,
	PowerSearchComponents,
	PowerSearchHandle,
	PowerSearchChangeType,
	PowerSearchField,
	PowerSearchOperator,
	PowerSearchOperatorBase,
	PowerSearchOperatorWithLabel,
	PowerSearchOperatorWithI18nKey,
	CustomOperatorEditorProps,
	OperatorValue,
	EmptyOperatorValue,
	StringOperatorValue,
	StringListOperatorValue,
	IntegerOperatorValue,
	FloatOperatorValue,
	TimeOperatorValue,
	DateAbsoluteOperatorValue,
	DateRelativeOperatorValue,
	DateRangeOperatorValue,
	EnumOperatorValue,
	EnumListOperatorValue,
	EntityListOperatorValue,
	CustomOperatorValue,
	NestedOperatorValue,
	FilterValue,
	FilterValueEmpty,
	FilterValueString,
	FilterValueStringList,
	FilterValueInteger,
	FilterValueFloat,
	FilterValueTime,
	FilterValueDateAbsolute,
	FilterValueDateRelative,
	FilterValueDateRange,
	FilterValueEnum,
	FilterValueEnumList,
	FilterValueEntityList,
	FilterValueCustom,
	FilterValueNested,
	PowerSearchFilter,
	PartialFilter,
	PowerSearchEntity,
	DateTimeRange,
	DateTimeRangePart,
	DateRangeFilterPreset,
	RelativeDateFilterPreset,
	FieldDefinition,
	PowerSearchFieldType,
	PowerSearchFieldTypeToJS,
	InferData,
	PowerSearchDefInfo,
	PowerSearchFilterFor,
	PowerSearchItem,
	PowerSearchAuxData,
	EnumItem,
	OperatorTokenizationConfig,
	CalendarProps,
	DateLocaleProps,
	DateInputMessages,
	CalendarSingleProps,
	CalendarRangeProps,
	CalendarHandle,
	DateInputProps,
	DateInputSize,
	DateInputFormat,
	DateInputPresentation,
	DateInputStatus,
	DateInputStatusType,
	DateRangeInputProps,
	DateRangeInputSize,
	DateRangeInputStatus,
	DateRangeInputStatusType,
	DateTimeInputProps,
	DateTimeInputSize,
	DateTimeInputHourFormat,
	DateTimeInputPresentation,
	DateTimeInputTimeIncrement,
	DateTimeInputTimeOptionInterval,
	DateTimeInputStatus,
	DateTimeInputStatusType,
	DayOfWeek,
	DayOfWeekName,
	InputPresentation,
	ISODateTimeString,
	ISOInstantString,
	ISOTimeString,
	PickerPresentation,
	DateRangePreset,
	TimeInputProps,
	TimeInputSize,
	TimeInputHourFormat,
	TimeInputPresentation,
	TimeInputStatus,
	TimeInputStatusType,
	ColorAreaProps,
	ColorBaseProps,
	ColorFieldProps,
	ColorPickerProps,
	ColorSliderProps,
	ColorValueProps,
} from './props'

// Slice J — embedded web document (WebKitGTK 6.0 `WebKit.WebView`). GTK leaf:
// WebView.gtk.tsrx. See research/GTK-SLICES.md row J.
export { WebView } from './components/media/WebView'
export type {
	WebViewContentSize,
	WebViewHandle,
	WebViewLoadEvent,
	WebViewProps,
} from './props'

// Slice K — declaration parity: shared type aliases whose GTK
// resolution is source-identical (works-as-is rows in gtk_ui_checks).
export type {
	AccessibilityProps,
	AppRouteContracts,
	AppRouteStacks,
	AppRouteTransitions,
	BadgeVariant,
	BannerStatus,
	BreadcrumbProps,
	ButtonGroupContextValue,
	ButtonGroupOrientation,
	CenterAxis,
	CitationSource,
	ClassValue,
	CodeColor,
	CodeSize,
	DialogPosition,
	DialogPurpose,
	DialogVariant,
	ElementComponent,
	ElementType,
	Elevation,
	EmptyProps,
	FlexContainerProps,
	GridResponsiveColumns,
	GridTrack,
	GridTrackList,
	HostElement,
	HoverCardAlignment,
	HoverCardFocusTrigger,
	HoverCardTouchTrigger,
	ItemComponent,
	ItemSlotProps,
	LayerAlignment,
	LayerPlacement,
	LayoutChildProps,
	LayoutComponent,
	LayoutHeight,
	LayoutRole,
	ListDensity,
	ListMarkerStyle,
	ListStyle,
	ManifestRouteNames,
	ManifestRouteParams,
	ManifestRoutePresentations,
	MetadataListColumns,
	MetadataListLabelConfig,
	OutlineFromViewCapabilities,
	OutlineItem,
	PlainDate,
	PlatformProps,
	ProgressBarMark,
	ProgressBarVariant,
	ProgressBarVariantMap,
	RefreshProps,
	Renderable,
	Role,
	RouteBoundaryProps,
	RouteContext,
	RouteDataMode,
	RouteDiagnostic,
	RouteDiagnosticCode,
	RouteErrorBoundaryProps,
	RouteHead,
	RouteHeadArgs,
	RouteHeadExport,
	RouteHeadFn,
	RouteJson,
	RouteManifest,
	RouteManifestJson,
	RouteMeta,
	RouteNameOfPath,
	RouteParamsFromSpecs,
	RoutePathParams,
	RoutePresentationsFromSpecs,
	RouteSpec,
	RouteSpecParams,
	RouteSpecSet,
	SectionDividerSide,
	SectionVariant,
	SharedDateFormat,
	SizeValue,
	SpacingStep,
	SpecRouteInfo,
	StackAlignment,
	StackCrossAlignment,
	StackDirection,
	StackItemCrossAlignSelf,
	StackItemSize,
	StackMainAlignment,
	StackPaddingProps,
	StackSizeProps,
	StackWrap,
	StatusDotVariantMap,
	StepperStep,
	StyleProp,
	StyledClass,
	StyledDef,
	StyledVariant,
	TestIDProps,
	TextColor,
	TextSize,
	TextType,
	TextWeight,
	TimelineItem,
	TimerFormat,
	TimestampFormat,
	TimestampTooltipEntry,
	TimestampTooltipFormat,
	TimestampValueUnit,
	ToolbarSize,
	ToolbarVariant,
	TooltipFocusTrigger,
	TooltipOptions,
	TooltipReturn,
	TooltipTouchTrigger,
} from './props'
export type {
	ResolvedColumnWidth,
	ResolvedColumnWidths,
} from './table/column-utils'
export type {
	ResolveThemeTokensOptions,
	ThemeMode,
} from './theme/defined-theme'
