import { createContext } from 'octane'
import type { ToastPosition } from './props'

/** The nearest `ToastViewport`'s routing identity + defaults. `useToast`
 *  reads this in the declaring tree; the pushed entry carries the id so
 *  the right stack renders it — context never has to cross the overlay
 *  root boundary on native. */
export interface ToastViewportContextValue {
	id: string
	position: ToastPosition
	maxVisible: number
}

export const ToastViewportContext = createContext<ToastViewportContextValue | null>(null)

/** JSX-provider form — universal-renderer contexts are callables, not
 *  `.Provider` members (same aliasing as DialogProvider). */
export const ToastViewportProvider: any = ToastViewportContext
