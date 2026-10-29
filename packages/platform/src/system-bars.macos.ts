function unsupported(): void {
	try { console.warn('[octane-xplat] System bars are unsupported by the AppKit host.') }
	catch { /* Diagnostics cannot turn an unsupported no-op into an app failure. */ }
}

/** AppKit has no phone status/navigation bars. These calls do not tint window chrome. */
export const systemBars = {
	setStatusBarStyle(_style: 'light' | 'dark'): void { unsupported() },
	setColor(_color: string): void { unsupported() },
}
