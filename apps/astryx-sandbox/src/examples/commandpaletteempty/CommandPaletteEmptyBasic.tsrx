// Port of upstream CommandPaletteEmpty/CommandPaletteEmptyBasic.tsx (Astryx 0.6.4, MIT).
// Upstream emptyBootstrapText element → public emptyBootstrapText string.
import { useMemo } from 'octane'
import { CommandPalette, createStaticSource } from '@octane-xplat/ui'

export function CommandPaletteEmptyBasic() @{
	const emptySource = useMemo(() => createStaticSource([]), [])

	<CommandPalette
		open
		onOpenChange={() => {}}
		searchSource={emptySource}
		emptyBootstrapText="No commands available"
	/>
}
