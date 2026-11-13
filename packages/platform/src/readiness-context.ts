import { createContext, type Context } from 'octane'
import type { ReadinessController } from './readiness-state'

/** @internal Nearest registered-work owner. Internal integrations read this context. */
export const ReadinessContext: Context<ReadinessController | null> =
  createContext<ReadinessController | null>(null)
