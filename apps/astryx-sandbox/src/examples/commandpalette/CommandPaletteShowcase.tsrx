// Port of upstream CommandPalette/CommandPaletteShowcase.tsx (Astryx 0.6.4, MIT).
import { useMemo } from 'octane'
import { CommandPalette, createStaticSource } from '@octane-xplat/ui'

export function CommandPaletteShowcase() @{
	const source = useMemo(
		() =>
			createStaticSource([
				{ id: 'home', label: 'Home' },
				{ id: 'settings', label: 'Settings' },
				{ id: 'profile', label: 'Profile' },
				{ id: 'help', label: 'Help' },
			]),
		[],
	)
	<CommandPalette open onOpenChange={() => {}} searchSource={source} />
}
