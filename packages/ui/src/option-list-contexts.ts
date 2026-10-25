import { createContext } from 'octane'

/** Shared selection-group context for the Astryx child parts
 *  (`RadioListItem`, `CheckboxListItem`, `SegmentedControlItem`, `Step`).
 *  Each provider supplies what its items need to render and report; an
 *  absent context leaves the item standalone/presentational. */

export interface OptionListContextValue {
	/** Currently selected value(s) in the parent group. */
	selected?: string | string[]
	/** Commit a value to the parent group. */
	select?: (value: string, on?: boolean) => void
	/** Group-level disabled/read-only state. */
	isDisabled?: boolean
	isReadOnly?: boolean
	size?: 'sm' | 'md' | 'lg'
}

export const RadioListContext = createContext<OptionListContextValue | null>(null)
export const CheckboxListContext = createContext<OptionListContextValue | null>(null)
export const SegmentedControlContext = createContext<OptionListContextValue | null>(null)

export interface StepperContextValue {
	activeStep?: number
	onStepClick?: (step: number) => void
	orientation?: 'horizontal' | 'vertical'
	indicatorPosition?: 'off-track' | 'on-track'
}

export const StepperContext = createContext<StepperContextValue | null>(null)

export const RadioListProvider: any = RadioListContext
export const CheckboxListProvider: any = CheckboxListContext
export const SegmentedControlProvider: any = SegmentedControlContext
export const StepperProvider: any = StepperContext
