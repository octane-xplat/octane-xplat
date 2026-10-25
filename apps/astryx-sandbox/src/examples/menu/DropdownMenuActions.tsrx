// Port of upstream DropdownMenu/DropdownMenuActions.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { DropdownMenu, Text, VStack } from '@octane-xplat/ui'
import { menuItems } from './helpers'

export function DropdownMenuActions() @{
	const [lastAction, setLastAction] = useState<string | null>(null)
	return (
		<VStack gap={3} align="start">
			<DropdownMenu
				trigger="Actions"
				triggerClassName="vx-button vx-button--secondary vx-button--size-md"
				items={menuItems([
					{ label: 'Edit', onClick: () => setLastAction('Edit') },
					{ label: 'Duplicate', onClick: () => setLastAction('Duplicate') },
					{ label: 'Move to folder', onClick: () => setLastAction('Move') },
					{ type: 'divider' },
					{ label: 'Archive', onClick: () => setLastAction('Archive') },
					{ label: 'Delete', onClick: () => setLastAction('Delete') },
				])}
			/>
			{lastAction && <Text className="sb-type-supporting sb-color-secondary">Last action: {lastAction}</Text>}
		</VStack>
	)
}
