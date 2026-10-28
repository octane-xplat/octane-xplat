// Port of upstream CommandPalette/CommandPaletteRichItems.tsx (Astryx 0.6.4, MIT).
// Upstream auxiliaryData.shortcut → public item `shortcut` field.
import { useMemo } from 'octane'
import { CommandPalette, createStaticSource, Kbd, Text } from '@octane-xplat/ui'

const commands = [
	{ id: 'settings', label: 'Open Settings', group: 'Navigation', shortcut: 'mod+,' },
	{ id: 'profile', label: 'View Profile', group: 'Navigation' },
	{ id: 'new-file', label: 'Create New File', group: 'Actions', shortcut: 'mod+n' },
	{ id: 'search', label: 'Search Files', group: 'Actions', shortcut: 'mod+p' },
]

export function CommandPaletteRichItems() @{
	const source = useMemo(() => createStaticSource(commands), [])

	<CommandPalette
		open
		onOpenChange={() => {}}
		searchSource={source}
		renderItem={(item: { label: string; shortcut?: string }) => (
			<>
				<Text type="body" style={{ flex: 1 }}>
					{item.label}
				</Text>
				{item.shortcut && <Kbd keys={item.shortcut} />}
			</>
		)}
	/>
}
