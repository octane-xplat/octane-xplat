import type * as GtkUI from '@octane-xplat/ui'
import type * as NativeUI from '../../../../ui/types/generated/index.mobile'
import type {
	StackProps as GtkStackProps,
	PressableProps as GtkPressableProps,
} from '@octane-xplat/ui'
import type {
	StackProps as NativeStackProps,
	PressableProps as NativePressableProps,
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
// @ts-expect-error The native direction contract is retained on GTK.
const invalidDirection: GtkStackProps['direction'] = 'sideways'
void invalidDirection
