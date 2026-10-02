import { createContext } from 'octane'

/** Dialog-internal wiring: the header's title becomes the dialog's
 *  accessible name (web `aria-labelledby`) and the modal autofocus target.
 *  Scoped to the dialog subtree — on native this context lives inside the
 *  overlay root, which is still a single Octane root, so context works. */
export interface DialogContextValue {
	/** Id the DialogHeader title should stamp on itself. */
	titleId: string
	/** False while `isInline` — title carries no autofocus/label duties. */
	isModal: boolean
}

export const DialogContext = createContext<DialogContextValue | null>(null)

/** JSX-provider form — the universal renderer's context is a callable
 *  rather than a `.Provider` member (same aliasing as FieldProvider). */
export const DialogProvider: any = DialogContext
