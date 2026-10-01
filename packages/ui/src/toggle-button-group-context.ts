import { createContext, useContext } from 'octane'
import type { FieldControlSize } from './props'

export interface ToggleButtonGroupContextValue {
	/** Currently pressed member values. */
	selectedValues: Set<string>
	/** Toggle a member value on/off — applies single/multiple policy. */
	toggle: (value: string) => void
	/** Group default size; members may override. */
	size?: FieldControlSize
	isDisabled?: boolean
}

export const ToggleButtonGroupContext: any =
	createContext<ToggleButtonGroupContextValue | null>(null)

/** ToggleButton reads group membership here; null outside a group. */
export function useToggleButtonGroup(): ToggleButtonGroupContextValue | null {
	return useContext(ToggleButtonGroupContext)
}
