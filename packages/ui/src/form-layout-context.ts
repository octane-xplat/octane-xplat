import { createContext } from 'octane'
import type { FormLayoutDirection, FormOptionality } from './props'

export interface FormLayoutContextValue {
	direction: FormLayoutDirection
	defaultOptionality?: FormOptionality
}

/** Layered arrangement context: `Field`/`FormField` switches to a
 *  horizontal-labels render under `direction === 'horizontal-labels'`, and
 *  `useFieldControlProps` resolves `aria-required` from
 *  `defaultOptionality`. Nested FormLayouts shadow the outer value. */
export const FormLayoutContext = createContext<FormLayoutContextValue>({ direction: 'vertical' })
export const FormLayoutProvider: any = FormLayoutContext
