import { createContext, useContext } from 'octane'
import type { ListDensity, ListMarkerStyle } from './props'

export interface ListContextValue {
	density: ListDensity
	hasDividers: boolean
	listStyle: ListMarkerStyle
	edgeCompensation?: 'inline'
	/** Starting index for 'decimal' lists (the web leaf uses a CSS counter;
	 *  native renders numbered labels directly). */
	start?: number
}

export const ListContext = createContext<ListContextValue | null>(null)
export const ListProvider: any = ListContext

export function useListContext(): ListContextValue {
	return useContext(ListContext) ?? { density: 'balanced', hasDividers: false, listStyle: 'none' }
}
