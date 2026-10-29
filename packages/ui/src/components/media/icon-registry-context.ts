import { createContext, useContext } from 'octane'
import { defaultIconRegistry } from './icons'
import type { IconRegistry } from '../../props'

export const IconRegistryContext = createContext<IconRegistry>(defaultIconRegistry)
/** JSX-provider form for Octane's callable context API. */
export const IconRegistryProvider: any = IconRegistryContext

export function useIconRegistry(): IconRegistry {
	return useContext(IconRegistryContext)
}
