import { createContext } from 'octane'

/** Target-only registry, independent of the public option-selection context. */
export const AppKitRadioViewsContext = createContext<Map<string, NSView> | null>(null)
export const AppKitRadioViewsProvider: any = AppKitRadioViewsContext
