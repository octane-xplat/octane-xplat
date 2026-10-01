import { createContext, useContext } from 'octane'
import type { ButtonGroupContextValue } from './props'

/** Position a member occupies inside its ButtonGroup — the group's per-child
 *  slot providers stamp it so grouped styling doesn't depend on
 *  `:first-child`/`:has()` CSS (absent on NativeScript). */
export interface ButtonGroupMember extends ButtonGroupContextValue {
	position: 'first' | 'middle' | 'last' | 'only'
}

export const ButtonGroupContext: any = createContext<ButtonGroupMember | null>(null)
export const ButtonGroupProvider: any = ButtonGroupContext

/** Button (and grouped trigger components) read group membership here;
 *  returns null outside a ButtonGroup. */
export function useButtonGroup(): ButtonGroupMember | null {
	return useContext(ButtonGroupContext)
}
