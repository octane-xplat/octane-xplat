import { createGlobalShortcuts, type GlobalShortcuts } from '@octane-xplat/global-shortcuts'

/**
 * Install a system-wide "quick entry" hotkey. Call once at app startup on a
 * native desktop host; dispose when the owning feature shuts down.
 */
export function installQuickEntryShortcut(actions: {
  showQuickEntry(): void
  reportError(error: unknown): void
}): GlobalShortcuts {
  // 1. Create the service with an error handler for host failures.
  const globalShortcuts = createGlobalShortcuts({ onError: actions.reportError })

  // 2. Register the hotkey and report an unsuccessful registration.
  void globalShortcuts
    .register({
      id: 'quick-entry',
      accelerator: 'Mod+Shift+Space',
      description: 'Show quick entry',
      onPress: () => actions.showQuickEntry(),
    })
    .then((result) => {
      if (!result.ok) {
        actions.reportError(result.error)
      }
    })

  // 3. Return the service so the owner can dispose it at shutdown.
  return globalShortcuts
}
