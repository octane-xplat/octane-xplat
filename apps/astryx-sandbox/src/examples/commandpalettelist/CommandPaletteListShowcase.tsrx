// Port of upstream CommandPaletteList/CommandPaletteListShowcase.tsx (Astryx 0.6.4, MIT).
// Upstream Group/Item parts → public `group` field (same grouped list contract).
import { useMemo } from 'octane'
import { CommandPalette, createStaticSource } from '@octane-xplat/ui'

export function CommandPaletteListShowcase() @{
	const source = useMemo(
		() =>
			createStaticSource([
				{ id: 'home', label: 'Go Home', group: 'Navigation' },
				{ id: 'settings', label: 'Open Settings', group: 'Navigation' },
				{ id: 'profile', label: 'View Profile', group: 'Navigation' },
				{ id: 'new-file', label: 'New File', group: 'Actions' },
				{ id: 'save-all', label: 'Save All', group: 'Actions' },
			]),
		[],
	)
	<CommandPalette open onOpenChange={() => {}} searchSource={source} />
}
