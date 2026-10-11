import type { ComplexSelectorProps } from './props'

/** Coordination outcomes; external loading stays an ordinary field input. */
export interface ComplexSelectorViewProps<Value> extends Omit<
	ComplexSelectorProps<Value>,
	'ref' | 'changeAction' | 'onChange' | 'onOpenChange'
> {
	state: { value: Value; open: boolean; pending: boolean }
	triggerId: string
	contentId: string
	anchor: { current: any }
	onChange: (value: Value) => void
	onOpenChange: (open: boolean) => void
}
