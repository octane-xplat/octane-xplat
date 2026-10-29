import { createContext } from 'octane'

export interface CollapsibleGroupContextValue {
	isOpen: (value: string) => boolean
	toggle: (value: string) => void
}

export const CollapsibleGroupContext = createContext<CollapsibleGroupContextValue | null>(null)
export const CollapsibleGroupProvider: any = CollapsibleGroupContext
