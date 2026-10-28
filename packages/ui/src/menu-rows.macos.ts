import { createContext } from 'octane'

export interface AppKitMenuRow {
	label: string
	disabled: boolean
	press(): void
	openSubmenu?: () => void
}
export interface AppKitMenuRows {
	views: Map<string, NSView>
	rows: Map<string, () => AppKitMenuRow>
}
/** Each popup root creates its own registry; nested surfaces never share rows. */
export const AppKitMenuRowsContext = createContext<AppKitMenuRows | null>(null)
export const AppKitMenuRowsProvider: any = AppKitMenuRowsContext
