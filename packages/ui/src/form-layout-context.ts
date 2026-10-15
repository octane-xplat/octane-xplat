import { createContext } from 'octane'
import type { FormLayoutDirection, FormOptionality } from './props'

export interface FormLayoutContextValue {
	direction: FormLayoutDirection
	defaultOptionality?: FormOptionality
}

/** The nearest layout owns arrangement direction. Nested layouts inherit
 *  omitted `defaultOptionality`, while explicit child values replace that
 *  default. `Field`/`FormField` reads both values here. */
export const FormLayoutContext = createContext<FormLayoutContextValue>({ direction: 'vertical' })
export const FormLayoutProvider: any = FormLayoutContext
