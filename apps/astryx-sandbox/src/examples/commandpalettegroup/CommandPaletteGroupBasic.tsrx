// Port of upstream CommandPaletteGroup/CommandPaletteGroupBasic.tsx (Astryx 0.6.4, MIT).
import { useMemo } from 'octane'
import { CommandPalette, createStaticSource } from '@octane-xplat/ui'

export function CommandPaletteGroupBasic() @{
	const source = useMemo(
		() =>
			createStaticSource([
				{ id: 'home', label: 'Go to Home', group: 'Navigation' },
				{ id: 'dashboard', label: 'Go to Dashboard', group: 'Navigation' },
				{ id: 'new-file', label: 'New File', group: 'Actions' },
				{ id: 'save-all', label: 'Save All', group: 'Actions' },
			]),
		[],
	)
	<CommandPalette open onOpenChange={() => {}} searchSource={source} />
}
