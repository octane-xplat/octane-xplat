import { createContext } from 'octane'
import type { NSView } from '@octane-xplat/platform/macos'

export interface AppKitMenuRow {
	label: string
	disabled: boolean
	press(): void
	openSubmenu?: () => void
}
export interface AppKitMenuRows {
	views: Map<string, NSView>
	rows: Map<string, () => AppKitMenuRow>
	changed?(): void
	willRemove?(key: string, view: NSView): void
}
/** Each popup root creates its own registry; nested surfaces never share rows. */
export const AppKitMenuRowsContext = createContext<AppKitMenuRows | null>(null)
export const AppKitMenuRowsProvider: any = AppKitMenuRowsContext
