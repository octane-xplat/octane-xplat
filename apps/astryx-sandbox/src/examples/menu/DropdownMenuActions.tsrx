// Port of upstream DropdownMenu/DropdownMenuActions.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { DropdownMenu, Text, VStack } from '@octane-xplat/ui'
import { menuItems } from './helpers'

export function DropdownMenuActions() @{
	const [lastAction, setLastAction] = useState<string | null>(null)
	return (
		<VStack gap={3} align="start">
			<DropdownMenu
				button={{ label: 'Actions' }}
				items={menuItems([
					{ label: 'Edit', onClick: () => setLastAction('Edit') },
					{ label: 'Duplicate', onClick: () => setLastAction('Duplicate') },
					{ label: 'Move to folder', onClick: () => setLastAction('Move') },
					{ type: 'divider' },
					{ label: 'Archive', onClick: () => setLastAction('Archive') },
					{ label: 'Delete', onClick: () => setLastAction('Delete') },
				])}
			/>
			{lastAction && <Text type="supporting" color="secondary">Last action: {lastAction}</Text>}
		</VStack>
	)
}
