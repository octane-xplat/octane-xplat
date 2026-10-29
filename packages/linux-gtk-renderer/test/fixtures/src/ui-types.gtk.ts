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
