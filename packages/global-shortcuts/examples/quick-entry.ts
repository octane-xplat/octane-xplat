import { createGlobalShortcuts, type GlobalShortcuts } from '../src/index'

/**
 * Install a system-wide "quick entry" hotkey. Call once at app startup on a
 * native desktop host; dispose when the owning feature shuts down.
 */
export function installQuickEntryShortcut(actions: {
	showQuickEntry(): void
	reportError(error: unknown): void
}): GlobalShortcuts {
	const globalShortcuts = createGlobalShortcuts({ onError: actions.reportError })
	void globalShortcuts
		.register({
			id: 'quick-entry',
			accelerator: 'Mod+Shift+Space',
			description: 'Show quick entry',
			onPress: () => actions.showQuickEntry(),
		})
		.then((result) => {
			if (!result.ok) actions.reportError(result.error)
		})
	return globalShortcuts
}
