// Hook entry points — called from slotted component code (.ts/.tsrx consumers
// are slot-forwarded by the app-side octane transform, same as ui's useRoute).
import { i18n, type I18n } from '@lingui/core'
import { useSyncExternalStore } from 'octane'

import { getLocale, subscribeLocale } from './lingui'

/** Subscribe the calling component to locale changes and return the locale. */
export function useLocale(): string {
	return useSyncExternalStore(subscribeLocale, getLocale)
}

/**
 * Subscribe the calling component to locale changes and return the Lingui
 * i18n instance. Call this in components that render localized text so they
 * re-render when setLocale switches catalogs — the core macros read the i18n
 * singleton, but nothing re-invokes the render without this subscription.
 */
export function useLingui(): I18n {
	useLocale()
	return i18n
}
