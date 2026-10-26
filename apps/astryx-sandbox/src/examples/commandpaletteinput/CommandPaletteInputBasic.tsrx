// Port of upstream CommandPaletteInput/CommandPaletteInputBasic.tsx (Astryx 0.6.4, MIT).
// Upstream CommandPaletteInput part (placeholder + endContent) → public
// `placeholder` prop; the ⌘K end-content moves to the footer (no input slot).
import { useMemo } from 'octane'
import { CommandPalette, createStaticSource, Kbd } from '@octane-xplat/ui'

export function CommandPaletteInputBasic() @{
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
	<CommandPalette
		open
		onOpenChange={() => {}}
		searchSource={source}
		placeholder="Search commands, files, or actions..."
		footer={<Kbd keys="mod+k" />}
	/>
}
