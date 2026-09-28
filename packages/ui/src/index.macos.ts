// Experimental AppKit public surface. Components with a direct AppKit
// equivalent use the host renderer; NativeScript-only features are exported
// as visible unsupported leaves so the shared harness can still load them.
export { View, Column } from './View.macos.tsrx'
export { Row } from './Row.macos.tsrx'
export { Grid, Stack, Absolute, Spacer } from './layout.macos.tsrx'
export type { PanEvent, SwipeEvent, SetTranslate } from './props'
export { setTranslate } from './translate.macos'
export { Text, RichText, RichTextSpan } from './Text.macos.tsrx'
export { Pressable } from './Pressable.macos.tsrx'
export { Button, Checkbox, Switch, Slider, SegmentedControl, SearchInput, ActivityIndicator } from './controls.macos.tsrx'

export {
	Unsupported as Collapsible,
	Unsupported as Accordion,
	Unsupported as RadioGroup,
	Unsupported as DropdownMenu,
	Unsupported as ContextMenu,
	Unsupported as Badge,
	Unsupported as Separator,
	Unsupported as Skeleton,
	Unsupported as Avatar,
	Unsupported as AvatarGroup,
	Unsupported as FormField,
	Unsupported as FieldGroup,
	Unsupported as InputNumber,
	Unsupported as PinInput,
	Unsupported as Select,
	Unsupported as SelectMenu,
	Unsupported as Combobox,
	Unsupported as InputMenu,
	Unsupported as InputTags,
	Unsupported as InputRating,
	Unsupported as CheckboxGroup,
	Unsupported as Breadcrumb,
	Unsupported as Pagination,
	Unsupported as Stepper,
	Unsupported as NavigationMenu,
	Unsupported as CommandPalette,
	Unsupported as Table,
	Unsupported as Timeline,
	Unsupported as Tree,
	Unsupported as Alert,
	Unsupported as Card,
	Unsupported as Chip,
	Unsupported as Kbd,
	Unsupported as Empty,
	Unsupported as Banner,
	Unsupported as User,
	Unsupported as ProgressGroup,
	Unsupported as Drawer,
} from './unsupported.macos.tsrx'

export { Link } from './Link.macos.tsrx'
export { NavLink } from './NavLink.macos.tsrx'
export { TextInput, TextArea } from './text-controls.macos.tsrx'
export { ScrollView, ScrollBox } from './ScrollView.macos.tsrx'
export { VirtualList } from './VirtualList.macos.tsrx'
export { Image } from './Image.macos.tsrx'
export { WebView, Video, CameraView } from './hosted-unsupported.macos.tsrx'
export { Overlay, Popover, Sheet } from './surfaces.macos.tsrx'
export { showToast } from './toast-anchor.macos.tsrx'
export { useAnimation } from './anim.macos.tsrx'
export { useThemeScheme, getThemeScheme, setThemePreference, getThemePreference, themeSchemeClasses, onThemeSchemeChange, applyThemeClasses } from './theme/theme-scheme'
export { useColorScheme, getColorScheme } from './colorScheme.macos'
export { styled } from './styled.macos.tsrx'
export { openWindow } from './windows.macos'
export { Screen } from './Screen.macos.tsrx'
export { Tabs } from './Tabs.macos.tsrx'
export type { TabSpec } from './props'
export { SafeArea, KeyboardAvoiding } from './layout-shells.macos.tsrx'
export { useSafeAreaInsets } from './safeAreaInsets.macos.tsrx'
export { useMeasure } from './useMeasure.macos.tsrx'
export { Meter, Heading, Icon } from './macos-extras.macos.tsrx'
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
	screenFor,
	hrefFor,
	layoutsFor as layoutsForRoute,
} from './route.macos'
export { deriveRouteManifest } from './route-table'
export { createStore } from './store'
export type { Store, ReadableStore } from './store'
export { useStore } from './useStore.macos.tsrx'
export { openSheet, closeSheet, sheetHost } from './sheet-service.macos'
export type * from './props'
