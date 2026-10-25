// Implemented-example registry — template route name → the ported Octane
// element rendered for /templates/<name>/. The coverage ledger derives
// 'ported' status from this map; adding an example flips its row.

import { ButtonShowcase } from './button/ButtonShowcase'
import { ButtonVariants } from './button/ButtonVariants'
import { ButtonSizeVariants } from './button/ButtonSizeVariants'
import { ButtonFloating } from './button/ButtonFloating'
import { ButtonWithIcon } from './button/ButtonWithIcon'
import { ButtonWithEndSlot } from './button/ButtonWithEndSlot'
import { TextShowcase } from './text/TextShowcase'
import { TextTypes } from './text/TextTypes'
import { TextColors } from './text/TextColors'
import { TextHeadingLevels } from './text/TextHeadingLevels'
import { TextInline } from './text/TextInline'
import { TextTruncation } from './text/TextTruncation'
import { TextWeight } from './text/TextWeight'
import { TextWordBreak } from './text/TextWordBreak'
import { TextWrap } from './text/TextWrap'
import { LinkProviderCustomLink } from './link/LinkProviderCustomLink'
import { ThemeApply } from './theme/ThemeApply'
import { ThemeNested } from './theme/ThemeNested'
import { ThemeShowcase } from './theme/ThemeShowcase'
import { ThemeSwitcher } from './theme/ThemeSwitcher'
import { UseThemeHookUsage } from './theme/useThemeHookUsage'
import { DialogShowcase } from './dialog/DialogShowcase'
import { DialogConfirmationDialog } from './dialog/DialogConfirmationDialog'
import { DialogFormDialog } from './dialog/DialogFormDialog'
import { DialogScrollingContent } from './dialog/DialogScrollingContent'
import { DialogWithSubtitle } from './dialog/DialogWithSubtitle'
import { DialogFullscreenDialog } from './dialog/DialogFullscreenDialog'
import { DialogAdaptivePresentation } from './dialog/DialogAdaptivePresentation'
import { DialogHeaderBasic } from './dialog/DialogHeaderBasic'
import { DialogHeaderShowcase } from './dialog/DialogHeaderShowcase'
import { AlertDialogAsyncAction } from './dialog/AlertDialogAsyncAction'
import { AlertDialogDeleteConfirmation } from './dialog/AlertDialogDeleteConfirmation'
import { BottomSheetShowcase } from './bottomsheet/BottomSheetShowcase'
import { BottomSheetHeights } from './bottomsheet/BottomSheetHeights'
import { BottomSheetSnapPoints } from './bottomsheet/BottomSheetSnapPoints'
import { BottomSheetNoScrim } from './bottomsheet/BottomSheetNoScrim'
import { BottomSheetMobileKeyboard } from './bottomsheet/BottomSheetMobileKeyboard'
import { BottomSheetSwitcherReviewFlow } from './bottomsheet/BottomSheetSwitcherReviewFlow'
import { BottomSheetSwitcherShowcase } from './bottomsheet/BottomSheetSwitcherShowcase'
import { PopoverShowcase } from './popover/PopoverShowcase'
import { PopoverConfirmAction } from './popover/PopoverConfirmAction'
import { PopoverFilterPanel } from './popover/PopoverFilterPanel'
import { PopoverKeyboardShortcuts } from './popover/PopoverKeyboardShortcuts'
import { PopoverSettingsPanel } from './popover/PopoverSettingsPanel'
import { PopoverHookUsage } from './popover/PopoverHookUsage'
import { PopoverBottomSheetAlternative } from './popover/PopoverBottomSheetAlternative'
import { TooltipShowcase } from './tooltip/TooltipShowcase'
import { TooltipActionBarTooltips } from './tooltip/TooltipActionBarTooltips'
import { TooltipInlineTextTooltips } from './tooltip/TooltipInlineTextTooltips'
import { TooltipHookUsage } from './tooltip/TooltipHookUsage'
import { DropdownMenuShowcase } from './menu/DropdownMenuShowcase'
import { DropdownMenuActions } from './menu/DropdownMenuActions'
import { DropdownMenuNoChevron } from './menu/DropdownMenuNoChevron'
import { DropdownMenuWithDisabledItems } from './menu/DropdownMenuWithDisabledItems'
import { DropdownMenuWithSections } from './menu/DropdownMenuWithSections'
import { DropdownMenuWithSubmenu } from './menu/DropdownMenuWithSubmenu'
import { DropdownMenuBottomSheet } from './menu/DropdownMenuBottomSheet'
import { DropdownMenuItemBasic } from './menu/DropdownMenuItemBasic'
import { DropdownMenuItemShowcase } from './menu/DropdownMenuItemShowcase'
import { MoreMenuShowcase } from './menu/MoreMenuShowcase'
import { MoreMenuDefaultMoreMenu } from './menu/MoreMenuDefaultMoreMenu'
import { MoreMenuWithDividers } from './menu/MoreMenuWithDividers'
import { MoreMenuWithSections } from './menu/MoreMenuWithSections'
import { MoreMenuBottomSheet } from './menu/MoreMenuBottomSheet'
import { ContextMenuBasic } from './menu/ContextMenuBasic'
import { ContextMenuShowcase } from './menu/ContextMenuShowcase'
import { ContextMenuBottomSheet } from './menu/ContextMenuBottomSheet'
import { ContextMenuItemBasic } from './menu/ContextMenuItemBasic'
import { ContextMenuItemShowcase } from './menu/ContextMenuItemShowcase'
import { ToastShowcase } from './toast/ToastShowcase'
import { ToastTypes } from './toast/ToastTypes'
import { ToastAction } from './toast/ToastAction'
import { ToastDeduplication } from './toast/ToastDeduplication'
import { ToastDismiss } from './toast/ToastDismiss'
import { ToastStacking } from './toast/ToastStacking'
import { OverlayShowcase } from './overlay/OverlayShowcase'
import { OverlayBottomStrip } from './overlay/OverlayBottomStrip'
import { OverlayHoverReveal } from './overlay/OverlayHoverReveal'
import { LayerHookUsage } from './layer/LayerHookUsage'
import { FieldLabelBasic } from './field/FieldLabelBasic'
import { FieldLabelShowcase } from './field/FieldLabelShowcase'
import { FieldRequired } from './field/FieldRequired'
import { FieldShowcase } from './field/FieldShowcase'
import { FieldStatusBasic } from './field/FieldStatusBasic'
import { FieldStatusShowcase } from './field/FieldStatusShowcase'
import { FieldStatusVariants } from './field/FieldStatusVariants'
import { FieldWithDescription } from './field/FieldWithDescription'
import { InputGroupBasic } from './inputgroup/InputGroupBasic'
import { InputGroupShowcase } from './inputgroup/InputGroupShowcase'
import { FileInputBasic } from './fileinput/FileInputBasic'
import { FileInputShowcase } from './fileinput/FileInputShowcase'
import { TextInputIcon } from './textinput/TextInputIcon'
import { TextInputSearch } from './textinput/TextInputSearch'
import { TextInputShowcase } from './textinput/TextInputShowcase'
import { TextInputSizes } from './textinput/TextInputSizes'
import { TextInputStates } from './textinput/TextInputStates'
import { TextInputStatusVariant } from './textinput/TextInputStatusVariant'
import { TextInputTypes } from './textinput/TextInputTypes'
import { TextAreaCharacterCount } from './textarea/TextAreaCharacterCount'
import { TextAreaShowcase } from './textarea/TextAreaShowcase'
import { TextAreaStates } from './textarea/TextAreaStates'
import { TextAreaValidation } from './textarea/TextAreaValidation'
import { TextAreaWithIcon } from './textarea/TextAreaWithIcon'
import { NumberInputClearableNumberInput } from './numberinput/NumberInputClearableNumberInput'
import { NumberInputRangeNumberInput } from './numberinput/NumberInputRangeNumberInput'
import { NumberInputShowcase } from './numberinput/NumberInputShowcase'
import { NumberInputStatuses } from './numberinput/NumberInputStatuses'
import { NumberInputWithUnits } from './numberinput/NumberInputWithUnits'
import { CheckboxInputBasic } from './checkbox/CheckboxInputBasic'
import { CheckboxInputIndeterminateState } from './checkbox/CheckboxInputIndeterminateState'
import { CheckboxInputShowcase } from './checkbox/CheckboxInputShowcase'
import { CheckboxInputStatusVariations } from './checkbox/CheckboxInputStatusVariations'
import { CheckboxListItemBasic } from './checkbox/CheckboxListItemBasic'
import { CheckboxListItemShowcase } from './checkbox/CheckboxListItemShowcase'
import { CheckboxListSelectAllPattern } from './checkbox/CheckboxListSelectAllPattern'
import { CheckboxListShowcase } from './checkbox/CheckboxListShowcase'
import { CheckboxListWithEndContent } from './checkbox/CheckboxListWithEndContent'
import { RadioListHorizontalLayout } from './radiolist/RadioListHorizontalLayout'
import { RadioListItemBasic } from './radiolist/RadioListItemBasic'
import { RadioListItemShowcase } from './radiolist/RadioListItemShowcase'
import { RadioListPricingTier } from './radiolist/RadioListPricingTier'
import { RadioListShowcase } from './radiolist/RadioListShowcase'
import { RadioListWithDescriptions } from './radiolist/RadioListWithDescriptions'
import { RadioListWithValidation } from './radiolist/RadioListWithValidation'
import { SwitchDisabled } from './switch/SwitchDisabled'
import { SwitchSettingsPanel } from './switch/SwitchSettingsPanel'
import { SwitchShowcase } from './switch/SwitchShowcase'
import { SwitchWithDescription } from './switch/SwitchWithDescription'
import { SwitchWithStatus } from './switch/SwitchWithStatus'
import { SliderFormattedValue } from './slider/SliderFormattedValue'
import { SliderRangeSlider } from './slider/SliderRangeSlider'
import { SliderShowcase } from './slider/SliderShowcase'
import { SliderWithMarks } from './slider/SliderWithMarks'
import { SliderWithStatus } from './slider/SliderWithStatus'
import { StepContent } from './stepper/StepContent'
import { StepIndicator } from './stepper/StepIndicator'
import { StepShowcase } from './stepper/StepShowcase'
import { StepStates } from './stepper/StepStates'
import { StepperCustomContent } from './stepper/StepperCustomContent'
import { StepperIndicatorModes } from './stepper/StepperIndicatorModes'
import { StepperOnTrackHorizontal } from './stepper/StepperOnTrackHorizontal'
import { StepperOnTrackVertical } from './stepper/StepperOnTrackVertical'
import { StepperShowcase } from './stepper/StepperShowcase'
import { StepperStatus } from './stepper/StepperStatus'
import { StepperWidthResponsiveCollapse } from './stepper/StepperWidthResponsiveCollapse'
import { ToggleButtonColor } from './togglebutton/ToggleButtonColor'
import { ToggleButtonGroup } from './togglebutton/ToggleButtonGroupFile'
import { ToggleButtonGroupShowcase } from './togglebutton/ToggleButtonGroupShowcase'
import { ToggleButtonGroupVertical } from './togglebutton/ToggleButtonGroupVertical'
import { ToggleButtonIconSwap } from './togglebutton/ToggleButtonIconSwap'
import { ToggleButtonLabel } from './togglebutton/ToggleButtonLabel'
import { ToggleButtonShowcase } from './togglebutton/ToggleButtonShowcase'
import { ToggleButtonStates } from './togglebutton/ToggleButtonStates'
import { SegmentedControlDisabledItem } from './segmented/SegmentedControlDisabledItem'
import { SegmentedControlFillLayout } from './segmented/SegmentedControlFillLayout'
import { SegmentedControlIconOnly } from './segmented/SegmentedControlIconOnly'
import { SegmentedControlItemBasic } from './segmented/SegmentedControlItemBasic'
import { SegmentedControlItemShowcase } from './segmented/SegmentedControlItemShowcase'
import { SegmentedControlShowcase } from './segmented/SegmentedControlShowcase'
import { SegmentedControlWithIcons } from './segmented/SegmentedControlWithIcons'
import { SelectorBottomSheet } from './selector/SelectorBottomSheet'
import { SelectorClearable } from './selector/SelectorClearable'
import { SelectorGhostToolbar } from './selector/SelectorGhostToolbar'
import { SelectorOptionBasic } from './selector/SelectorOptionBasic'
import { SelectorOptionDescriptions } from './selector/SelectorOptionDescriptions'
import { SelectorOptionShowcase } from './selector/SelectorOptionShowcase'
import { SelectorShowcase } from './selector/SelectorShowcase'
import { SelectorWithSections } from './selector/SelectorWithSections'
import { SelectorWithStatus } from './selector/SelectorWithStatus'
import { MultiSelectorBottomSheet } from './multiselector/MultiSelectorBottomSheet'
import { MultiSelectorColumnVisibilitySelector } from './multiselector/MultiSelectorColumnVisibilitySelector'
import { MultiSelectorForm } from './multiselector/MultiSelectorForm'
import { MultiSelectorGhostToolbar } from './multiselector/MultiSelectorGhostToolbar'
import { MultiSelectorSearchableMultiSelector } from './multiselector/MultiSelectorSearchableMultiSelector'
import { MultiSelectorSectionedMultiSelector } from './multiselector/MultiSelectorSectionedMultiSelector'
import { MultiSelectorShowcase } from './multiselector/MultiSelectorShowcase'
import { ComplexSelectorDeadlinePicker } from './complexselector/ComplexSelectorDeadlinePicker'
import { ComplexSelectorShowcase } from './complexselector/ComplexSelectorShowcase'
import { ComplexSelectorTreeSearch } from './complexselector/ComplexSelectorTreeSearch'
import { BaseTypeaheadCustomSearch } from './typeahead/BaseTypeaheadCustomSearch'
import { BaseTypeaheadShowcase } from './typeahead/BaseTypeaheadShowcase'
import { TypeaheadItemBasic } from './typeahead/TypeaheadItemBasic'
import { TypeaheadItemShowcase } from './typeahead/TypeaheadItemShowcase'
import { TypeaheadLimitedResults } from './typeahead/TypeaheadLimitedResults'
import { TypeaheadSearchField } from './typeahead/TypeaheadSearchField'
import { TypeaheadShowcase } from './typeahead/TypeaheadShowcase'
import { TypeaheadWithHelperText } from './typeahead/TypeaheadWithHelperText'
import { TypeaheadWithValidation } from './typeahead/TypeaheadWithValidation'
import { PowerSearchContentSearch } from './powersearch/PowerSearchContentSearch'
import { PowerSearchFullFeatured } from './powersearch/PowerSearchFullFeatured'
import { PowerSearchPresetFilters } from './powersearch/PowerSearchPresetFilters'
import { PowerSearchSearchWithTable } from './powersearch/PowerSearchSearchWithTable'
import { PowerSearchShowcase } from './powersearch/PowerSearchShowcase'
import { TokenizerClear } from './tokenizer/TokenizerClear'
import { TokenizerCreatable } from './tokenizer/TokenizerCreatable'
import { TokenizerEndContent } from './tokenizer/TokenizerEndContent'
import { TokenizerIcon } from './tokenizer/TokenizerIcon'
import { TokenizerMaxEntries } from './tokenizer/TokenizerMaxEntries'
import { TokenizerOverflow } from './tokenizer/TokenizerOverflow'
import { TokenizerShowcase } from './tokenizer/TokenizerShowcase'
import { TokenizerStates } from './tokenizer/TokenizerStates'
import { DateInputClearable } from './datetime/DateInputClearable'
import { DateInputDateRange } from './datetime/DateInputDateRange'
import { DateInputFormats } from './datetime/DateInputFormats'
import { DateInputShowcase } from './datetime/DateInputShowcase'
import { DateInputWithDescription } from './datetime/DateInputWithDescription'
import { DateInputWithValidation } from './datetime/DateInputWithValidation'
import { DateRangeInputShowcase } from './datetime/DateRangeInputShowcase'
import { DateRangeInputWithPresets } from './datetime/DateRangeInputWithPresets'
import { DateRangeInputWithValidation } from './datetime/DateRangeInputWithValidation'
import { DateTimeInputShowcase } from './datetime/DateTimeInputShowcase'
import { DateTimeInputWithValidation } from './datetime/DateTimeInputWithValidation'
import { TimeInputConstrained } from './datetime/TimeInputConstrained'
import { TimeInputFormats } from './datetime/TimeInputFormats'
import { TimeInputIncrement } from './datetime/TimeInputIncrement'
import { TimeInputShowcase } from './datetime/TimeInputShowcase'
import { TimeInputStates } from './datetime/TimeInputStates'
import { CalendarConstraints } from './calendar/CalendarConstraints'
import { CalendarRangeWithValue } from './calendar/CalendarRangeWithValue'
import { CalendarShowcase } from './calendar/CalendarShowcase'
import { CalendarSingle } from './calendar/CalendarSingle'
import { CalendarTwoMonths } from './calendar/CalendarTwoMonths'
import { FormLayoutHorizontal } from './formlayout/FormLayoutHorizontal'
import { FormLayoutHorizontalLabels } from './formlayout/FormLayoutHorizontalLabels'
import { FormLayoutMixedControls } from './formlayout/FormLayoutMixedControls'
import { FormLayoutNested } from './formlayout/FormLayoutNested'
import { FormLayoutShowcase } from './formlayout/FormLayoutShowcase'

const examples: Record<string, () => any> = {
	ButtonShowcase,
	ButtonVariants,
	ButtonSizeVariants,
	ButtonFloating,
	ButtonWithIcon,
	ButtonWithEndSlot,
	TextShowcase,
	TextTypes,
	TextColors,
	TextHeadingLevels,
	TextInline,
	TextTruncation,
	TextWeight,
	TextWordBreak,
	TextWrap,
	LinkProviderCustomLink,
	ThemeApply,
	ThemeNested,
	ThemeShowcase,
	ThemeSwitcher,
	'useThemeHookUsage': UseThemeHookUsage,
	DialogShowcase,
	DialogConfirmationDialog,
	DialogFormDialog,
	DialogScrollingContent,
	DialogWithSubtitle,
	DialogFullscreenDialog,
	DialogAdaptivePresentation,
	DialogHeaderBasic,
	DialogHeaderShowcase,
	AlertDialogAsyncAction,
	AlertDialogDeleteConfirmation,
	BottomSheetShowcase,
	BottomSheetHeights,
	BottomSheetSnapPoints,
	BottomSheetNoScrim,
	BottomSheetMobileKeyboard,
	BottomSheetSwitcherReviewFlow,
	BottomSheetSwitcherShowcase,
	PopoverShowcase,
	PopoverConfirmAction,
	PopoverFilterPanel,
	PopoverKeyboardShortcuts,
	PopoverSettingsPanel,
	PopoverHookUsage,
	PopoverBottomSheetAlternative,
	TooltipShowcase,
	TooltipActionBarTooltips,
	TooltipInlineTextTooltips,
	TooltipHookUsage,
	DropdownMenuShowcase,
	DropdownMenuActions,
	DropdownMenuNoChevron,
	DropdownMenuWithDisabledItems,
	DropdownMenuWithSections,
	DropdownMenuWithSubmenu,
	DropdownMenuBottomSheet,
	DropdownMenuItemBasic,
	DropdownMenuItemShowcase,
	MoreMenuShowcase,
	MoreMenuDefaultMoreMenu,
	MoreMenuWithDividers,
	MoreMenuWithSections,
	MoreMenuBottomSheet,
	ContextMenuBasic,
	ContextMenuShowcase,
	ContextMenuBottomSheet,
	ContextMenuItemBasic,
	ContextMenuItemShowcase,
	ToastShowcase,
	ToastTypes,
	ToastAction,
	ToastDeduplication,
	ToastDismiss,
	ToastStacking,
	OverlayShowcase,
	OverlayBottomStrip,
	OverlayHoverReveal,
	LayerHookUsage,
	FieldLabelBasic,
	FieldLabelShowcase,
	FieldRequired,
	FieldShowcase,
	FieldStatusBasic,
	FieldStatusShowcase,
	FieldStatusVariants,
	FieldWithDescription,
	InputGroupBasic,
	InputGroupShowcase,
	FileInputBasic,
	FileInputShowcase,
	TextInputIcon,
	TextInputSearch,
	TextInputShowcase,
	TextInputSizes,
	TextInputStates,
	TextInputStatusVariant,
	TextInputTypes,
	TextAreaCharacterCount,
	TextAreaShowcase,
	TextAreaStates,
	TextAreaValidation,
	TextAreaWithIcon,
	NumberInputClearableNumberInput,
	NumberInputRangeNumberInput,
	NumberInputShowcase,
	NumberInputStatuses,
	NumberInputWithUnits,
	CheckboxInputBasic,
	CheckboxInputIndeterminateState,
	CheckboxInputShowcase,
	CheckboxInputStatusVariations,
	CheckboxListItemBasic,
	CheckboxListItemShowcase,
	CheckboxListSelectAllPattern,
	CheckboxListShowcase,
	CheckboxListWithEndContent,
	RadioListHorizontalLayout,
	RadioListItemBasic,
	RadioListItemShowcase,
	RadioListPricingTier,
	RadioListShowcase,
	RadioListWithDescriptions,
	RadioListWithValidation,
	SwitchDisabled,
	SwitchSettingsPanel,
	SwitchShowcase,
	SwitchWithDescription,
	SwitchWithStatus,
	SliderFormattedValue,
	SliderRangeSlider,
	SliderShowcase,
	SliderWithMarks,
	SliderWithStatus,
	StepContent,
	StepIndicator,
	StepShowcase,
	StepStates,
	StepperCustomContent,
	StepperIndicatorModes,
	StepperOnTrackHorizontal,
	StepperOnTrackVertical,
	StepperShowcase,
	StepperStatus,
	StepperWidthResponsiveCollapse,
	ToggleButtonColor,
	ToggleButtonGroup,
	ToggleButtonGroupShowcase,
	ToggleButtonGroupVertical,
	ToggleButtonIconSwap,
	ToggleButtonLabel,
	ToggleButtonShowcase,
	ToggleButtonStates,
	SegmentedControlDisabledItem,
	SegmentedControlFillLayout,
	SegmentedControlIconOnly,
	SegmentedControlItemBasic,
	SegmentedControlItemShowcase,
	SegmentedControlShowcase,
	SegmentedControlWithIcons,
	SelectorBottomSheet,
	SelectorClearable,
	SelectorGhostToolbar,
	SelectorOptionBasic,
	SelectorOptionDescriptions,
	SelectorOptionShowcase,
	SelectorShowcase,
	SelectorWithSections,
	SelectorWithStatus,
	MultiSelectorBottomSheet,
	MultiSelectorColumnVisibilitySelector,
	MultiSelectorForm,
	MultiSelectorGhostToolbar,
	MultiSelectorSearchableMultiSelector,
	MultiSelectorSectionedMultiSelector,
	MultiSelectorShowcase,
	ComplexSelectorDeadlinePicker,
	ComplexSelectorShowcase,
	ComplexSelectorTreeSearch,
	BaseTypeaheadCustomSearch,
	BaseTypeaheadShowcase,
	TypeaheadItemBasic,
	TypeaheadItemShowcase,
	TypeaheadLimitedResults,
	TypeaheadSearchField,
	TypeaheadShowcase,
	TypeaheadWithHelperText,
	TypeaheadWithValidation,
	PowerSearchContentSearch,
	PowerSearchFullFeatured,
	PowerSearchPresetFilters,
	PowerSearchSearchWithTable,
	PowerSearchShowcase,
	TokenizerClear,
	TokenizerCreatable,
	TokenizerEndContent,
	TokenizerIcon,
	TokenizerMaxEntries,
	TokenizerOverflow,
	TokenizerShowcase,
	TokenizerStates,
	DateInputClearable,
	DateInputDateRange,
	DateInputFormats,
	DateInputShowcase,
	DateInputWithDescription,
	DateInputWithValidation,
	DateRangeInputShowcase,
	DateRangeInputWithPresets,
	DateRangeInputWithValidation,
	DateTimeInputShowcase,
	DateTimeInputWithValidation,
	TimeInputConstrained,
	TimeInputFormats,
	TimeInputIncrement,
	TimeInputShowcase,
	TimeInputStates,
	CalendarConstraints,
	CalendarRangeWithValue,
	CalendarShowcase,
	CalendarSingle,
	CalendarTwoMonths,
	FormLayoutHorizontal,
	FormLayoutHorizontalLabels,
	FormLayoutMixedControls,
	FormLayoutNested,
	FormLayoutShowcase,
}

export const portedExamples = new Set(Object.keys(examples))

export function exampleFor(name: string): any {
	return examples[name]
}
