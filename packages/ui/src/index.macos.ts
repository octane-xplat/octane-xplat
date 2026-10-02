// Experimental AppKit public surface. Components with a direct AppKit
// equivalent use the host renderer; NativeScript-only features are exported
// as visible unsupported leaves so the shared harness can still load them.
export { View } from './View.macos.tsrx'
/** Vertical flow stack (Astryx `Stack` direction="vertical"). */
export { VStack } from './VStack.macos.tsrx'
/** Horizontal flow stack (Astryx `Stack` direction="horizontal"). */
export { HStack } from './HStack.macos.tsrx'
export { Grid, Stack, StackItem, Absolute, Spacer } from './layout.macos.tsrx'
export { Center } from './Center.macos.tsrx'
export { Section } from './Section.macos.tsrx'
export { AspectRatio } from './AspectRatio.macos.tsrx'
export { VisuallyHidden } from './VisuallyHidden.macos.tsrx'
export type { PanEvent, SwipeEvent, SetTranslate } from './props'
export { setTranslate } from './translate.macos'
export { Text, RichText, RichTextSpan } from './Text.macos.tsrx'
export { Pressable } from './Pressable.macos.tsrx'
export { Button, Switch, Slider, SegmentedControl, SearchInput } from './controls.macos.tsrx'
export { IconButton } from './IconButton.macos.tsrx'
export { ButtonGroup } from './ButtonGroup.macos.tsrx'
export { ToggleButton, ToggleButtonGroup } from './ToggleButton.macos.tsrx'
/** Self-drawn checkbox, exported under Astryx's component name. */
export { Checkbox as CheckboxInput } from './controls.macos.tsrx'
/** Loading indicator, exported under Astryx's component name. */
export { ActivityIndicator as Spinner } from './controls.macos.tsrx'

export { Collapsible } from './Collapsible.macos.tsrx'
export { Accordion } from './Accordion.macos.tsrx'
/** Single-choice option list, exported under Astryx's component name. */
export { RadioGroup as RadioList } from './RadioGroup.macos.tsrx'
export { DropdownMenu } from './DropdownMenu.macos.tsrx'
export { MoreMenu } from './MoreMenu.macos.tsrx'
export { ContextMenu } from './ContextMenu.macos.tsrx'
export { Badge } from './Badge.macos.tsrx'
/** Visual separator between content sections, exported under Astryx's name. */
export { Separator as Divider } from './Separator.macos.tsrx'
export { Skeleton } from './Skeleton.macos.tsrx'
export { Avatar } from './Avatar.macos.tsrx'
export { AvatarGroup } from './AvatarGroup.macos.tsrx'
/** Labeled control wrapper, exported under Astryx's component name. */
export { FormField as Field } from './FormField.macos.tsrx'
export { FieldGroup } from './FieldGroup.macos.tsrx'
/** Reusable labeled row, exported under Astryx's component name. */
export { Item } from './Item.macos.tsrx'
export { List } from './List.macos.tsrx'
export { ListItem } from './ListItem.macos.tsrx'
export { FormLayout } from './FormLayout.macos.tsrx'
export { InputGroup, InputGroupText } from './InputGroup.macos.tsrx'
export { CheckboxIndicator } from './CheckboxIndicator.macos.tsrx'
export { CheckIndicator } from './CheckIndicator.macos.tsrx'
export { RadioIndicator } from './RadioIndicator.macos.tsrx'
export {
	defaultIndicators,
	getIndicator,
	registerIndicator,
	registerIndicators,
	useIndicator,
	indicatorScope,
} from './indicators'
export type {
	AbsoluteProps,
	AspectRatioFit,
	AspectRatioProps,
	AspectRatioShape,
	CenterAxis,
	CenterProps,
	FormLayoutDirection,
	FormLayoutProps,
	FormOptionality,
	HStackProps,
	InputGroupProps,
	InputGroupSize,
	InputGroupTextProps,
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
	ListDensity,
	ListItemProps,
	ListMarkerStyle,
	ListProps,
	ListStyle,
	SectionDividerSide,
	SectionProps,
	SectionVariant,
	StackAlignment,
	StackCrossAlignment,
	StackDirection,
	StackItemCrossAlignSelf,
	StackItemProps,
	StackItemSize,
	StackMainAlignment,
	StackPaddingProps,
	StackProps,
	StackSizeProps,
	StackWrap,
	SpacingStep,
	VStackProps,
	VisuallyHiddenProps,
} from './props'

/** Bounded numeric entry, exported under Astryx's component name. */
export { InputNumber as NumberInput } from './InputNumber.macos.tsrx'
export { PinInput } from './PinInput.macos.tsrx'
/** Option picker, exported under Astryx's component name. */
export { Select as Selector } from './Select.macos.tsrx'
/** Multi-choice option picker, exported under Astryx's component name. */
export { SelectMenu as MultiSelector } from './aliases.macos.tsrx'
export { BaseTypeahead, Typeahead } from './Typeahead.macos.tsrx'
export { TypeaheadItem } from './TypeaheadItem.macos.tsrx'
export { createStaticSource } from './typeahead-source'
export { Token } from './Token.macos.tsrx'
export { Tokenizer } from './Tokenizer.macos.tsrx'
export { ComplexSelector } from './ComplexSelector.macos.tsrx'
export { Calendar } from './Calendar.macos.tsrx'
export { DateInput } from './DateInput.macos.tsrx'
export { TimeInput } from './TimeInput.macos.tsrx'
export { DateTimeInput } from './DateTimeInput.macos.tsrx'
export { DateRangeInput } from './DateRangeInput.macos.tsrx'
/** Opens AppKit's native NSOpenPanel by default. */
export { FileInput } from './FileInput.macos.tsrx'
export { registerFilePicker } from './file-picker'
export { useCalendarDays, useCalendarConstraints, useCalendarNavigation } from './calendar-hooks'
export { isSameDay, isDateInRange, getWeekNumber } from './calendar-core'
export type { CalendarDay, CalendarMonthGrid } from './calendar-core'
export type {
	UseCalendarDaysOptions,
	UseCalendarDaysReturn,
	UseCalendarConstraintsOptions,
	UseCalendarConstraintsReturn,
	UseCalendarNavigationOptions,
	UseCalendarNavigationReturn,
} from './calendar-hooks'
export { InputRating } from './InputRating.macos.tsrx'
/** Multi-choice checkbox list, exported under Astryx's component name. */
export { CheckboxGroup as CheckboxList } from './CheckboxGroup.macos.tsrx'
/** Ancestor path trail, exported under Astryx's component name. */
export { Breadcrumb as Breadcrumbs } from './Breadcrumb.macos.tsrx'
export { Pagination } from './Pagination.macos.tsrx'
export { Stepper } from './Stepper.macos.tsrx'
export { NavigationMenu } from './NavigationMenu.macos.tsrx'
export { AppShell } from './AppShell.macos.tsrx'
export { AppShellMobileContext } from './AppShell.macos.tsrx'
export { TopNav, TopNavHeading, TopNavItem, TopNavMenu, TopNavMegaMenu, TopNavMegaMenuItem, TopNavMegaMenuFeaturedCard } from './TopNav.macos.tsrx'
export { TopNavRenderContext, useTopNavRenderMode } from './TopNav.macos.tsrx'
export { SideNav, SideNavSection, SideNavHeading, SideNavItem, SideNavCollapseButton, useSideNavCollapse, SideNavRenderContext, useSideNavRenderMode } from './SideNav.macos.tsrx'
export { MobileNav, MobileNavToggle, useAppShellMobile } from './MobileNav.macos.tsrx'
export { NavIcon } from './NavIcon.macos.tsrx'
export { NavHeadingMenu, NavHeadingMenuItem } from './NavMenu.macos.tsrx'
export { NavHeadingMenuContext, NavHeadingCloseContext, useNavHeadingMenuContext, useNavHeadingCloseContext } from './NavMenu.macos.tsrx'
export { TabList, Tab, TabMenu, useTabListContext } from './TabList.macos.tsrx'
export { Toolbar } from './Toolbar.macos.tsrx'
export { OverflowList } from './OverflowList.macos.tsrx'
export { useResizable } from './useResizable.macos.tsrx'
export { ResizeHandle } from './ResizeHandle.macos.tsrx'
export { pixel, percent } from './resize-math'
export { CommandPalette } from './CommandPalette.macos.tsrx'
export { Table } from './Table.macos.tsrx'
export { Timeline } from './Timeline.macos.tsrx'
/** Expandable hierarchy, exported under Astryx's component name. */
export { Tree as TreeList } from './Tree.macos.tsrx'
export { Alert } from './Alert.macos.tsrx'
export { Card } from './Card.macos.tsrx'
export { ClickableCard } from './ClickableCard.macos.tsrx'
export { SelectableCard } from './SelectableCard.macos.tsrx'
export { Chip } from './Chip.macos.tsrx'
export { Kbd } from './Kbd.macos.tsrx'
/** Empty-state block, exported under Astryx's component name. */
export { Empty as EmptyState } from './Empty.macos.tsrx'
export { Banner } from './Banner.macos.tsrx'
export { User } from './User.macos.tsrx'
export { ProgressGroup } from './ProgressGroup.macos.tsrx'
export { Drawer } from './Drawer.macos.tsrx'

export { HoverCard } from './HoverCard.tsrx'
export { useHoverCard } from './use-hover-card.tsrx'
export { Tooltip } from './Tooltip.tsrx'
export { Markdown, MarkdownScreen } from './Markdown.tsrx'
export { Link } from './Link.macos.tsrx'
export { NavLink } from './NavLink.macos.tsrx'
export { TextInput, TextArea } from './text-controls.macos.tsrx'
export { ScrollableArea } from './ScrollableArea.macos.tsrx'
export { useScrollableArea } from './use-scrollable-area.macos.tsrx'
export { VirtualList } from './VirtualList.macos.tsrx'
export { Image } from './Image.macos.tsrx'
export { PowerSearch, PowerSearchToken, PowerSearchFilterEditor } from './PowerSearch.macos.tsrx'
export { createPowerSearchConfig, usePowerSearchConfig, resolveOperatorLabel } from './power-search-config'
export { WebView, CameraView } from './hosted-unsupported.macos.tsrx'
export { Overlay, Popover } from './surfaces.macos.tsrx'
export { Dialog, DialogHeader } from './Dialog.macos.tsrx'
export { AlertDialog } from './AlertDialog.macos.tsrx'
export { BottomSheet, BottomSheetSwitcher } from './BottomSheet.macos.tsrx'
export { Carousel } from './Carousel.macos.tsrx'
export { Lightbox } from './Lightbox.macos.tsrx'
export { useLightbox } from './use-lightbox.macos.tsrx'
export { Toast } from './Toast.macos.tsrx'
export { ToastViewport } from './toast-viewport.macos.tsrx'
export { showToast, useToast } from './toast-service.macos.tsrx'
export { useImperativeDialog } from './use-imperative-dialog.macos.tsrx'
export { useImperativeAlertDialog } from './use-imperative-alert-dialog.macos.tsrx'
export { useAnimation } from './anim.macos.tsrx'
export {
	useThemeScheme,
	getThemeScheme,
	setThemePreference,
	getThemePreference,
	themeSchemeClasses,
	onThemeSchemeChange,
	applyThemeClasses,
} from './theme/theme-scheme'
export { useColorScheme, getColorScheme } from './colorScheme.macos'
export { styled } from './styled.macos.tsrx'
export { openWindow } from './windows.macos'
export { Screen } from './Screen.macos.tsrx'
export { Tabs } from './Tabs.macos.tsrx'
export type { TabSpec } from './props'
export { SafeArea } from './layout-shells.macos.tsrx'
export { KeyboardAvoiding } from './KeyboardAvoiding.macos.tsrx'
export type { KeyboardAvoidingProps } from './props'
export { useSafeAreaInsets } from './safeAreaInsets.macos.tsrx'
export { useMeasure } from './useMeasure.macos.tsrx'
export { Meter, Heading } from './macos-extras.macos.tsrx'
export { Icon } from './Icon.macos.tsrx'
export { registerIcon, registerIcons } from './icons'
export type { IconGlyph } from './icons'
export const isNative = true as const
export { registerStack, getStack, stackEntries } from './stacks.macos'
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
	layoutsFor as layoutsForRoute,
} from './route.macos'

export { deriveRouteManifest, defineRoutes, mergeRouteManifests } from './route-table'
export { createStore } from './store'
export type { Store, ReadableStore } from './store'
export { useStore } from './useStore.macos.tsrx'
export { openBottomSheet, closeBottomSheet, bottomSheetHost } from './bottom-sheet-service.macos'

export { Blockquote } from './Blockquote.macos.tsrx'
export { Code } from './Code.macos.tsrx'
export { CodeBlock } from './CodeBlock.macos.tsrx'
export { MetadataList } from './MetadataList.macos.tsrx'
export { MetadataListItem } from './MetadataListItem.macos.tsrx'
export { Thumbnail } from './Thumbnail.macos.tsrx'
export { ProgressBar } from './ProgressBar.macos.tsrx'
export { StatusDot } from './StatusDot.macos.tsrx'
export { Timestamp } from './Timestamp.macos.tsrx'
export { Timer } from './Timer.macos.tsrx'
export { Citation } from './Citation.macos.tsrx'
export { Outline } from './Outline.macos.tsrx'
export { useOutlineFromMarkdown, useOutlineFromDoc } from './outline-hooks.tsrx'
export { useOutlineFromDOM } from './outline-dom.macos.tsrx'
export { parseOutlineFromMarkdown, outlineFromDoc, markdownHeadings, inlineMarkdownText, slugify, uniqueSlug } from './outline-utils'
export {
	tokenize,
	tokenizeAsync,
	tokenizeStreaming,
	flatTokensToLines,
	SYNC_TOKENIZE_THRESHOLD,
	TOKEN_TYPES,
	syntaxTokenVar,
	syntaxTokenVarRef,
} from './code-tokenizer'
export type * from './props'

// Chat shares the same portable contracts on AppKit; browser editing
// behavior remains in its web leaves.
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
} from './index.shared'
