// Port of upstream DropdownMenu/DropdownMenuWithSections.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { DropdownMenu, Text, VStack } from '@octane-xplat/ui'
import { menuItems } from './helpers'

export function DropdownMenuWithSections() @{
	const [lastAction, setLastAction] = useState<string | null>(null)
	return (
		<VStack gap={3} align="start">
			<DropdownMenu
				button={{ label: 'File', variant: 'ghost' }}
				items={menuItems([
					{ type: 'section', title: 'Create', items: [
						{ label: 'New document', onClick: () => setLastAction('New document') },
						{ label: 'New spreadsheet', onClick: () => setLastAction('New spreadsheet') },
						{ label: 'New folder', onClick: () => setLastAction('New folder') },
					]},
					{ type: 'section', title: 'Manage', items: [
						{ label: 'Share', onClick: () => setLastAction('Share') },
						{ label: 'Move', onClick: () => setLastAction('Move') },
						{ label: 'Archive', onClick: () => setLastAction('Archive') },
					]},
				])}
			/>
			{lastAction && <Text className="sb-type-supporting sb-color-secondary">Selected: {lastAction}</Text>}
		</VStack>
	)
}
