### Keep native macOS context menus on the current record

The experimental AppKit context menu now retires outdated actions when items,
records or views change. It preserves child editing/nested menus, restores prior
menu ownership on cleanup and blocks disabled or retired selections. The macOS
demo now uses the native package. Actual pointer, tracking, keyboard and
VoiceOver qualification remains pending.

```tsx
// NoteActions.macos.tsx
import { AppKitContextMenu } from '@octane-xplat/context-menu/macos'
import { Text } from '@octane-xplat/ui'
export function NoteActions({ noteID }: { noteID: string }) {
	return <AppKitContextMenu id={`actions-${noteID}`} items={[{ id: 'rename', title: 'Rename' }]}
		trigger={() => <Text>Right-click this note</Text>} onItemSelected={(id) => console.log(noteID, id)} />
}
```

See [native AppKit menus](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/context-menu.md#native-macos-menus).
