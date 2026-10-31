// TableContext — styling configuration shared by Table parts in children
// mode (Astryx TableContext). An absent context leaves parts presentational.

import { createContext, type Context } from 'octane'
import type { TableContextValue } from './types'

/** Resolved table context for cells and rows — null outside a Table. */
export const TableContext: Context<TableContextValue | null> =
	createContext<TableContextValue | null>(null)

export const TableContextProvider: any = TableContext
