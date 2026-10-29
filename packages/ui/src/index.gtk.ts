// GTK/GJS surface. Add shared leaves only with maintained GTK runtime checks.
export { Text } from './Text'
export { Pressable } from './Pressable'
export { View } from './View'
export { VStack } from './VStack'
export { HStack } from './HStack'
export { Grid, GridSpan } from './Grid'
export { Stack } from './Stack'
export { StackItem } from './StackItem'
export { Center } from './Center'
export { Section } from './Section'
export { Layout, LayoutHeader, LayoutContent, LayoutFooter, LayoutPanel } from './Layout'
export { Absolute } from './Absolute'
export { Spacer } from './Spacer'
export { Badge } from './Badge'
export { Separator as Divider } from './Separator'
export { ColorSwatch } from './ColorSwatch'
export { SizeContext, SizeProvider, useSize } from './size-context'
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

export { useMeasure } from './useMeasure'
export { AspectRatio } from './AspectRatio'
export type {
	MeasureBounds,
	MeasureResult,
	UseMeasureOptions,
	AspectRatioProps,
	AspectRatioFit,
	AspectRatioShape,
} from './props'

export { setTranslate } from './translate'
export { useAnimation } from './anim'
export type { SetTranslate, AnimatedValue, AnimationResult } from './props'

export { useScrollableArea } from './use-scrollable-area'
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

export { ScrollableArea } from './ScrollableArea'
export { ActivityIndicator as Spinner } from './ActivityIndicator'
export type {
	ScrollableAreaProps,
	ScrollableAreaHandle,
	ActivityIndicatorProps,
	SpinnerProps,
} from './props'

export { Icon } from './Icon'
export { IconRegistryProvider } from './IconRegistryProvider'
export { createIconRegistry, registerIcon, registerIcons } from './icons'
export type { IconGlyph, IconRegistry } from './icons'
export type {
	IconProps,
	BuiltinIconName,
	IconName,
	IconNameRegistry,
	IconRegistryProviderProps,
} from './props'

export { Tooltip } from './Tooltip'
export type { TooltipProps, PopoverPlacement } from './props'

export { TextInput } from './TextInput'
export type {
	TextInputProps,
	TextInputHandle,
	FieldControlProps,
	FieldControlSize,
	FieldStatus as FieldStatusInfo,
	FieldStatusType,
	FieldStatusVariant,
} from './props'

export { TextArea } from './TextArea'
export type { TextAreaProps } from './props'

export { SearchInput } from './SearchInput'
export type { SearchInputProps } from './props'

export { FormField as Field } from './FormField'
export { FormLayout } from './FormLayout'
export type {
	FormFieldProps,
	FieldProps,
	FormLayoutProps,
	FormLayoutDirection,
	FormOptionality,
} from './props'

export { InputGroup, InputGroupText } from './InputGroup'
export type { InputGroupProps, InputGroupTextProps, InputGroupSize } from './props'

export { FieldGroup } from './FieldGroup'
export { useFieldControl } from './field-context'
export type { FieldGroupProps } from './props'
