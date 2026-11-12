import { createContext, type Context } from 'octane'
import type { DevReadinessScope } from './dev-readiness-state'

/** @internal Nearest development-action readiness owner. Internal integrations read this context. */
export const DevReadinessContext: Context<DevReadinessScope | null> =
  createContext<DevReadinessScope | null>(null)
