// Sentry — AppKit leaf. The JSC host has no DOM, so the leaf probes the
// capabilities @sentry/browser actually needs (a fetch transport) instead of
// re-exporting the web source file (a `.web` tag is a macOS bundle boundary
// violation and `window` is absent anyway). Native crash capture through
// MetricKit MXCrashDiagnostic is a designed follow-up; this leaf covers
// JS-level errors, breadcrumbs and context only.
import * as BrowserSentry from '@sentry/browser'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { SentryBreadcrumb, SentryInitOptions, SentryService, SentryUser } from './types'

const transport = () =>
	typeof (globalThis as any).fetch === 'function'

let ready = false

export const sentry: SentryService = {
	get supported() {
		return transport()
	},

	init(options: SentryInitOptions): void {
		if (!transport()) {
			throw new UnavailabilityError('sentry')
		}

		BrowserSentry.init({ ...(options as any) })
		ready = true
	},

	captureException(error: unknown, context?: Record<string, unknown>): void {
		if (!ready) {
			return
		}
		BrowserSentry.captureException(error, context ? { extra: context } : undefined)
	},

	captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
		if (!ready) {
			return
		}
		BrowserSentry.captureMessage(message, level as any)
	},

	addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
		if (!ready) {
			return
		}
		BrowserSentry.addBreadcrumb(breadcrumb as any)
	},

	setUser(user: SentryUser | null): void {
		if (!ready) {
			return
		}
		BrowserSentry.setUser(user as any)
	},

	setTag(key: string, value: string): void {
		if (!ready) {
			return
		}
		BrowserSentry.setTag(key, value)
	},

	setContext(key: string, context: Record<string, unknown> | null): void {
		if (!ready) {
			return
		}
		BrowserSentry.setContext(key, context as any)
	},
}
