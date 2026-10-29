import type { Page } from '@nativescript/core'

/** NativeScript 9.1.3 disposes Page.ios on clearHistory, but Frame checks that
 * controller before attaching/recreating a reused Page. Prime the public Page
 * creation hook when restoring an outlet's declaring Page after reset.
 * See .agents/docs/notes/routing-contract.md for source/runtime evidence. */
export function prepareNavigationPage(page: Page): void {
	if (!page.ios) {
		page.createNativeView()
	}
}
