// Sentry — native leaf over @nativescript-community/sentry (sentry-cocoa +
// sentry-java). Init/capture/context are thin pass-throughs; filtering
// options forward to the SDK. Collection gating is enforced here first so
// disabled or closed collection cannot reach the SDK, then the JS client's
// `enabled` flag is kept in step so internally generated reports stop too.
// close() also closes the native SDK through the plugin's wrapper hook so
// native crash capture stops with JS collection.
import * as NativeSentry from '@nativescript-community/sentry'
import { NATIVE } from '@nativescript-community/sentry/wrapper'
import type { SentryBreadcrumb, SentryInitOptions, SentryService, SentryUser } from './types'

let collecting = false
let closed = false
let initialized = false

/** Sentry error-reporting service — see SentryService. */
export const sentry: SentryService = {
  supported: true,

  init(options: SentryInitOptions): void {
    ;(NativeSentry as any).init({ ...(options as any) })
    initialized = true
    collecting = options.enabled !== false
    closed = false
  },

  captureException(error: unknown, context?: Record<string, unknown>): string | undefined {
    if (!collecting || closed) {
      return undefined
    }
    return NativeSentry.captureException(error, context ? { extra: context } : undefined)
  },

  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
  ): string | undefined {
    if (!collecting || closed) {
      return undefined
    }
    return NativeSentry.captureMessage(message, level as any)
  },

  addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
    if (!collecting || closed) {
      return
    }
    NativeSentry.addBreadcrumb(breadcrumb as any)
  },

  setUser(user: SentryUser | null): void {
    NativeSentry.setUser(user as any)
  },

  setTag(key: string, value: string): void {
    NativeSentry.setTag(key, value)
  },

  setContext(key: string, context: Record<string, unknown> | null): void {
    NativeSentry.setContext(key, context as any)
  },

  setEnabled(enabled: boolean): void {
    if (!initialized || closed) {
      return
    }
    collecting = enabled
    const client = NativeSentry.getCurrentHub().getClient()
    if (client) {
      client.getOptions().enabled = enabled
    }
  },

  flush(timeout?: number): Promise<boolean> {
    return NativeSentry.flush(timeout)
  },

  async close(timeout?: number): Promise<boolean> {
    collecting = false
    closed = true
    const client = NativeSentry.getCurrentHub().getClient()
    const drained = client ? await client.close(timeout) : true
    try {
      await NATIVE.closeNativeSdk()
    } catch {
      // Native teardown is best-effort; JS collection is already stopped.
    }
    return drained
  },
}
