// Experimental AppKit public surface. Components with a direct AppKit
// equivalent use the host renderer. The barrel exposes the same names as the
// shared surface (`index.shared.ts`); AppKit-only contracts live under the
// explicit `@octane-xplat/ui/macos` subpath instead.
export type * from './index.shared'
export { View } from './components/layout/View.macos.tsrx'
/** Vertical flow stack (Astryx `Stack` direction="vertical"). */
export { VStack } from './components/layout/VStack.macos.tsrx'
/** Horizontal flow stack (Astryx `Stack` direction="horizontal"). */
export { HStack } from './components/layout/HStack.macos.tsrx'
export { Grid, Stack, StackItem, Absolute, Spacer } from './components/layout/layout.macos.tsrx'
export { Center } from './components/layout/Center.macos.tsrx'
export { Section } from './components/collections/Section.macos.tsrx'
export { Layout, LayoutHeader, LayoutContent } from './components/layout/layout.macos.tsrx'
export { AspectRatio } from './components/layout/AspectRatio.macos.tsrx'
export { VisuallyHidden } from './components/content/VisuallyHidden.macos.tsrx'
/** Native per-window focus ownership. Check getFocusScopeCapabilities() for
 * bridge availability; actual OS input/accessibility remains unqualified. */
export { FocusScope, getFocusScopeCapabilities } from './components/overlays/FocusScope.macos.tsrx'
export { setTranslate } from './internal/layout/translate.macos'
export { Text, RichText, RichTextSpan } from './components/content/Text.macos.tsrx'
export { Pressable } from './components/actions/Pressable.macos.tsrx'
export {
	Button,
	Switch,
	Slider,
	SegmentedControl,
	SearchInput,
} from './components/actions/controls.macos.tsrx'

/** Color suite — self-drawn picker parts on the AppKit renderer. */
export { ColorArea } from './components/forms/ColorArea.macos.tsrx'
export { ColorSlider } from './components/forms/ColorSlider.macos.tsrx'
export { ColorSwatch } from './components/forms/ColorSwatch.macos.tsrx'
export { ColorField } from './components/forms/ColorField.macos.tsrx'
export { ColorPicker } from './components/forms/ColorPicker.macos.tsrx'
export { IconButton } from './components/media/IconButton.macos.tsrx'
export { ButtonGroup } from './components/actions/ButtonGroup.macos.tsrx'
export { ToggleButton, ToggleButtonGroup } from './components/actions/ToggleButton.macos.tsrx'
/** Self-drawn checkbox, exported under Astryx's component name. */
export { Checkbox as CheckboxInput } from './components/actions/controls.macos.tsrx'
/** Loading indicator, exported under Astryx's component name. */
export { ActivityIndicator as Spinner } from './components/actions/controls.macos.tsrx'

export { Collapsible } from './components/collections/Collapsible.macos.tsrx'
export { Accordion } from './components/collections/Accordion.macos.tsrx'
/** Single-choice option list, exported under Astryx's component name. */
export { RadioGroup as RadioList } from './components/forms/RadioGroup.macos.tsrx'
export { DropdownMenu } from './components/overlays/DropdownMenu.macos.tsrx'
export { MoreMenu } from './components/overlays/MoreMenu.macos.tsrx'
export { ContextMenu } from './components/overlays/ContextMenu.macos.tsrx'
export { Badge } from './components/feedback/Badge.macos.tsrx'
/** Visual separator between content sections, exported under Astryx's name. */
export { Separator as Divider } from './components/feedback/Separator.macos.tsrx'
export { Skeleton } from './components/feedback/Skeleton.macos.tsrx'
export { Avatar } from './components/media/Avatar.macos.tsrx'
export { AvatarGroup } from './components/media/AvatarGroup.macos.tsrx'
/** Labeled control wrapper, exported under Astryx's component name. */
export { FormField as Field } from './components/forms/FormField.macos.tsrx'
export { useFieldControl } from './components/forms/field-context'
/** Shared element-size cascade (Astryx `SizeContext`/`SizeProvider`/`useSize`). */
export { SizeContext, SizeProvider, useSize } from './components/layout/size-context'
export { FieldGroup } from './components/forms/FieldGroup.macos.tsrx'
/** Reusable labeled row, exported under Astryx's component name. */
export { Item } from './components/collections/Item.macos.tsrx'
export { List } from './components/collections/List.macos.tsrx'
export { ListItem } from './components/collections/ListItem.macos.tsrx'
/** Interactive 2D cell collection — React Aria `GridList`/`useGridList`. */
export { GridList } from './components/collections/GridList.macos.tsrx'
export { useGridList } from './components/collections/use-grid-list.tsrx'
export { FormLayout } from './components/forms/FormLayout.macos.tsrx'
export { InputGroup, InputGroupText } from './components/forms/InputGroup.macos.tsrx'
export { CheckboxIndicator } from './components/forms/CheckboxIndicator.macos.tsrx'
export { CheckIndicator } from './components/feedback/CheckIndicator.macos.tsrx'
export { RadioIndicator } from './components/forms/RadioIndicator.macos.tsrx'
export {
	defaultIndicators,
	getIndicator,
	registerIndicator,
	registerIndicators,
	indicatorScope,
} from './components/feedback/indicators'

export { useIndicator } from './components/feedback/use-indicator.tsrx'

/** Bounded numeric entry, exported under Astryx's component name. */
export { InputNumber as NumberInput } from './components/forms/InputNumber.macos.tsrx'
export { PinInput } from './components/forms/PinInput.macos.tsrx'
/** Option picker, exported under Astryx's component name. */
export { Select as Selector } from './components/forms/Select.macos.tsrx'
/** Multi-choice option picker, exported under Astryx's component name. */
export { SelectMenu as MultiSelector } from './internal/rendering/aliases.macos.tsrx'
export { BaseTypeahead, Typeahead } from './components/forms/Typeahead.macos.tsrx'
export { TypeaheadItem } from './components/forms/TypeaheadItem.macos.tsrx'
export { createStaticSource } from './components/forms/typeahead-source'
export { Token } from './components/forms/Token.macos.tsrx'
export { Tokenizer } from './components/forms/Tokenizer.macos.tsrx'
export { ComplexSelector } from './components/collections/ComplexSelector.macos.tsrx'
export { Calendar } from './components/forms/Calendar.macos.tsrx'
export { DateInput } from './components/forms/DateInput.macos.tsrx'
export { TimeInput } from './components/forms/TimeInput.macos.tsrx'
export { DateTimeInput } from './components/forms/DateTimeInput.macos.tsrx'
export { DateRangeInput } from './components/forms/DateRangeInput.macos.tsrx'
export {
	useCalendarDays,
	useCalendarConstraints,
	useCalendarNavigation,
} from './components/forms/calendar-hooks.tsrx'

export { isSameDay, isDateInRange, getWeekNumber } from './components/forms/calendar-core'

export { InputRating } from './components/forms/InputRating.macos.tsrx'
/** Multi-choice checkbox list, exported under Astryx's component name. */
export { CheckboxGroup as CheckboxList } from './components/forms/CheckboxGroup.macos.tsrx'
/** Ancestor path trail, exported under Astryx's component name. */
export { Breadcrumb as Breadcrumbs } from './components/navigation/Breadcrumb.macos.tsrx'
export { Pagination } from './components/collections/Pagination.macos.tsrx'
export { Stepper } from './components/collections/Stepper.macos.tsrx'
export { NavigationMenu } from './components/navigation/NavigationMenu.macos.tsrx'
export { AppShell } from './components/layout/AppShell.macos.tsrx'
export { AppShellMobileContext } from './components/layout/AppShell.macos.tsrx'
export {
	TopNav,
	TopNavHeading,
	TopNavItem,
	TopNavMenu,
	TopNavMegaMenu,
	TopNavMegaMenuItem,
	TopNavMegaMenuFeaturedCard,
} from './components/navigation/TopNav.macos.tsrx'

export { TopNavRenderContext, useTopNavRenderMode } from './components/navigation/TopNav.macos.tsrx'
export {
	SideNav,
	SideNavSection,
	SideNavHeading,
	SideNavItem,
	SideNavCollapseButton,
	useSideNavCollapse,
	SideNavRenderContext,
	useSideNavRenderMode,
} from './components/navigation/SideNav.macos.tsrx'

export {
	MobileNav,
	MobileNavToggle,
	useAppShellMobile,
} from './components/navigation/MobileNav.macos.tsrx'

export { NavIcon } from './components/navigation/NavIcon.macos.tsrx'
export { NavHeadingMenu, NavHeadingMenuItem } from './components/navigation/NavMenu.macos.tsrx'
export {
	NavHeadingMenuContext,
	NavHeadingCloseContext,
	useNavHeadingMenuContext,
	useNavHeadingCloseContext,
} from './components/navigation/NavMenu.macos.tsrx'

export {
	TabList,
	Tab,
	TabMenu,
	useTabListContext,
} from './components/collections/TabList.macos.tsrx'

export { Toolbar } from './components/layout/Toolbar.macos.tsrx'
export { OverflowList } from './components/collections/OverflowList.macos.tsrx'
export { useResizable } from './components/layout/useResizable.macos.tsrx'
export { ResizeHandle } from './components/layout/ResizeHandle.macos.tsrx'
export { pixel, percent } from './components/layout/resize-math'
export { CommandPalette } from './components/overlays/CommandPalette.macos.tsrx'
export { Table } from './table/Table.macos.tsrx'
export { TableHeader } from './table/Table.macos.tsrx'
export { TableBody } from './table/Table.macos.tsrx'
export { TableFooter } from './table/Table.macos.tsrx'
export { TableRow } from './table/Table.macos.tsrx'
export { TableCell } from './table/Table.macos.tsrx'
export { TableHeaderCell } from './table/Table.macos.tsrx'
export { TableSelectionToolbar } from './table/TableSelectionToolbar.tsrx'
export {
	proportional,
	generateColumns,
	resolveColumnWidths,
	defaultCellRenderer,
	capitalize,
	DEFAULT_MIN_COLUMN_WIDTH,
} from './table/column-utils'

export { paginateData } from './table/paginate-data'
export { useTableSelection, useTableSelectionState } from './table/use-table-selection.tsrx'
export { useTableSortable } from './table/use-table-sortable.tsrx'
export { useTableSortableState, sortTableData } from './table/use-table-sortable-state'
export { useTablePagination } from './table/use-table-pagination.tsrx'
export {
	useTableColumnSettings,
	useTableColumnSettingsState,
} from './table/use-table-column-settings'

export { useTableColumnResize } from './table/use-table-column-resize.macos.tsrx'
export { useTableFilterState } from './table/use-table-filter-state'
export { useTableFiltering } from './table/use-table-filtering.tsrx'
export { useTableStickyColumns } from './table/use-table-sticky-columns.macos.tsrx'
export { useTableGroupedRows } from './table/use-table-grouped-rows.tsrx'
export { useTableRowIndex } from './table/use-table-row-index.tsrx'
export { useTableRowStatus } from './table/use-table-row-status.tsrx'
export { useTableRowExpansion } from './table/use-table-row-expansion.tsrx'
export { useTableTreeState } from './table/use-table-tree-state.tsrx'
export { useTableTreeData } from './table/use-table-tree-data.tsrx'
export { toSearchFilters } from './table/to-search-filters'
export { TableContext } from './table/table-context'
export { Timeline } from './components/forms/Timeline.macos.tsrx'
/** Expandable hierarchy, exported under Astryx's component name. */
export { Tree as TreeList } from './components/collections/Tree.macos.tsrx'
export { Alert } from './components/overlays/Alert.macos.tsrx'
export { Card } from './components/actions/Card.macos.tsrx'
export { ClickableCard } from './components/actions/ClickableCard.macos.tsrx'
export { SelectableCard } from './components/actions/SelectableCard.macos.tsrx'
export { Chip } from './components/actions/Chip.macos.tsrx'
export { Kbd } from './components/content/Kbd.macos.tsrx'
/** Empty-state block, exported under Astryx's component name. */
export { Empty as EmptyState } from './components/feedback/Empty.macos.tsrx'
export { Banner } from './components/feedback/Banner.macos.tsrx'
export { User } from './components/content/User.macos.tsrx'
export { ProgressGroup } from './components/feedback/ProgressGroup.macos.tsrx'

export { HoverCard } from './components/overlays/HoverCard.tsrx'
export { useHoverCard } from './components/overlays/use-hover-card.tsrx'
export { useLayer } from './components/overlays/use-layer.tsrx'
export { usePopover } from './components/overlays/use-popover.tsrx'
export { useTooltip } from './components/overlays/use-tooltip.tsrx'
export { useMediaQuery } from './internal/platform/use-media-query.macos.tsrx'
export {
	LayerProvider,
	LayerContext,
	useLayerContext,
} from './components/overlays/layer-provider.tsrx'

export { Tooltip } from './components/overlays/Tooltip.tsrx'
export { Link } from './components/navigation/Link.macos.tsrx'
export { NavLink } from './components/navigation/NavLink.macos.tsrx'
export { TextInput, TextArea } from './components/forms/text-controls.macos.tsrx'
export { ScrollableArea } from './components/layout/ScrollableArea.macos.tsrx'
export { useScrollableArea } from './components/layout/use-scrollable-area.macos.tsrx'
export { VirtualList } from './components/collections/VirtualList.macos.tsrx'
export { Image } from './components/media/Image.macos.tsrx'
/** Image source → `thumbhash:<base64>` URI — decode, ≤100px scale, RGBA
 *  extract, encode (NSBitmapImageRep + CoreGraphics). */
export { thumbHashUri } from './components/media/thumbhash.macos'
export {
	/** RGBA pixels → ThumbHash bytes (Evan Wallace reference port). */
	rgbaToThumbHash,
	/** RGBA pixels → `thumbhash:<base64>`. */
	rgbaToThumbHashUri,
} from './components/media/hash-image'

export {
	PowerSearch,
	PowerSearchToken,
	PowerSearchFilterEditor,
} from './components/forms/PowerSearch.macos.tsrx'

export {
	createPowerSearchConfig,
	usePowerSearchConfig,
	resolveOperatorLabel,
} from './components/forms/power-search-config'

export { WebView } from './components/media/WebView.macos.tsrx'
export { postToHost } from './components/media/webview-post'
export { Overlay } from './components/overlays/surfaces.macos.tsrx'
export { Popover } from './components/overlays/Popover.macos.tsrx'
export { Dialog, DialogHeader } from './components/overlays/Dialog.macos.tsrx'
export { AlertDialog } from './components/overlays/AlertDialog.macos.tsrx'
export { BottomSheet, BottomSheetSwitcher } from './components/overlays/BottomSheet.macos.tsrx'
export { Carousel } from './components/layout/Carousel.macos.tsrx'
export { Lightbox } from './components/overlays/Lightbox.macos.tsrx'
export { useLightbox } from './components/overlays/use-lightbox.macos.tsrx'
export { Toast } from './components/overlays/Toast.macos.tsrx'
export { ToastViewport } from './components/overlays/toast-viewport.macos.tsrx'
export { showToast, useToast } from './components/overlays/toast-service.macos.tsrx'
export { useImperativeDialog } from './components/overlays/use-imperative-dialog.macos.tsrx'
export { useImperativeAlertDialog } from './components/overlays/use-imperative-alert-dialog.macos.tsrx'
export { useAnimation } from './internal/platform/anim.macos.tsrx'
export {
	useThemeScheme,
	getThemeScheme,
	useThemePreference,
	setThemePreference,
	getThemePreference,
	onThemeSchemeChange,
} from './theme/theme-scheme'

export { themeSchemeClasses, applyThemeClasses } from './theme/theme-host'

export { useColorScheme, getColorScheme } from './theme/colorScheme.macos'
export { styled } from './internal/layout/styled.macos.tsrx'
export { openWindow } from './internal/platform/windows.macos'
export { Screen } from './components/layout/Screen.macos.tsrx'
export { Tabs } from './components/collections/Tabs.macos.tsrx'
export { SafeArea } from './components/layout/layout-shells.macos.tsrx'
export { KeyboardAvoiding } from './components/layout/KeyboardAvoiding.macos.tsrx'
export { useSafeAreaInsets } from './components/layout/safeAreaInsets.macos.tsrx'
export { useMeasure } from './components/layout/useMeasure.macos.tsrx'
export { Meter } from './components/feedback/Meter.macos.tsrx'
export { Heading } from './components/content/Heading.macos.tsrx'
export { Icon } from './components/media/Icon.macos.tsrx'
export { IconRegistryProvider } from './components/media/IconRegistryProvider.macos.tsrx'
export { createIconRegistry, registerIcon, registerIcons } from './components/media/icons'

export const isNative = true as const

// Focus hooks — shared/native leaves; focus modality and landmark cycling
// are web-only, so these keep API shape with constant results.
export { useFocus, useFocusRing } from './internal/accessibility/use-focus.tsrx'
export { useFocusVisible, isFocusVisible } from './internal/accessibility/use-focus-visible.tsrx'
export { useFocusWithin } from './internal/accessibility/use-focus-within.macos.tsrx'
export { useLandmark } from './internal/accessibility/use-landmark.macos.tsrx'

// Small React Aria utility counterparts — prop/ref/keyboard/clipboard.
export { mergeProps } from './internal/layout/merge-props'
export { useKeyboardInset } from './internal/keyboard/use-keyboard-inset.macos.tsrx'
export { useKeyboard } from './internal/keyboard/use-keyboard'
export { useObjectRef } from './internal/accessibility/use-object-ref'
export { useClipboard } from './internal/platform/use-clipboard.tsrx'
export { copyText } from './internal/platform/clipboard-write'
export { refList, mergedRef } from './internal/accessibility/ref-list'

export { openBottomSheet, closeBottomSheet } from './components/overlays/bottom-sheet-service.macos'

export { Blockquote } from './components/content/Blockquote.macos.tsrx'
export { Code } from './components/content/Code.macos.tsrx'
export { CodeBlock } from './components/content/CodeBlock.macos.tsrx'
export { MetadataList } from './components/content/MetadataList.macos.tsrx'
export { MetadataListItem } from './components/content/MetadataListItem.macos.tsrx'
export { Thumbnail } from './components/media/Thumbnail.macos.tsrx'
export { ProgressBar } from './components/feedback/ProgressBar.macos.tsrx'
export { StatusDot } from './components/feedback/StatusDot.macos.tsrx'
export { Timestamp } from './components/forms/Timestamp.macos.tsrx'
export { Timer } from './components/forms/Timer.macos.tsrx'
export { Citation } from './components/content/Citation.macos.tsrx'
export { Outline } from './components/collections/Outline.macos.tsrx'

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
} from './components/overlays/MenuParts.macos.tsrx'

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
} from './components/overlays/MenuParts.macos.tsrx'

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
} from './components/overlays/MenuParts.macos.tsrx'

export { DropdownMenuContext, useDropdownMenuContext } from './components/overlays/menu-context'

export { useImperativeBottomSheet } from './components/overlays/use-imperative-bottom-sheet.macos.tsrx'

export { RouteOutlet } from './routing/RouteOutlet.macos.tsrx'

export { useContainerReveal } from './components/layout/use-container-reveal.macos.tsrx'
export { useImageMode } from './components/media/use-image-mode.tsrx'

export { InternationalizationProvider } from './components/forms/InternationalizationProvider.macos.tsrx'
export {
	useLocale,
	useDirection,
	useTranslator,
	getLocaleDirection,
	frFR,
} from './internal/platform/internationalization'

export { useAnnounce } from './components/content/use-announce'

// Complete the shared value surface; `export type *` above supplies types only.
export { AvatarGroupOverflow } from './components/media/AvatarGroup.macos.tsrx'
export { AvatarStatusDot } from './components/media/Avatar.macos.tsrx'
export { BreadcrumbItem } from './components/navigation/Breadcrumb.macos.tsrx'
export { CollapsibleGroup } from './components/collections/Collapsible.macos.tsrx'
export { GridSpan } from './components/layout/Grid.tsrx'
export { LayoutFooter, LayoutPanel } from './components/layout/layout.macos.tsrx'
export { CheckboxListItem } from './components/forms/CheckboxListItem.macos.tsrx'
export { RadioListItem } from './components/forms/RadioListItem.macos.tsrx'
export { SegmentedControlItem } from './components/forms/SegmentedControlItem.macos.tsrx'
export { SelectorOption } from './components/forms/SelectorOption.tsrx'
export { Step } from './components/collections/Step.tsrx'
export { FieldLabel } from './components/forms/FieldLabel.tsrx'
export { FieldStatus } from './components/forms/FieldStatus.tsrx'
export { LinkContext } from './components/navigation/link-context'
export { LinkProvider } from './components/navigation/LinkProvider.tsrx'
export { useLinkComponent } from './components/navigation/use-link-component.tsrx'
export { useGridFocus } from './components/collections/use-grid-focus.macos.tsrx'
export { Theme } from './theme/Theme.macos.tsrx'
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
export { useTheme, useThemeName } from './theme/use-theme.tsrx'
