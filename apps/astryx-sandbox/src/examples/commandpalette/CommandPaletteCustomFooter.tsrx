// Port of upstream CommandPalette/CommandPaletteCustomFooter.tsx (Astryx 0.6.4, MIT).
import { useMemo } from 'octane'
import { CommandPalette, createStaticSource, Text } from '@octane-xplat/ui'

export function CommandPaletteCustomFooter() @{
	const source = useMemo(
		() =>
			createStaticSource([
				{ id: 'home', label: 'Home' },
				{ id: 'settings', label: 'Settings' },
			]),
		[],
	)
	<CommandPalette
		open
		onOpenChange={() => {}}
		searchSource={source}
		footer={<Text type="supporting">Pro tip: use ⌘K to open anywhere</Text>}
	/>
}
