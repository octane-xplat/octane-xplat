import { createShortcuts, type ShortcutRuntime } from '@octane-xplat/shortcuts'

/** Install after the host mounts; dispose before the workspace closes. */
export function installWorkspaceShortcuts(
  target: object,
  actions: {
    getActiveScopes(): Iterable<string>
    openCommands(): void
    openInbox(): void
    save(): void
  },
): ShortcutRuntime {
  // 1. Attach the shortcuts service to the mounted host.
  const shortcuts = createShortcuts({ target, getActiveScopes: actions.getActiveScopes })

  // 2. Set context and bind a command that works while typing with a modifier.
  shortcuts.setContext('editor.readOnly', false)
  shortcuts.bind({
    combo: 'Mod+KeyK',
    editablePolicy: 'allow-if-meta',
    preventDefault: true,
    handler: actions.openCommands,
  })

  // 3. Limit saving to a writable editor scope.
  shortcuts.bind({
    combo: 'Mod+KeyS',
    scope: 'editor',
    when: '!editor.readOnly',
    editablePolicy: 'allow-if-meta',
    preventDefault: true,
    handler: actions.save,
  })

  // 4. Add a sequence and return the service so the owner can dispose it.
  shortcuts.bind({ sequence: 'g i', handler: actions.openInbox })
  return shortcuts
}
