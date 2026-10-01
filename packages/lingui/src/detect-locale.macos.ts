// OS locale — macOS leaf. The Intl runtime default follows the host locale in
// either macOS host (AppKit bridge or system webview) without depending on DOM
// or NativeScript globals.
export function detectSystemLocale(): string | undefined {
	return Intl.DateTimeFormat().resolvedOptions().locale || undefined
}
