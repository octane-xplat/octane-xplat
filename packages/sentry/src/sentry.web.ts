// Sentry — web leaf over @sentry/browser core (octane is not React, so no
// @sentry/react). Same surface as native.
import * as BrowserSentry from '@sentry/browser'
import type { SentryBreadcrumb, SentryInitOptions, SentryService, SentryUser } from './types'

export const sentry: SentryService = {
	supported: typeof window !== 'undefined',

	init(options: SentryInitOptions): void {
		BrowserSentry.init({ ...(options as any) })
	},

	captureException(error: unknown, context?: Record<string, unknown>): void {
		BrowserSentry.captureException(error, context ? { extra: context } : undefined)
	},

	captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
		BrowserSentry.captureMessage(message, level as any)
	},

	addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
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
}
