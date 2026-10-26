// Port of upstream CommandPaletteFooter/CommandPaletteFooterShowcase.tsx (Astryx 0.6.4, MIT).
import { useMemo } from 'octane'
import { CommandPalette, createStaticSource } from '@octane-xplat/ui'

export function CommandPaletteFooterShowcase() @{
	const source = useMemo(
		() =>
			createStaticSource([
				{ id: 'new-file', label: 'New File' },
				{ id: 'open-recent', label: 'Open Recent' },
				{ id: 'save-all', label: 'Save All' },
			]),
		[],
	)
	<CommandPalette open onOpenChange={() => {}} searchSource={source} />
}
