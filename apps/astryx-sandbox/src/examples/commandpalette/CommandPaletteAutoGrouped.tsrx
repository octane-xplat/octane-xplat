// Port of upstream CommandPalette/CommandPaletteAutoGrouped.tsx (Astryx 0.6.4, MIT).
// Upstream auxiliaryData.group → public item `group` field (same grouping contract).
import { useMemo } from 'octane'
import { CommandPalette, createStaticSource } from '@octane-xplat/ui'

export function CommandPaletteAutoGrouped() @{
	const source = useMemo(
		() =>
			createStaticSource([
				{ id: 'home', label: 'Home', group: 'Navigation' },
				{ id: 'settings', label: 'Settings', group: 'Navigation' },
				{ id: 'new-file', label: 'New File', group: 'Actions' },
				{ id: 'save', label: 'Save', group: 'Actions' },
			]),
		[],
	)
	<CommandPalette open onOpenChange={() => {}} searchSource={source} />
}
