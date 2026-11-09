// Windows leaf — @sentry/browser is web-only; report unsupported rather
// than importing a DOM-bound client.
import type { SentryService } from './types'

const unsupported = () => {
  throw new Error('unsupported: sentry is not available on windows')
}

const unsupportedAsync = async () => {
  throw new Error('unsupported: sentry is not available on windows')
}

/** Sentry error-reporting service — see SentryService. */
export const sentry: SentryService = {
  supported: false,
  init: unsupported,
  captureException: unsupported,
  captureMessage: unsupported,
  addBreadcrumb: unsupported,
  setUser: unsupported,
  setTag: unsupported,
  setContext: unsupported,
  setEnabled: unsupported,
  flush: unsupportedAsync,
  close: unsupportedAsync,
}
