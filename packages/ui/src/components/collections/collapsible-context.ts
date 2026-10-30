import { createContext, type Context } from 'octane'

export interface CollapsibleGroupContextValue {
	isOpen: (value: string) => boolean
	toggle: (value: string) => void
}

export const CollapsibleGroupContext: Context<CollapsibleGroupContextValue | null> =
	createContext<CollapsibleGroupContextValue | null>(null)

export const CollapsibleGroupProvider: any = CollapsibleGroupContext
