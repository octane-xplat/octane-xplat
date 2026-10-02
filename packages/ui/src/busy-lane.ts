import { createContext } from 'octane'

/** How BaseTypeahead hands its busy state to a wrapper that owns the
 *  inline-end lane (Typeahead/Tokenizer paint the spinner beside their own
 *  controls instead of a second indicator inside the base). A store rather
 *  than wrapper state so a search transition re-renders only the leaf that
 *  draws the Spinner. This is a context, not a prop, because the wiring is
 *  package-internal — anything on the public props becomes API. */
export interface BusyIndicatorLane {
	onBusyChange: (isBusy: boolean) => void
	subscribe: (onStoreChange: () => void) => () => void
	getIsBusy: () => boolean
}

export function createBusyIndicatorLane(): BusyIndicatorLane {
	let isBusy = false
	const listeners = new Set<() => void>()
	return {
		onBusyChange(next: boolean) {
			if (isBusy === next) {return}
			isBusy = next
			for (const listener of listeners) {listener()}
		},
		subscribe(onStoreChange: () => void) {
			listeners.add(onStoreChange)
			return () => listeners.delete(onStoreChange)
		},
		getIsBusy: () => isBusy,
	}
}

/** The wrapper's lane, or null when the base renders its own indicator. */
export const BusyLaneContext = createContext<BusyIndicatorLane | null>(null)
export const BusyLaneProvider: any = BusyLaneContext
