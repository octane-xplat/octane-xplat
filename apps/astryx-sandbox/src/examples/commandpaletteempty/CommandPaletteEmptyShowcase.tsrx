// Port of upstream CommandPaletteEmpty/CommandPaletteEmptyShowcase.tsx (Astryx 0.6.4, MIT).
import { useMemo } from 'octane'
import { CommandPalette, createStaticSource } from '@octane-xplat/ui'

export function CommandPaletteEmptyShowcase() @{
	const emptySource = useMemo(() => createStaticSource([]), [])

	<CommandPalette
		open
		onOpenChange={() => {}}
		searchSource={emptySource}
		emptyBootstrapText="No commands available yet"
	/>
}
