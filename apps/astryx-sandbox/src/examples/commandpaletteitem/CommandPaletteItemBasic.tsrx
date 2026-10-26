// Port of upstream CommandPaletteItem/CommandPaletteItemBasic.tsx (Astryx 0.6.4, MIT).
import { useMemo, useState } from 'octane'
import { CommandPalette, createStaticSource } from '@octane-xplat/ui'

export function CommandPaletteItemBasic() @{
	const [value, setValue] = useState('open-recent')
	const source = useMemo(
		() =>
			createStaticSource([
				{ id: 'new-file', label: 'New File' },
				{ id: 'open-recent', label: 'Open Recent' },
				{ id: 'save-all', label: 'Save All' },
				{ id: 'publish', label: 'Publish (disabled)', disabled: true },
			]),
		[],
	)
	<CommandPalette open onOpenChange={() => {}} searchSource={source} value={value} onValueChange={setValue} />
}
