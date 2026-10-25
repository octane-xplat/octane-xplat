// Port of upstream DropdownMenu/DropdownMenuWithDisabledItems.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { DropdownMenu, Text, VStack } from '@octane-xplat/ui'
import { menuItems } from './helpers'

export function DropdownMenuWithDisabledItems() @{
	const [lastAction, setLastAction] = useState<string | null>(null)
	return (
		<VStack gap={3} align="start">
			<DropdownMenu
				trigger="Manage team"
				triggerClassName="vx-button vx-button--secondary vx-button--size-md"
				items={menuItems([
					{ label: 'Invite member', onClick: () => setLastAction('Invite') },
					{ label: 'Edit roles', onClick: () => setLastAction('Edit roles') },
					{ type: 'divider' },
					{ label: 'Transfer ownership', isDisabled: true },
					{ label: 'Delete team', isDisabled: true },
				])}
			/>
			{lastAction && <Text className="sb-type-supporting sb-color-secondary">Last action: {lastAction}</Text>}
			<Text className="sb-type-supporting sb-color-secondary">Destructive actions are disabled for non-admin users</Text>
		</VStack>
	)
}
