// Port of upstream CommandPaletteList/CommandPaletteListBasic.tsx (Astryx 0.6.4, MIT).
// Upstream standalone List/Item parts → public data-driven palette: item
// disabled/selected states map to `disabled` + `value` selection.
import { useMemo, useState } from 'octane'
import { CommandPalette, createStaticSource } from '@octane-xplat/ui'

export function CommandPaletteListBasic() @{
	const [value, setValue] = useState('profile')
	const source = useMemo(
		() =>
			createStaticSource([
				{ id: 'home', label: 'Go Home' },
				{ id: 'settings', label: 'Open Settings' },
				{ id: 'profile', label: 'View Profile' },
				{ id: 'help', label: 'Help (unavailable)', disabled: true },
			]),
		[],
	)
	<CommandPalette open onOpenChange={() => {}} searchSource={source} value={value} onValueChange={setValue} />
}
