export { usePanGesture$, usePinchGesture$, useInteractionScope$ } from './gestures/hooks.tsrx'
export { compete, simultaneous, prioritize } from './gestures/composition'
// GTK/GJS runtime values. Add shared leaves only with maintained GTK runtime checks.
// moduleSuffixes resolves this twin for package types, so re-export the
// shared type surface explicitly.
export type * from './index.shared'
export { Text } from './components/content/Text.tsrx'
export { Pressable } from './components/actions/Pressable.tsrx'
export { View } from './components/layout/View.tsrx'
export { VStack } from './components/layout/VStack.tsrx'
export { HStack } from './components/layout/HStack.tsrx'
export { Grid, GridSpan } from './components/layout/Grid.tsrx'
export { Stack } from './components/layout/Stack.tsrx'
export { StackItem } from './components/layout/StackItem.tsrx'
export { Center } from './components/layout/Center.tsrx'
export { Section } from './components/collections/Section.tsrx'
export {
  Layout,
  LayoutHeader,
  LayoutContent,
  LayoutFooter,
  LayoutPanel,
} from './components/layout/Layout.tsrx'

export { Absolute } from './components/layout/Absolute.tsrx'
export { Spacer } from './components/layout/Spacer.tsrx'
export { Badge } from './components/feedback/Badge.tsrx'
export { Separator as Divider } from './components/feedback/Separator.tsrx'
export { ColorSwatch } from './components/forms/ColorSwatch.tsrx'
export { SizeContext, SizeProvider, useSize } from './components/layout/size-context'

export { useMeasure$ } from './components/layout/useMeasure.tsrx'
export { AspectRatio } from './components/layout/AspectRatio.tsrx'

export { setTranslate } from './internal/layout/translate'
export { useAnimation } from './internal/platform/anim.tsrx'

export { useScrollableArea } from './components/layout/use-scrollable-area.tsrx'

export { ScrollableArea } from './components/layout/ScrollableArea.tsrx'
export { ActivityIndicator as Spinner } from './components/feedback/ActivityIndicator.tsrx'

export { Icon } from './components/media/Icon.tsrx'
export { IconRegistryProvider } from './components/media/IconRegistryProvider.tsrx'
export { createIconRegistry, registerIcon, registerIcons } from './components/media/icons'

export { Tooltip } from './components/overlays/Tooltip.tsrx'

export { Popover } from './components/overlays/Popover.tsrx'

export { Select as Selector } from './components/forms/Select.tsrx'
export { SelectMenu as MultiSelector } from './internal/rendering/aliases.tsrx'

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

export { themeSchemeClasses, applyThemeClasses } from './theme/theme-host'
export { Theme } from './theme/Theme.tsrx'
export { useTheme, useThemeName } from './theme/use-theme.tsrx'
export { useColorScheme, getColorScheme } from './theme/colorScheme'
export { useMediaQuery$ } from './internal/platform/use-media-query.tsrx'
export { useClipboard } from './internal/platform/use-clipboard.tsrx'
export { copyText } from './internal/platform/clipboard-write'
export { useAnnounce } from './components/content/use-announce'
export { useFocus, useFocusRing } from './internal/accessibility/use-focus.tsrx'
export { useFocusVisible, isFocusVisible } from './internal/accessibility/use-focus-visible.tsrx'
export { useFocusWithin } from './internal/accessibility/use-focus-within.tsrx'
export { useLandmark } from './internal/accessibility/use-landmark.tsrx'
export { useKeyboard } from './internal/keyboard/use-keyboard'
export { useGridFocus } from './components/collections/use-grid-focus'
export { InternationalizationProvider } from './components/forms/InternationalizationProvider.tsrx'
export {
  useLocale,
  useDirection,
  useTranslator,
  getLocaleDirection,
  frFR,
} from './internal/platform/internationalization'

export { LinkProvider } from './components/navigation/LinkProvider.tsrx'
export { useLinkComponent } from './components/navigation/use-link-component.tsrx'
export { LinkContext } from './components/navigation/link-context'
export {
  createPowerSearchConfig,
  usePowerSearchConfig,
  resolveOperatorLabel,
} from './components/forms/power-search-config'

export { isSameDay, isDateInRange, getWeekNumber } from './components/forms/calendar-core'
export { Button } from './components/actions/Button.tsrx'
export { IconButton } from './components/media/IconButton.tsrx'
export { ToggleButton, ToggleButtonGroup } from './components/actions/ToggleButton.tsrx'
export { ButtonGroup } from './components/actions/ButtonGroup.tsrx'
export { ClickableCard } from './components/actions/ClickableCard.tsrx'
export { Card } from './components/actions/Card.tsrx'
export { Link } from './components/navigation/Link.tsrx'
export { styled } from './internal/layout/styled.tsrx'
export { Kbd } from './components/content/Kbd.tsrx'
export { Heading } from './components/content/Heading.tsrx'
export { Code } from './components/content/Code.tsrx'
export { CodeBlock } from './components/content/CodeBlock.tsrx'
export { ProgressBar } from './components/feedback/ProgressBar.tsrx'
export { StatusDot } from './components/feedback/StatusDot.tsrx'
export { Citation } from './components/content/Citation.tsrx'
export { Outline } from './components/collections/Outline.tsrx'
export { Blockquote } from './components/content/Blockquote.tsrx'
export { Timestamp } from './components/forms/Timestamp.tsrx'
export { Timer } from './components/forms/Timer.tsrx'
export { Skeleton } from './components/feedback/Skeleton.tsrx'
export { VisuallyHidden } from './components/content/VisuallyHidden.tsrx'
export { Chip } from './components/actions/Chip.tsrx'
export { Alert } from './components/overlays/Alert.tsrx'
export { Banner } from './components/feedback/Banner.tsrx'
export { Empty as EmptyState } from './components/feedback/Empty.tsrx'
export { Meter } from './components/feedback/Meter.tsrx'
export { ProgressGroup } from './components/feedback/ProgressGroup.tsrx'
export { MetadataList } from './components/content/MetadataList.tsrx'
export { MetadataListItem } from './components/content/MetadataListItem.tsrx'
export { Timeline } from './components/forms/Timeline.tsrx'
export { Item } from './components/collections/Item.tsrx'
export { List } from './components/collections/List.tsrx'
export { ListItem } from './components/collections/ListItem.tsrx'
export { Toolbar } from './components/layout/Toolbar.tsrx'
export { Step } from './components/collections/Step.tsrx'
export { Stepper } from './components/collections/Stepper.tsrx'
export { Pagination } from './components/collections/Pagination.tsrx'
export { FieldLabel } from './components/forms/FieldLabel.tsrx'
export { FieldStatus } from './components/forms/FieldStatus.tsrx'

export { TextInput } from './components/forms/TextInput.tsrx'

export { TextArea } from './components/forms/TextArea.tsrx'

export { SearchInput } from './components/forms/SearchInput.tsrx'

export { FormField as Field } from './components/forms/FormField.tsrx'
export { FormLayout } from './components/forms/FormLayout.tsrx'

export { InputGroup, InputGroupText } from './components/forms/InputGroup.tsrx'

export { FieldGroup } from './components/forms/FieldGroup.tsrx'
export { useFieldControl } from './components/forms/field-context'

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

export { useIndicator } from './components/feedback/use-indicator.tsrx'

export { Checkbox as CheckboxInput } from './components/forms/Checkbox.tsrx'
export { Switch } from './components/forms/Switch.tsrx'

export { RadioGroup as RadioList } from './components/forms/RadioGroup.tsrx'
export { RadioListItem } from './components/forms/RadioListItem.tsrx'

export { InputNumber as NumberInput } from './components/forms/InputNumber.tsrx'

export { CheckboxGroup as CheckboxList } from './components/forms/CheckboxGroup.tsrx'
export { CheckboxListItem } from './components/forms/CheckboxListItem.tsrx'

export { SegmentedControl } from './components/forms/SegmentedControl.tsrx'
export { SegmentedControlItem } from './components/forms/SegmentedControlItem.tsrx'

export { PinInput } from './components/forms/PinInput.tsrx'

export { Slider } from './components/forms/Slider.tsrx'

export { InputRating } from './components/forms/InputRating.tsrx'

export { SelectorOption } from './components/forms/SelectorOption.tsrx'

export { Image } from './components/media/Image.tsrx'

export { thumbHashUri } from './components/media/thumbhash'

export { Thumbnail } from './components/media/Thumbnail.tsrx'

export { Avatar, AvatarStatusDot } from './components/media/Avatar.tsrx'
export { AvatarGroup, AvatarGroupOverflow } from './components/media/AvatarGroup.tsrx'

export { User } from './components/content/User.tsrx'

export { DropdownMenu } from './components/overlays/DropdownMenu.tsrx'
export { ContextMenu } from './components/overlays/ContextMenu.tsrx'
export { MoreMenu } from './components/overlays/MoreMenu.tsrx'
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
} from './components/overlays/MenuParts.tsrx'

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
} from './components/overlays/MenuParts.tsrx'

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
} from './components/overlays/MenuParts.tsrx'

export { DropdownMenuContext, useDropdownMenuContext } from './components/overlays/menu-context'

export { Breadcrumb as Breadcrumbs, BreadcrumbItem } from './components/navigation/Breadcrumb.tsrx'
export { HoverCard } from './components/overlays/HoverCard.tsrx'
export { useHoverCard } from './components/overlays/use-hover-card.tsrx'
export { useLayer } from './components/overlays/use-layer.tsrx'
export { usePopover } from './components/overlays/use-popover.tsrx'

export { Overlay } from './components/overlays/Overlay.tsrx'
export { Dialog, DialogHeader } from './components/overlays/Dialog.tsrx'
export { useImperativeDialog } from './components/overlays/use-imperative-dialog.tsrx'
export { AlertDialog } from './components/overlays/AlertDialog.tsrx'
export { useImperativeAlertDialog } from './components/overlays/use-imperative-alert-dialog.tsrx'
export { FocusScope, getFocusScopeCapabilities } from './components/overlays/FocusScope.tsrx'
export {
  LayerProvider,
  LayerContext,
  useLayerContext,
} from './components/overlays/layer-provider.tsrx'

export { CommandPalette } from './components/overlays/CommandPalette.tsrx'
export { Lightbox } from './components/overlays/Lightbox.tsrx'
export { useLightbox } from './components/overlays/use-lightbox.tsrx'
export { Toast } from './components/overlays/Toast.tsrx'
export { ToastViewport } from './components/overlays/toast-viewport.tsrx'
export { showToast, useToast } from './components/overlays/toast-service.tsrx'

export { BottomSheet } from './components/overlays/BottomSheet.tsrx'
export { openBottomSheet, closeBottomSheet } from './components/overlays/bottom-sheet-service'
export { useImperativeBottomSheet } from './components/overlays/use-imperative-bottom-sheet.tsrx'

// Slice G — navigation, app chrome, screens, windows. Shared leaves back
// every component; GTK leaves cover host seams only (insets, keyboard,
// href opening, window service, resizable basis/persist, screen shell).
export { Screen } from './components/layout/Screen.tsrx'
export { Tabs } from './components/collections/Tabs.tsrx'
export { SafeArea } from './components/layout/SafeArea.tsrx'
export { KeyboardAvoiding } from './components/layout/KeyboardAvoiding.tsrx'
export { useSafeAreaInsets } from './components/layout/safeAreaInsets.tsrx'
export { useKeyboardInset } from './internal/keyboard/use-keyboard-inset.tsrx'
export { useContainerReveal } from './components/layout/use-container-reveal.tsrx'
export { useImageMode } from './components/media/use-image-mode.tsrx'
export { openWindow } from './internal/platform/windows'
export { RouteOutlet } from './routing/RouteOutlet.tsrx'
export { useResizable, ResizeHandle } from './components/layout/Resizable'
export { AppShell } from './components/layout/AppShell.tsrx'
export { AppShellMobileContext } from './components/layout/AppShell.tsrx'
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
} from './components/navigation/TopNav.tsrx'

export {
  SideNav,
  SideNavSection,
  SideNavHeading,
  SideNavItem,
  SideNavCollapseButton,
  useSideNavCollapse,
  SideNavRenderContext,
  useSideNavRenderMode,
} from './components/navigation/SideNav.tsrx'

export {
  MobileNav,
  MobileNavToggle,
  useAppShellMobile,
} from './components/navigation/MobileNav.tsrx'

export { NavIcon } from './components/navigation/NavIcon.tsrx'
export {
  NavHeadingMenu,
  NavHeadingMenuItem,
  NavHeadingMenuContext,
  NavHeadingCloseContext,
  useNavHeadingMenuContext,
  useNavHeadingCloseContext,
} from './components/navigation/NavMenu.tsrx'

export { TabList, Tab, TabMenu, useTabListContext } from './components/collections/TabList.tsrx'
export { NavigationMenu } from './components/navigation/NavigationMenu.tsrx'
export { NavLink } from './components/navigation/NavLink.tsrx'
export { Collapsible, CollapsibleGroup } from './components/collections/Collapsible.tsrx'
export { Accordion } from './components/collections/Accordion.tsrx'
export { GridList } from './components/collections/GridList.tsrx'
export { useGridList } from './components/collections/use-grid-list.tsrx'
export { OverflowList } from './components/collections/OverflowList.tsrx'
export { VirtualList } from './components/collections/VirtualList.tsrx'
export { Carousel } from './components/layout/Carousel.tsrx'
export { Tree as TreeList } from './components/collections/Tree.tsrx'
export { Table } from './table/Table.tsrx'
export { TableHeader } from './table/Table.tsrx'
export { TableBody } from './table/Table.tsrx'
export { TableFooter } from './table/Table.tsrx'
export { TableRow } from './table/Table.tsrx'
export { TableCell } from './table/Table.tsrx'
export { TableHeaderCell } from './table/Table.tsrx'
export { TableSelectionToolbar } from './table/TableSelectionToolbar.tsrx'
export { useTableSelection, useTableSelectionState } from './table/use-table-selection.tsrx'
export { useTableSortable } from './table/use-table-sortable.tsrx'
export { useTableSortableState } from './table/use-table-sortable-state'
export { useTablePagination } from './table/use-table-pagination.tsrx'
export {
  useTableColumnSettings,
  useTableColumnSettingsState,
} from './table/use-table-column-settings'

export { useTableColumnResize } from './table/use-table-column-resize.tsrx'
export { useTableFilterState } from './table/use-table-filter-state'
export { useTableFiltering } from './table/use-table-filtering.tsrx'
export { useTableStickyColumns } from './table/use-table-sticky-columns.tsrx'
export { useTableGroupedRows } from './table/use-table-grouped-rows.tsrx'
export { useTableRowIndex } from './table/use-table-row-index.tsrx'
export { useTableRowStatus } from './table/use-table-row-status.tsrx'
export { useTableRowExpansion } from './table/use-table-row-expansion.tsrx'
export { useTableTreeState } from './table/use-table-tree-state.tsrx'
export { useTableTreeData } from './table/use-table-tree-data.tsrx'
export { TableContext } from './table/table-context'

// Slice I — remaining inputs (typeahead/token/complex-selector, dates, colors,
// power search, rich text). Shared leaves; GTK leaves: LinearGradient.gtk.tsrx,
// coarse-pointer.gtk.ts. See research/GTK-SLICES.md row I.
export { RichText, RichTextSpan } from './components/content/RichText.tsrx'
export { SelectableCard } from './components/actions/SelectableCard.tsrx'
export { BaseTypeahead } from './components/forms/BaseTypeahead.tsrx'
export { Typeahead } from './components/forms/Typeahead.tsrx'
export { TypeaheadItem } from './components/forms/TypeaheadItem.tsrx'
export { Token } from './components/forms/Token.tsrx'
export { Tokenizer } from './components/forms/Tokenizer.tsrx'
export { ComplexSelector } from './components/collections/ComplexSelector.tsrx'
export {
  PowerSearch,
  PowerSearchToken,
  PowerSearchFilterEditor,
} from './components/forms/PowerSearch.tsrx'

export { Calendar } from './components/forms/Calendar.tsrx'
export { DateInput } from './components/forms/DateInput.tsrx'
export { TimeInput } from './components/forms/TimeInput.tsrx'
export { DateTimeInput } from './components/forms/DateTimeInput.tsrx'
export { DateRangeInput } from './components/forms/DateRangeInput.tsrx'
export {
  useCalendarDays,
  useCalendarConstraints,
  useCalendarNavigation,
} from './components/forms/calendar-hooks.tsrx'

export { ColorArea } from './components/forms/ColorArea.tsrx'
export { ColorSlider } from './components/forms/ColorSlider.tsrx'
export { ColorField } from './components/forms/ColorField.tsrx'
export { ColorPicker } from './components/forms/ColorPicker.tsrx'

// Slice J — embedded web document (WebKitGTK 6.0 `WebKit.WebView`). GTK leaf:
// WebView.gtk.tsrx. See research/GTK-SLICES.md row J.
export { WebView } from './components/media/WebView.tsrx'

// Slice K — declaration parity: shared type aliases whose GTK
// resolution is source-identical (works-as-is rows in gtk_ui_checks).

export { useTooltip } from './components/overlays/use-tooltip.tsrx'
export { postToHost } from './components/media/webview-post'

export { Drawer } from './components/overlays/drawer/Drawer.gtk.tsrx'
export type { DrawerProps } from './props'
