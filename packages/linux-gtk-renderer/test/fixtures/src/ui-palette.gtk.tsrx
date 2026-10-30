/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, CommandPalette, Text, View } from '@octane-xplat/ui'
import type { CommandPaletteMenuItem } from '@octane-xplat/ui'

const ITEMS: CommandPaletteMenuItem[] = [
	{ key: 'a', label: 'Alpha command' },
	{ key: 'b', label: 'Beta command', description: 'second' },
	{ key: 'c', label: 'Gamma command' },
]

export function PaletteProbe() @{
	const [open, setOpen] = useState(false)
	const [picked, setPicked] = useState('none')
	const [closed, setClosed] = useState('none')

	<View style={{ flexDirection: 'column' }}>
		<Button id="pal-open" label="OpenPalette" clickAction={() => setOpen(true)} />
		<Text id="picked">{picked}</Text>
		<Text id="closed">{closed}</Text>
		<CommandPalette
			items={ITEMS}
			open={open}
			onOpenChange={(o) => {
				if (!o) {
					setOpen(false)
					setClosed('pal-closed')
				}
			}}
			onValueChange={(id) => setPicked('selected:' + id)}
		/>
	</View>
}
