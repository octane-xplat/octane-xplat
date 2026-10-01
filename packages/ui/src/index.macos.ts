// Experimental AppKit public surface. Components with a direct AppKit
// equivalent use the host renderer; NativeScript-only features are exported
// as visible unsupported leaves so the shared harness can still load them.
export { View } from './View.macos.tsrx'
/** Vertical flex container, exported under Astryx's component name. */
export { Column as VStack } from './View.macos.tsrx'
/** Horizontal flex container, exported under Astryx's component name. */
export { Row as HStack } from './Row.macos.tsrx'
export { Grid, Stack, Absolute, Spacer } from './layout.macos.tsrx'
export type { PanEvent, SwipeEvent, SetTranslate } from './props'
export { setTranslate } from './translate.macos'
export { Text, RichText, RichTextSpan } from './Text.macos.tsrx'
export { Pressable } from './Pressable.macos.tsrx'
export { Button, Switch, Slider, SegmentedControl, SearchInput } from './controls.macos.tsrx'
/** Self-drawn checkbox, exported under Astryx's component name. */
export { Checkbox as CheckboxInput } from './controls.macos.tsrx'
/** Loading indicator, exported under Astryx's component name. */
export { ActivityIndicator as Spinner } from './controls.macos.tsrx'

export { Collapsible } from './Collapsible.macos.tsrx'
export { Accordion } from './Accordion.macos.tsrx'
/** Single-choice option list, exported under Astryx's component name. */
export { RadioGroup as RadioList } from './RadioGroup.macos.tsrx'
export { DropdownMenu } from './DropdownMenu.macos.tsrx'
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
export { ListItem as Item } from './ListItem.macos.tsrx'
/** Bounded numeric entry, exported under Astryx's component name. */
export { InputNumber as NumberInput } from './InputNumber.macos.tsrx'
export { PinInput } from './PinInput.macos.tsrx'
/** Option picker, exported under Astryx's component name. */
export { Select as Selector } from './Select.macos.tsrx'
/** Multi-choice option picker, exported under Astryx's component name. */
export { SelectMenu as MultiSelector, Combobox, InputMenu } from './aliases.macos.tsrx'
export { InputTags } from './InputTags.macos.tsrx'
export { InputRating } from './InputRating.macos.tsrx'
/** Multi-choice checkbox list, exported under Astryx's component name. */
export { CheckboxGroup as CheckboxList } from './CheckboxGroup.macos.tsrx'
/** Ancestor path trail, exported under Astryx's component name. */
export { Breadcrumb as Breadcrumbs } from './Breadcrumb.macos.tsrx'
export { Pagination } from './Pagination.macos.tsrx'
export { Stepper } from './Stepper.macos.tsrx'
export { NavigationMenu } from './NavigationMenu.macos.tsrx'
export { CommandPalette } from './CommandPalette.macos.tsrx'
export { Table } from './Table.macos.tsrx'
export { Timeline } from './Timeline.macos.tsrx'
/** Expandable hierarchy, exported under Astryx's component name. */
export { Tree as TreeList } from './Tree.macos.tsrx'
export { Alert } from './Alert.macos.tsrx'
export { Card } from './Card.macos.tsrx'
export { Chip } from './Chip.macos.tsrx'
export { Kbd } from './Kbd.macos.tsrx'
/** Empty-state block, exported under Astryx's component name. */
export { Empty as EmptyState } from './Empty.macos.tsrx'
export { Banner } from './Banner.macos.tsrx'
export { User } from './User.macos.tsrx'
export { ProgressGroup } from './ProgressGroup.macos.tsrx'
export { Drawer } from './Drawer.macos.tsrx'

export { Hoverable } from './Hoverable.tsrx'
export { Tooltip } from './Tooltip.tsrx'
export { Markdown, MarkdownScreen } from './Markdown.tsrx'
export { Link } from './Link.macos.tsrx'
export { NavLink } from './NavLink.macos.tsrx'
export { TextInput, TextArea } from './text-controls.macos.tsrx'
export { ScrollView, ScrollBox } from './ScrollView.macos.tsrx'
export { VirtualList } from './VirtualList.macos.tsrx'
export { Image } from './Image.macos.tsrx'
export { WebView, CameraView } from './hosted-unsupported.macos.tsrx'
export { Overlay, Popover, Sheet } from './surfaces.macos.tsrx'
export { showToast } from './toast-anchor.macos.tsrx'
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
export { openSheet, closeSheet, sheetHost } from './sheet-service.macos'
export type * from './props'
