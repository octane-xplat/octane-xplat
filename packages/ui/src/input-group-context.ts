import { createContext, useContext } from 'octane'
import type { InputGroupSize } from './props'

/** What a grouped control needs from its `InputGroup`: membership (so it
 *  drops its own borders/radii into the group's shared surface) plus the
 *  group's size and disabled state. Label/description/status ids come via
 *  the FieldContext the group's Field provides — no duplication. */
export interface InputGroupContextValue {
	isDisabled?: boolean
	size?: InputGroupSize
}

export const InputGroupContext = createContext<InputGroupContextValue | null>(null)
export const InputGroupProvider: any = InputGroupContext

/** True (with group state) when the control renders inside an InputGroup's
 *  surface — the control should flatten its own border/radius/background. */
export function useInputGroup(): (InputGroupContextValue & { inInputGroup: boolean }) | null {
	const group = useContext(InputGroupContext)
	return group == null ? null : { ...group, inInputGroup: true }
}
