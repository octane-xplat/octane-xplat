import type * as GtkUI from '@octane-xplat/ui'
import type * as NativeUI from '../../../../ui/types/generated/index.mobile'
import type {
	StackProps as GtkStackProps,
	PressableProps as GtkPressableProps,
	TextInputProps as GtkTextInputProps,
	TextInputHandle as GtkTextInputHandle,
	FieldControlProps as GtkFieldControlProps,
	FieldControlSize as GtkFieldControlSize,
	FieldStatusInfo as GtkFieldStatusInfo,
	FieldStatusType as GtkFieldStatusType,
	FieldStatusVariant as GtkFieldStatusVariant,
} from '@octane-xplat/ui'
import type {
	StackProps as NativeStackProps,
	PressableProps as NativePressableProps,
	TextInputProps as NativeTextInputProps,
	TextInputHandle as NativeTextInputHandle,
	FieldControlProps as NativeFieldControlProps,
	FieldControlSize as NativeFieldControlSize,
	FieldStatusInfo as NativeFieldStatusInfo,
	FieldStatusType as NativeFieldStatusType,
	FieldStatusVariant as NativeFieldStatusVariant,
} from '../../../../ui/types/generated/index.mobile'

type Assert<T extends true> = T
type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type CommonKeys = keyof typeof GtkUI & keyof typeof NativeUI
type Names = Assert<Exclude<keyof typeof GtkUI, keyof typeof NativeUI> extends never ? true : false>
type PublicValues = Assert<
	Exclude<
		{ [K in CommonKeys]: Equal<(typeof GtkUI)[K], (typeof NativeUI)[K]> }[CommonKeys],
		true
	> extends never
		? true
		: false
>
type StackContract = Assert<Equal<GtkStackProps, NativeStackProps>>
type PressableContract = Assert<Equal<GtkPressableProps, NativePressableProps>>
type TextInputContract = Assert<Equal<GtkTextInputProps, NativeTextInputProps>>
type TextInputHandleContract = Assert<Equal<GtkTextInputHandle, NativeTextInputHandle>>
type FieldControlContract = Assert<Equal<GtkFieldControlProps, NativeFieldControlProps>>
type FieldSizeContract = Assert<Equal<GtkFieldControlSize, NativeFieldControlSize>>
type FieldStatusInfoContract = Assert<Equal<GtkFieldStatusInfo, NativeFieldStatusInfo>>
type FieldStatusTypeContract = Assert<Equal<GtkFieldStatusType, NativeFieldStatusType>>
type FieldStatusVariantContract = Assert<Equal<GtkFieldStatusVariant, NativeFieldStatusVariant>>

// @ts-expect-error The native direction contract is retained on GTK.
const invalidDirection: GtkStackProps['direction'] = 'sideways'
void invalidDirection

// The public GTK root accepts source components whose JSX is opaque until
// the preset compiles it, while preserving props checking at each mount call.
import type {
	GtkRoot,
	createGtkRoot,
	UniversalComponent,
	UniversalRoot,
} from '@octane-xplat/linux-gtk'
import type { GtkAppMount } from '@octane-xplat/linux-gtk/host'
import { App } from './ui-primitives.gtk'

declare const sourceRoot: GtkRoot
declare const createdRoot: ReturnType<typeof createGtkRoot>['root']
declare const mounted: GtkAppMount
declare const universalComponent: UniversalComponent<{ message: string }>
const mountProps = { disabled: false, version: 1, horizontal: true }
sourceRoot.prepare(App, mountProps)
sourceRoot.render(App, mountProps)
sourceRoot.renderAsync(App, mountProps)
createdRoot.render(App, mountProps)
mounted.root.render(App, mountProps)
sourceRoot.render(universalComponent, { message: 'Ready' })
const coreRoot: UniversalRoot = sourceRoot
const eventResult: number = coreRoot.eventScope('default', () => 1)
void eventResult
// @ts-expect-error Required component props remain required.
sourceRoot.render(App, { version: 1 })
// @ts-expect-error Props are inferred from the component, not the second argument.
sourceRoot.prepare(App, { ...mountProps, disabled: 'yes' })
// @ts-expect-error Async mounts enforce the same props contract.
sourceRoot.renderAsync(App, { ...mountProps, version: 'one' })
// @ts-expect-error Universal metadata components retain their declared prop types.
sourceRoot.render(universalComponent, { message: 42 })

declare const sourceContainer: ReturnType<typeof createGtkRoot>['container']
sourceContainer.root?.render(App, mountProps)
// @ts-expect-error The public container's root checks required props too.
sourceContainer.root?.render(App, {})
declare const compilerRoot: UniversalRoot
// @ts-expect-error The upstream root requires compiler-owned metadata, absent from source declarations.
compilerRoot.render(App, mountProps)

type CheckboxPropsContract = Assert<Equal<GtkUI.CheckboxProps, NativeUI.CheckboxProps>>
type CheckboxInputPropsContract = Assert<
	Equal<GtkUI.CheckboxInputProps, NativeUI.CheckboxInputProps>
>
type SwitchPropsContract = Assert<Equal<GtkUI.SwitchProps, NativeUI.SwitchProps>>

type RadioGroupPropsContract = Assert<Equal<GtkUI.RadioGroupProps, NativeUI.RadioGroupProps>>
type RadioListPropsContract = Assert<Equal<GtkUI.RadioListProps, NativeUI.RadioListProps>>
type RadioListItemPropsContract = Assert<
	Equal<GtkUI.RadioListItemProps, NativeUI.RadioListItemProps>
>
type RadioOptionContract = Assert<Equal<GtkUI.RadioOption, NativeUI.RadioOption>>

type InputNumberPropsContract = Assert<Equal<GtkUI.InputNumberProps, NativeUI.InputNumberProps>>
type NumberInputPropsContract = Assert<Equal<GtkUI.NumberInputProps, NativeUI.NumberInputProps>>

type CheckboxGroupPropsContract = Assert<
	Equal<GtkUI.CheckboxGroupProps, NativeUI.CheckboxGroupProps>
>
type CheckboxListPropsContract = Assert<Equal<GtkUI.CheckboxListProps, NativeUI.CheckboxListProps>>
type CheckboxListItemPropsContract = Assert<
	Equal<GtkUI.CheckboxListItemProps, NativeUI.CheckboxListItemProps>
>

type SegmentedControlPropsContract = Assert<
	Equal<GtkUI.SegmentedControlProps, NativeUI.SegmentedControlProps>
>
type SegmentedControlItemPropsContract = Assert<
	Equal<GtkUI.SegmentedControlItemProps, NativeUI.SegmentedControlItemProps>
>

type PinInputPropsContract = Assert<Equal<GtkUI.PinInputProps, NativeUI.PinInputProps>>

type SliderPropsContract = Assert<Equal<GtkUI.SliderProps, NativeUI.SliderProps>>
type SliderMarkContract = Assert<Equal<GtkUI.SliderMark, NativeUI.SliderMark>>

type InputRatingPropsContract = Assert<Equal<GtkUI.InputRatingProps, NativeUI.InputRatingProps>>

type SelectorOptionContract = Assert<Equal<GtkUI.SelectorOptionProps, NativeUI.SelectorOptionProps>>
type PopoverContract = Assert<Equal<GtkUI.PopoverProps, NativeUI.PopoverProps>>
type SelectorContract = Assert<Equal<GtkUI.SelectorProps, NativeUI.SelectorProps>>
type MultiSelectorContract = Assert<Equal<GtkUI.MultiSelectorProps, NativeUI.MultiSelectorProps>>

type SearchableItemContract = Assert<Equal<GtkUI.SearchableItem, NativeUI.SearchableItem>>
type SearchRequestContract = Assert<Equal<GtkUI.SearchRequest, NativeUI.SearchRequest>>
type SearchSourceContract = Assert<Equal<GtkUI.SearchSource, NativeUI.SearchSource>>
type CreateStaticSourceOptionsContract = Assert<
	Equal<GtkUI.CreateStaticSourceOptions, NativeUI.CreateStaticSourceOptions>
>
type TableColumnContract = Assert<Equal<GtkUI.TableColumn, NativeUI.TableColumn>>
type ColumnWidthContract = Assert<Equal<GtkUI.ColumnWidth, NativeUI.ColumnWidth>>
type ProportionalWidthContract = Assert<Equal<GtkUI.ProportionalWidth, NativeUI.ProportionalWidth>>
type PixelWidthContract = Assert<Equal<GtkUI.PixelWidth, NativeUI.PixelWidth>>
type TableSortableColumnConfigContract = Assert<
	Equal<GtkUI.TableSortableColumnConfig, NativeUI.TableSortableColumnConfig>
>
type LinkProviderPropsContract = Assert<Equal<GtkUI.LinkProviderProps, NativeUI.LinkProviderProps>>
type InternationalizationProviderPropsContract = Assert<
	Equal<GtkUI.InternationalizationProviderProps, NativeUI.InternationalizationProviderProps>
>
type InternationalizationMessagesContract = Assert<
	Equal<GtkUI.InternationalizationMessages, NativeUI.InternationalizationMessages>
>
type PowerSearchConfigContract = Assert<Equal<GtkUI.PowerSearchConfig, NativeUI.PowerSearchConfig>>
type DateRangeContract = Assert<Equal<GtkUI.DateRange, NativeUI.DateRange>>
type CalendarDayContract = Assert<Equal<GtkUI.CalendarDay, NativeUI.CalendarDay>>
type CalendarMonthGridContract = Assert<Equal<GtkUI.CalendarMonthGrid, NativeUI.CalendarMonthGrid>>
type DefinedThemeContract = Assert<Equal<GtkUI.DefinedTheme, NativeUI.DefinedTheme>>
type DefineThemeInputContract = Assert<Equal<GtkUI.DefineThemeInput, NativeUI.DefineThemeInput>>
type TokenValueContract = Assert<Equal<GtkUI.TokenValue, NativeUI.TokenValue>>
type FlatRefContract = Assert<Equal<GtkUI.FlatRef<unknown>, NativeUI.FlatRef<unknown>>>

type ButtonPropsContract = Assert<Equal<GtkUI.ButtonProps, NativeUI.ButtonProps>>
type ButtonVariantContract = Assert<Equal<GtkUI.ButtonVariant, NativeUI.ButtonVariant>>
type IconButtonPropsContract = Assert<Equal<GtkUI.IconButtonProps, NativeUI.IconButtonProps>>
type ToggleButtonPropsContract = Assert<Equal<GtkUI.ToggleButtonProps, NativeUI.ToggleButtonProps>>
type ToggleButtonGroupPropsContract = Assert<
	Equal<GtkUI.ToggleButtonGroupProps, NativeUI.ToggleButtonGroupProps>
>
type ButtonGroupPropsContract = Assert<Equal<GtkUI.ButtonGroupProps, NativeUI.ButtonGroupProps>>
type ClickableCardPropsContract = Assert<Equal<GtkUI.ClickableCardProps, NativeUI.ClickableCardProps>>
type CardPropsContract = Assert<Equal<GtkUI.CardProps, NativeUI.CardProps>>
type LinkPropsContract = Assert<Equal<GtkUI.LinkProps, NativeUI.LinkProps>>
type KbdPropsContract = Assert<Equal<GtkUI.KbdProps, NativeUI.KbdProps>>
type HeadingPropsContract = Assert<Equal<GtkUI.HeadingProps, NativeUI.HeadingProps>>
type CodePropsContract = Assert<Equal<GtkUI.CodeProps, NativeUI.CodeProps>>
type CodeBlockPropsContract = Assert<Equal<GtkUI.CodeBlockProps, NativeUI.CodeBlockProps>>
type ProgressBarPropsContract = Assert<Equal<GtkUI.ProgressBarProps, NativeUI.ProgressBarProps>>
type StatusDotPropsContract = Assert<Equal<GtkUI.StatusDotProps, NativeUI.StatusDotProps>>
type CitationPropsContract = Assert<Equal<GtkUI.CitationProps, NativeUI.CitationProps>>
type OutlinePropsContract = Assert<Equal<GtkUI.OutlineProps, NativeUI.OutlineProps>>
type BlockquotePropsContract = Assert<Equal<GtkUI.BlockquoteProps, NativeUI.BlockquoteProps>>
type TimestampPropsContract = Assert<Equal<GtkUI.TimestampProps, NativeUI.TimestampProps>>
type TimerPropsContract = Assert<Equal<GtkUI.TimerProps, NativeUI.TimerProps>>
type SkeletonPropsContract = Assert<Equal<GtkUI.SkeletonProps, NativeUI.SkeletonProps>>
type VisuallyHiddenPropsContract = Assert<
	Equal<GtkUI.VisuallyHiddenProps, NativeUI.VisuallyHiddenProps>
>
type ChipPropsContract = Assert<Equal<GtkUI.ChipProps, NativeUI.ChipProps>>
type AlertPropsContract = Assert<Equal<GtkUI.AlertProps, NativeUI.AlertProps>>
type BannerPropsContract = Assert<Equal<GtkUI.BannerProps, NativeUI.BannerProps>>
type EmptyStatePropsContract = Assert<Equal<GtkUI.EmptyStateProps, NativeUI.EmptyStateProps>>
type MeterPropsContract = Assert<Equal<GtkUI.MeterProps, NativeUI.MeterProps>>
type ProgressGroupPropsContract = Assert<
	Equal<GtkUI.ProgressGroupProps, NativeUI.ProgressGroupProps>
>
type MetadataListPropsContract = Assert<Equal<GtkUI.MetadataListProps, NativeUI.MetadataListProps>>
type MetadataListItemPropsContract = Assert<
	Equal<GtkUI.MetadataListItemProps, NativeUI.MetadataListItemProps>
>
type TimelinePropsContract = Assert<Equal<GtkUI.TimelineProps, NativeUI.TimelineProps>>
type ItemPropsContract = Assert<Equal<GtkUI.ItemProps, NativeUI.ItemProps>>
type ListItemPropsContract = Assert<Equal<GtkUI.ListItemProps, NativeUI.ListItemProps>>
type ListPropsContract = Assert<Equal<GtkUI.ListProps, NativeUI.ListProps>>
type ToolbarPropsContract = Assert<Equal<GtkUI.ToolbarProps, NativeUI.ToolbarProps>>
type StepPropsContract = Assert<Equal<GtkUI.StepProps, NativeUI.StepProps>>
type StepperPropsContract = Assert<Equal<GtkUI.StepperProps, NativeUI.StepperProps>>
type PaginationPropsContract = Assert<Equal<GtkUI.PaginationProps, NativeUI.PaginationProps>>
type FieldLabelPropsContract = Assert<Equal<GtkUI.FieldLabelProps, NativeUI.FieldLabelProps>>
type FieldStatusComponentPropsContract = Assert<
	Equal<GtkUI.FieldStatusComponentProps, NativeUI.FieldStatusComponentProps>
>

type ImagePropsContract = Assert<Equal<GtkUI.ImageProps, NativeUI.ImageProps>>
type ImageContentFitContract = Assert<Equal<GtkUI.ImageContentFit, NativeUI.ImageContentFit>>
type ImageContentPositionContract = Assert<
	Equal<GtkUI.ImageContentPosition, NativeUI.ImageContentPosition>
>
type ImageContentPositionObjectContract = Assert<
	Equal<GtkUI.ImageContentPositionObject, NativeUI.ImageContentPositionObject>
>
type ImageContentPositionStringContract = Assert<
	Equal<GtkUI.ImageContentPositionString, NativeUI.ImageContentPositionString>
>
type ImageContentPositionValueContract = Assert<
	Equal<GtkUI.ImageContentPositionValue, NativeUI.ImageContentPositionValue>
>
type ImageDecodingContract = Assert<Equal<GtkUI.ImageDecoding, NativeUI.ImageDecoding>>
type ImageSourceLikeContract = Assert<Equal<GtkUI.ImageSourceLike, NativeUI.ImageSourceLike>>
type ThumbnailPropsContract = Assert<Equal<GtkUI.ThumbnailProps, NativeUI.ThumbnailProps>>
type AvatarPropsContract = Assert<Equal<GtkUI.AvatarProps, NativeUI.AvatarProps>>
type AvatarGroupPropsContract = Assert<Equal<GtkUI.AvatarGroupProps, NativeUI.AvatarGroupProps>>
type AvatarGroupOverflowPropsContract = Assert<
	Equal<GtkUI.AvatarGroupOverflowProps, NativeUI.AvatarGroupOverflowProps>
>
type AvatarSizeContract = Assert<Equal<GtkUI.AvatarSize, NativeUI.AvatarSize>>
type AvatarStatusDotPropsContract = Assert<
	Equal<GtkUI.AvatarStatusDotProps, NativeUI.AvatarStatusDotProps>
>
type AvatarStatusDotVariantContract = Assert<
	Equal<GtkUI.AvatarStatusDotVariant, NativeUI.AvatarStatusDotVariant>
>
type UserPropsContract = Assert<Equal<GtkUI.UserProps, NativeUI.UserProps>>

type DropdownMenuPropsContract = Assert<Equal<GtkUI.DropdownMenuProps, NativeUI.DropdownMenuProps>>
type ContextMenuPropsContract = Assert<Equal<GtkUI.ContextMenuProps, NativeUI.ContextMenuProps>>
type MoreMenuPropsContract = Assert<Equal<GtkUI.MoreMenuProps, NativeUI.MoreMenuProps>>
type MoreMenuPlacementContract = Assert<Equal<GtkUI.MoreMenuPlacement, NativeUI.MoreMenuPlacement>>
type MenuOptionContract = Assert<Equal<GtkUI.MenuOption, NativeUI.MenuOption>>
type MenuItemPropsContract = Assert<Equal<GtkUI.MenuItemProps, NativeUI.MenuItemProps>>
type MenuCheckboxItemPropsContract = Assert<
	Equal<GtkUI.MenuCheckboxItemProps, NativeUI.MenuCheckboxItemProps>
>
type MenuRadioGroupPropsContract = Assert<
	Equal<GtkUI.MenuRadioGroupProps, NativeUI.MenuRadioGroupProps>
>
type MenuRadioItemPropsContract = Assert<
	Equal<GtkUI.MenuRadioItemProps, NativeUI.MenuRadioItemProps>
>
type MenuSeparatorPropsContract = Assert<
	Equal<GtkUI.MenuSeparatorProps, NativeUI.MenuSeparatorProps>
>
type MenuSectionPropsContract = Assert<Equal<GtkUI.MenuSectionProps, NativeUI.MenuSectionProps>>
type MenuLinkPropsContract = Assert<Equal<GtkUI.MenuLinkProps, NativeUI.MenuLinkProps>>
type MenuSubMenuPropsContract = Assert<Equal<GtkUI.MenuSubMenuProps, NativeUI.MenuSubMenuProps>>
type MenuContextValueContract = Assert<Equal<GtkUI.MenuContextValue, NativeUI.MenuContextValue>>
type DropdownMenuButtonPropsContract = Assert<
	Equal<GtkUI.DropdownMenuButtonProps, NativeUI.DropdownMenuButtonProps>
>
type MoreMenuAlignmentContract = Assert<
	Equal<GtkUI.MoreMenuAlignment, NativeUI.MoreMenuAlignment>
>
type MoreMenuPresentationContract = Assert<
	Equal<GtkUI.MoreMenuPresentation, NativeUI.MoreMenuPresentation>
>
type MenuItemDataContract = Assert<Equal<GtkUI.MenuItemData, NativeUI.MenuItemData>>
type MenuActionDataContract = Assert<Equal<GtkUI.MenuActionData, NativeUI.MenuActionData>>
type MenuLinkDataContract = Assert<Equal<GtkUI.MenuLinkData, NativeUI.MenuLinkData>>
type MenuSectionDataContract = Assert<Equal<GtkUI.MenuSectionData, NativeUI.MenuSectionData>>
type MenuSeparatorDataContract = Assert<Equal<GtkUI.MenuSeparatorData, NativeUI.MenuSeparatorData>>
type MenuSubMenuDataContract = Assert<Equal<GtkUI.MenuSubMenuData, NativeUI.MenuSubMenuData>>
type MenuDividerDataContract = Assert<Equal<GtkUI.MenuDividerData, NativeUI.MenuDividerData>>
type MenuCheckboxDataContract = Assert<Equal<GtkUI.MenuCheckboxData, NativeUI.MenuCheckboxData>>
type MenuRadioOptionDataContract = Assert<
	Equal<GtkUI.MenuRadioOptionData, NativeUI.MenuRadioOptionData>
>
type MenuRadioGroupDataContract = Assert<
	Equal<GtkUI.MenuRadioGroupData, NativeUI.MenuRadioGroupData>
>
type MenuItemContract = Assert<Equal<GtkUI.MenuItem, NativeUI.MenuItem>>
type MenuDividerPropsContract = Assert<Equal<GtkUI.MenuDividerProps, NativeUI.MenuDividerProps>>
type DropdownMenuItemPropsContract = Assert<
	Equal<GtkUI.DropdownMenuItemProps, NativeUI.DropdownMenuItemProps>
>
type ContextMenuItemPropsContract = Assert<
	Equal<GtkUI.ContextMenuItemProps, NativeUI.ContextMenuItemProps>
>
type BreadcrumbMenuItemPropsContract = Assert<
	Equal<GtkUI.BreadcrumbMenuItemProps, NativeUI.BreadcrumbMenuItemProps>
>
type BreadcrumbsPropsContract = Assert<Equal<GtkUI.BreadcrumbsProps, NativeUI.BreadcrumbsProps>>
type BreadcrumbItemPropsContract = Assert<Equal<GtkUI.BreadcrumbItemProps, NativeUI.BreadcrumbItemProps>>
type BreadcrumbEntryContract = Assert<Equal<GtkUI.BreadcrumbEntry, NativeUI.BreadcrumbEntry>>
type BreadcrumbMenuOptionContract = Assert<
	Equal<GtkUI.BreadcrumbMenuOption, NativeUI.BreadcrumbMenuOption>
>
type BreadcrumbsVariantContract = Assert<Equal<GtkUI.BreadcrumbsVariant, NativeUI.BreadcrumbsVariant>>
type HoverCardPropsContract = Assert<Equal<GtkUI.HoverCardProps, NativeUI.HoverCardProps>>
type HoverCardPlacementContract = Assert<Equal<GtkUI.HoverCardPlacement, NativeUI.HoverCardPlacement>>
type HoverCardOptionsContract = Assert<Equal<GtkUI.HoverCardOptions, NativeUI.HoverCardOptions>>
type HoverCardReturnContract = Assert<Equal<GtkUI.HoverCardReturn, NativeUI.HoverCardReturn>>
type LayerOptionsContract = Assert<Equal<GtkUI.LayerOptions, NativeUI.LayerOptions>>
type ContextLayerOptionsContract = Assert<
	Equal<GtkUI.ContextLayerOptions, NativeUI.ContextLayerOptions>
>
type FixedLayerOptionsContract = Assert<Equal<GtkUI.FixedLayerOptions, NativeUI.FixedLayerOptions>>
type ContextLayerReturnContract = Assert<
	Equal<GtkUI.ContextLayerReturn, NativeUI.ContextLayerReturn>
>
type FixedLayerReturnContract = Assert<Equal<GtkUI.FixedLayerReturn, NativeUI.FixedLayerReturn>>
type ContextRenderPropsContract = Assert<Equal<GtkUI.ContextRenderProps, NativeUI.ContextRenderProps>>
type FixedRenderPropsContract = Assert<Equal<GtkUI.FixedRenderProps, NativeUI.FixedRenderProps>>
type UsePopoverOptionsContract = Assert<Equal<GtkUI.UsePopoverOptions, NativeUI.UsePopoverOptions>>
type UsePopoverReturnContract = Assert<Equal<GtkUI.UsePopoverReturn, NativeUI.UsePopoverReturn>>

type OverlayPropsContract = Assert<Equal<GtkUI.OverlayProps, NativeUI.OverlayProps>>
type DialogPropsContract = Assert<Equal<GtkUI.DialogProps, NativeUI.DialogProps>>
type DialogHeaderPropsContract = Assert<
	Equal<GtkUI.DialogHeaderProps, NativeUI.DialogHeaderProps>
>
type DialogOptionsContract = Assert<Equal<GtkUI.DialogOptions, NativeUI.DialogOptions>>
type ImperativeDialogReturnContract = Assert<
	Equal<GtkUI.ImperativeDialogReturn, NativeUI.ImperativeDialogReturn>
>
type AlertDialogPropsContract = Assert<
	Equal<GtkUI.AlertDialogProps, NativeUI.AlertDialogProps>
>
type ImperativeAlertDialogReturnContract = Assert<
	Equal<GtkUI.ImperativeAlertDialogReturn, NativeUI.ImperativeAlertDialogReturn>
>
type FocusScopePropsContract = Assert<Equal<GtkUI.FocusScopeProps, NativeUI.FocusScopeProps>>
type FocusScopeCapabilitiesContract = Assert<
	Equal<GtkUI.FocusScopeCapabilities, NativeUI.FocusScopeCapabilities>
>
type LayerProviderPropsContract = Assert<
	Equal<GtkUI.LayerProviderProps, NativeUI.LayerProviderProps>
>
type LayerContextValueContract = Assert<
	Equal<GtkUI.LayerContextValue, NativeUI.LayerContextValue>
>
type ShowToastFnContract = Assert<Equal<GtkUI.ShowToastFn, NativeUI.ShowToastFn>>
type ToastCollisionBehaviorContract = Assert<
	Equal<GtkUI.ToastCollisionBehavior, NativeUI.ToastCollisionBehavior>
>
type ToastContentRenderFnContract = Assert<
	Equal<GtkUI.ToastContentRenderFn, NativeUI.ToastContentRenderFn>
>
type ToastContentRenderPropsContract = Assert<
	Equal<GtkUI.ToastContentRenderProps, NativeUI.ToastContentRenderProps>
>
type ToastDismissFnContract = Assert<Equal<GtkUI.ToastDismissFn, NativeUI.ToastDismissFn>>
type ToastDismissReasonContract = Assert<
	Equal<GtkUI.ToastDismissReason, NativeUI.ToastDismissReason>
>
type ToastHandleContract = Assert<Equal<GtkUI.ToastHandle, NativeUI.ToastHandle>>
type ToastEntryContract = Assert<Equal<GtkUI.ToastEntry, NativeUI.ToastEntry>>
type ToastOptionsContract = Assert<Equal<GtkUI.ToastOptions, NativeUI.ToastOptions>>
type ToastPositionContract = Assert<Equal<GtkUI.ToastPosition, NativeUI.ToastPosition>>
type ToastPropsContract = Assert<Equal<GtkUI.ToastProps, NativeUI.ToastProps>>
type ToastTypeContract = Assert<Equal<GtkUI.ToastType, NativeUI.ToastType>>
type ToastViewportPropsContract = Assert<
	Equal<GtkUI.ToastViewportProps, NativeUI.ToastViewportProps>
>
type LayerToastConfigContract = Assert<Equal<GtkUI.LayerToastConfig, NativeUI.LayerToastConfig>>
type LightboxMediaContract = Assert<Equal<GtkUI.LightboxMedia, NativeUI.LightboxMedia>>
type LightboxMediaTypeContract = Assert<Equal<GtkUI.LightboxMediaType, NativeUI.LightboxMediaType>>
type LightboxPropsContract = Assert<Equal<GtkUI.LightboxProps, NativeUI.LightboxProps>>
type LightboxTriggerPropsContract = Assert<
	Equal<GtkUI.LightboxTriggerProps, NativeUI.LightboxTriggerProps>
>
type UseLightboxOptionsContract = Assert<
	Equal<GtkUI.UseLightboxOptions, NativeUI.UseLightboxOptions>
>
type UseLightboxReturnContract = Assert<Equal<GtkUI.UseLightboxReturn, NativeUI.UseLightboxReturn>>
type CommandPalettePropsContract = Assert<
	Equal<GtkUI.CommandPaletteProps, NativeUI.CommandPaletteProps>
>
type CommandPaletteItemContract = Assert<
	Equal<GtkUI.CommandPaletteItem, NativeUI.CommandPaletteItem>
>
type CommandPaletteMenuItemContract = Assert<
	Equal<GtkUI.CommandPaletteMenuItem, NativeUI.CommandPaletteMenuItem>
>
type DrawerPropsContract = Assert<Equal<GtkUI.DrawerProps, NativeUI.DrawerProps>>
type BottomSheetHandleContract = Assert<Equal<GtkUI.BottomSheetHandle, NativeUI.BottomSheetHandle>>
type BottomSheetOpenOptionsContract = Assert<
	Equal<GtkUI.BottomSheetOpenOptions, NativeUI.BottomSheetOpenOptions>
>
type BottomSheetPropsContract = Assert<Equal<GtkUI.BottomSheetProps, NativeUI.BottomSheetProps>>
type BottomSheetSnapPointContract = Assert<
	Equal<GtkUI.BottomSheetSnapPoint, NativeUI.BottomSheetSnapPoint>
>
type BottomSheetSwitcherPropsContract = Assert<
	Equal<GtkUI.BottomSheetSwitcherProps, NativeUI.BottomSheetSwitcherProps>
>
type OpenBottomSheetContract = Assert<Equal<GtkUI.OpenBottomSheet, NativeUI.OpenBottomSheet>>
type ImperativeBottomSheetReturnContract = Assert<
	Equal<GtkUI.ImperativeBottomSheetReturn, NativeUI.ImperativeBottomSheetReturn>
>
type HostedComponentContract = Assert<Equal<GtkUI.HostedComponent, NativeUI.HostedComponent>>
type HostedComponentPropsContract = Assert<
	Equal<GtkUI.HostedComponentProps, NativeUI.HostedComponentProps>
>
type ModalOpenResultContract = Assert<Equal<GtkUI.ModalOpenResult, NativeUI.ModalOpenResult>>
