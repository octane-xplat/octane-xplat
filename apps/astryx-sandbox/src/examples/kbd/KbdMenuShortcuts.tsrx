// Port of upstream Kbd/KbdMenuShortcuts.tsx (Astryx 0.6.4, MIT).
import { Card, Kbd, List, ListItem } from '@octane-xplat/ui'

const menuItems = [
	{ label: 'Cut', keys: 'mod+x' },
	{ label: 'Copy', keys: 'mod+c' },
	{ label: 'Paste', keys: 'mod+v' },
	{ label: 'Undo', keys: 'mod+z' },
	{ label: 'Redo', keys: 'mod+shift+z' },
] as const

export function KbdMenuShortcuts() @{
	<Card padding={0}>
		<List density="compact">
			{menuItems.map((item) => (
				<ListItem key={item.label} label={item.label} endContent={<Kbd keys={item.keys} />} />
			))}
		</List>
	</Card>
}
