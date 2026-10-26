// Port of upstream CommandPaletteGroup/CommandPaletteGroupShowcase.tsx (Astryx 0.6.4, MIT).
import { useMemo } from 'octane'
import { CommandPalette, createStaticSource } from '@octane-xplat/ui'

export function CommandPaletteGroupShowcase() @{
	const source = useMemo(
		() =>
			createStaticSource([
				{ id: 'index', label: 'index.tsx', group: 'Recent Files' },
				{ id: 'app', label: 'App.tsx', group: 'Recent Files' },
				{ id: 'settings', label: 'Open Settings', group: 'Commands' },
				{ id: 'save', label: 'Save File', group: 'Commands' },
			]),
		[],
	)
	<CommandPalette open onOpenChange={() => {}} searchSource={source} />
}
