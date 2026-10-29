import { createContext } from 'octane'
import type { RouterRenderScope } from './router-render-scope'

/** Shared by hook-only imports and renderer-compiled provider components. */
export const RouterScopeContext = createContext<RouterRenderScope | null>(null)
export const RouterFlowVisibilityContext = createContext(true)
