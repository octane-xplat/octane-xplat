// Sentry — web leaf over @sentry/browser core (octane is not React, so no
// @sentry/react). Same surface as native. Filtering options forward to the
// SDK; collection gating is enforced here first so disabled or closed
// collection cannot reach the SDK, then the SDK's own `enabled` flag is kept
// in step so internally generated reports stop too.
import * as BrowserSentry from '@sentry/browser'
import type { SentryBreadcrumb, SentryInitOptions, SentryService, SentryUser } from './types'

let collecting = false
let closed = false
let initialized = false

/** Sentry error-reporting service — see SentryService. */
export const sentry: SentryService = {
  supported: typeof window !== 'undefined',

  init(options: SentryInitOptions): void {
    BrowserSentry.init({ ...(options as any) })
    initialized = true
    collecting = options.enabled !== false
    closed = false
  },

  captureException(error: unknown, context?: Record<string, unknown>): string | undefined {
    if (!collecting || closed) {
      return undefined
    }
    return BrowserSentry.captureException(error, context ? { extra: context } : undefined)
  },

  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
  ): string | undefined {
    if (!collecting || closed) {
      return undefined
    }
    return BrowserSentry.captureMessage(message, level as any)
  },

  addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
    if (!collecting || closed) {
      return
    }
    BrowserSentry.addBreadcrumb(breadcrumb as any)
  },

  setUser(user: SentryUser | null): void {
    BrowserSentry.setUser(user as any)
  },

  setTag(key: string, value: string): void {
    BrowserSentry.setTag(key, value)
  },

  setContext(key: string, context: Record<string, unknown> | null): void {
    BrowserSentry.setContext(key, context as any)
  },

  setEnabled(enabled: boolean): void {
    if (!initialized || closed) {
      return
    }
    collecting = enabled
    const client = BrowserSentry.getClient()
    if (client) {
      client.getOptions().enabled = enabled
    }
  },

  flush(timeout?: number): Promise<boolean> {
    return BrowserSentry.flush(timeout)
  },

  async close(timeout?: number): Promise<boolean> {
    collecting = false
    closed = true
    return BrowserSentry.close(timeout)
  },
}
