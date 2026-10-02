import { createContext } from 'octane'
import type { BottomSheetProps } from './props'

/** One `BottomSheet` child's registration inside a `BottomSheetSwitcher`.
 *  `props` carries the whole prop bag so the switcher's single host can
 *  render the active panel verbatim (children are descriptor data — safe
 *  to hand across the overlay root boundary on native). */
export interface BottomSheetRegistration {
	sheetId: string
	props: BottomSheetProps
}

/** The switcher handle BottomSheet children consume. Registrations flow
 *  through the store so the switcher's overlay root (a separate Octane
 *  root on native) observes them without context crossing roots. */
export interface BottomSheetSwitcherHandle {
	register(spec: BottomSheetRegistration): void
	unregister(sheetId: string): void
	/** Report a user dismissal (drag/scrim/Escape) to the switcher. */
	requestDismiss(): void
	/** The sheetId the switcher is currently showing. */
	activeSheet(): string | null
}

export const BottomSheetSwitcherContext = createContext<BottomSheetSwitcherHandle | null>(null)

/** JSX-provider form — universal-renderer contexts are callables, not
 *  `.Provider` members (same aliasing as FieldProvider/DialogProvider). */
export const BottomSheetSwitcherProvider: any = BottomSheetSwitcherContext
