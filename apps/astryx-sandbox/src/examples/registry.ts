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
}

export const portedExamples = new Set(Object.keys(examples))

export function exampleFor(name: string): any {
	const component = examples[name]
	return component ? component() : undefined
}
