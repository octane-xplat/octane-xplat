// Port of upstream CommandPaletteItem/CommandPaletteItemShowcase.tsx (Astryx 0.6.4, MIT).
import { useMemo } from 'octane'
import { CommandPalette, createStaticSource, Kbd, Text } from '@octane-xplat/ui'

const commands = [
	{ id: 'save', label: 'Save File', shortcut: 'mod+s' },
	{ id: 'find', label: 'Find in Files', shortcut: 'mod+shift+f' },
	{ id: 'palette', label: 'Command Palette', shortcut: 'mod+shift+p' },
	{ id: 'terminal', label: 'Toggle Terminal', shortcut: 'ctrl+`' },
]

export function CommandPaletteItemShowcase() @{
	const source = useMemo(() => createStaticSource(commands), [])

	<CommandPalette
		open
		onOpenChange={() => {}}
		searchSource={source}
		renderItem={(item: { label: string; shortcut?: string }) => (
			<>
				<Text type="body" style={{ flexGrow: 1 }}>
					{item.label}
				</Text>
				{item.shortcut && <Kbd keys={item.shortcut} />}
			</>
		)}
	/>
}
