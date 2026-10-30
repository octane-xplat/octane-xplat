// Sentry — native leaf over @nativescript-community/sentry (sentry-cocoa +
// sentry-java). Init/capture/context are thin pass-throughs; options we don't
// model yet still forward via the init bag.
import * as NativeSentry from '@nativescript-community/sentry'
import type { SentryBreadcrumb, SentryInitOptions, SentryService, SentryUser } from './types'

/** Sentry error-reporting service — see SentryService. */
export const sentry: SentryService = {
	supported: true,

	init(options: SentryInitOptions): void {
		;(NativeSentry as any).init({ ...(options as any) })
	},

	captureException(error: unknown, context?: Record<string, unknown>): void {
		NativeSentry.captureException(error, context ? { extra: context } : undefined)
	},

	captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
		NativeSentry.captureMessage(message, level as any)
	},

	addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
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
}
