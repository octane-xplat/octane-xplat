/** GTK announce — posts to the live AT backend through
 *  GtkAccessible.announce on the app root's host widget (AT-SPI under a
 *  real session, the test backend under GTK_A11Y=test); the renderer's
 *  __octaneGtkHost bridge owns delivery and reports false on GTK < 4.14. */
export function announce(text: string): void {
	try {
		;(globalThis as Record<string, any>).__octaneGtkHost?.announce?.(text, 'polite')
	} catch {
		// Announcement delivery is best-effort — a missing bridge or widget
		// must never break the caller.
	}
}
