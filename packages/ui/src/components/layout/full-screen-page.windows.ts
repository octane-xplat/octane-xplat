import type { Page } from '@nativescript/core'

/**
 * Preserve the WinUI Page's client-area layout. Unlike the mobile Page,
 * the Windows Grid host has no system-bar safe-area adjustment to disable.
 * Its measurement and child layout remain owned by NativeScript and WinUI.
 */
export function prepareFullScreenPage<T extends Page>(page: T): T {
	return page
}
