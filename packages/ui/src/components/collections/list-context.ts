import { createContext, useContext, type Context } from 'octane'
import type { ListDensity, ListMarkerStyle } from '../../props'

/** Every marker a ListItem can draw: the public `listStyle` set plus the
 *  square, letter, and roman markers `ListMarkerScope` names for nested
 *  Markdown lists (Astryx `ListMarker`, spec:AST-061 DEC-6). */
export type ListMarker = 'disc' | 'circle' | 'square' | 'decimal' | 'lower-alpha' | 'lower-roman'

/** A task item's state, drawn as a read-only checkbox in the marker's
 *  place (Astryx `ListTaskMarker`). */
export interface ListTaskMarker {
	readonly isChecked: boolean
	/** The checkbox's accessible name: the item's text. */
	readonly label: string
}

export interface ListContextValue {
	density: ListDensity
	hasDividers: boolean
	listStyle: ListMarkerStyle
	edgeCompensation?: 'inline'
	/** Starting index for 'decimal' lists (the web leaf uses a CSS counter;
	 *  native renders numbered labels directly). */
	start?: number
	/** The marker items draw instead of the one `listStyle` names, set by
	 *  `ListMarkerScope`; internal. Ignored when `listStyle` is `'none'`. */
	marker?: ListMarker
	/** A task item's state, set by `ListMarkerScope`; internal. The item
	 *  draws a read-only checkbox instead of its marker. Ignored when
	 *  `listStyle` is `'none'`. */
	task?: ListTaskMarker
}

export const ListContext: Context<ListContextValue | null> = createContext<ListContextValue | null>(
	null,
)

export const ListProvider: any = ListContext

export function useListContext(): ListContextValue {
	return useContext(ListContext) ?? { density: 'balanced', hasDividers: false, listStyle: 'none' }
}
