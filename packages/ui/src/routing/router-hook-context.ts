import { createContext, type Context } from 'octane'
import type { RouterRenderScope } from './router-render-scope'

/** Shared by hook-only imports and renderer-compiled provider components. */
export const RouterScopeContext: Context<RouterRenderScope | null> =
	createContext<RouterRenderScope | null>(null)

export const RouterFlowVisibilityContext: Context<boolean> = createContext(true)
