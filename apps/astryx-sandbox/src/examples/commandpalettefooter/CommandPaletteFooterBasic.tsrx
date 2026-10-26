// Port of upstream CommandPaletteFooter/CommandPaletteFooterBasic.tsx (Astryx 0.6.4, MIT).
// Upstream bare <CommandPaletteFooter/> renders default key hints → public
// default footer renders hints already; an empty footer slot mirrors it.
import { useMemo } from 'octane'
import { CommandPalette, createStaticSource, Text } from '@octane-xplat/ui'

export function CommandPaletteFooterBasic() @{
	const source = useMemo(
		() =>
			createStaticSource([
				{ id: 'new-file', label: 'New File' },
				{ id: 'open-recent', label: 'Open Recent' },
				{ id: 'save-all', label: 'Save All' },
			]),
		[],
	)
	<CommandPalette open onOpenChange={() => {}} searchSource={source} footer={<Text type="supporting" color="secondary">↑↓ to navigate · ↵ to select · esc to close</Text>} />
}
