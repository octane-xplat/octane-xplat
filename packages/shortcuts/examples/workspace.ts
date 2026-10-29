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
	const shortcuts = createShortcuts({ target, getActiveScopes: actions.getActiveScopes })
	shortcuts.setContext('editor.readOnly', false)
	shortcuts.bind({
		combo: 'Mod+KeyK',
		editablePolicy: 'allow-if-meta',
		preventDefault: true,
		handler: actions.openCommands,
	})
	shortcuts.bind({
		combo: 'Mod+KeyS',
		scope: 'editor',
		when: '!editor.readOnly',
		editablePolicy: 'allow-if-meta',
		preventDefault: true,
		handler: actions.save,
	})
	shortcuts.bind({ sequence: 'g i', handler: actions.openInbox })
	return shortcuts
}
