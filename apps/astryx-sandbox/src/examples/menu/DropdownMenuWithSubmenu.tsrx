// Port of upstream DropdownMenu/DropdownMenuWithSubmenu.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSubMenu, Text, VStack } from '@octane-xplat/ui'

export function DropdownMenuWithSubmenu() @{
	const [lastAction, setLastAction] = useState<string | null>(null)
	return (
		<VStack gap={3} align="start">
			<DropdownMenu trigger="Actions" triggerClassName="vx-button vx-button--secondary vx-button--size-md">
				<DropdownMenuItem icon="sandbox-pencil-square" label="Rename" onSelect={() => setLastAction('Rename')} />
				<DropdownMenuSubMenu icon="sandbox-folder" label="Move to">
					<DropdownMenuItem label="Projects" onSelect={() => setLastAction('Move to Projects')} />
					<DropdownMenuItem label="Archive" onSelect={() => setLastAction('Move to Archive')} />
					<DropdownMenuItem label="Trash" onSelect={() => setLastAction('Move to Trash')} />
				</DropdownMenuSubMenu>
				<DropdownMenuItem icon="sandbox-trash" label="Delete" onSelect={() => setLastAction('Delete')} />
			</DropdownMenu>
			{lastAction && <Text className="sb-type-supporting sb-color-secondary">Last action: {lastAction}</Text>}
		</VStack>
	)
}
