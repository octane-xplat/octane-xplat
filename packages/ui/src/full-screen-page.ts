import type { Page } from '@nativescript/core'

/**
 * Make a NativeScript page start full-screen: the page stops applying the
 * system-bar insets itself, so its Mason root covers the whole window and
 * `SafeArea` becomes the only source of safe-area padding. Must run before
 * the page's content renders.
 */
export function prepareFullScreenPage<T extends Page>(page: T): T {
	page.iosIgnoreSafeArea = true
	page.androidOverflowEdge = 'ignore'
	return page
}
