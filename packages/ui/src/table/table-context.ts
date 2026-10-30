// TableContext — styling configuration shared by Table parts in children
// mode (Astryx TableContext). An absent context leaves parts presentational.

import { createContext, type Context } from 'octane'
import type { TableContextValue } from './types'

export const TableContext: Context<TableContextValue | null> =
	createContext<TableContextValue | null>(null)

export const TableContextProvider: any = TableContext
