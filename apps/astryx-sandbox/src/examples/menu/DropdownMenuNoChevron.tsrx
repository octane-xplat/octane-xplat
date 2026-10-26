// Port of upstream DropdownMenu/DropdownMenuNoChevron.tsx (Astryx 0.6.4, MIT).
// Upstream button={{icon,isIconOnly}} + hasChevron=false → icon-only trigger.
import { useState } from 'octane'
import { DropdownMenu, Icon, Text, VStack } from '@octane-xplat/ui'
import { menuItems } from './helpers'

export function DropdownMenuNoChevron() @{
	const [lastAction, setLastAction] = useState<string | null>(null)
	return (
		<VStack gap={3} align="start">
			<DropdownMenu
				button={{
					label: 'More actions',
					icon: <Icon name="xplat-more-horizontal" />,
					variant: 'ghost',
					isIconOnly: true,
				}}
				hasChevron={false}
				items={menuItems([
					{ label: 'Copy link', onClick: () => setLastAction('Copy link') },
					{ label: 'Download', onClick: () => setLastAction('Download') },
					{ label: 'Print', onClick: () => setLastAction('Print') },
					{ type: 'divider' },
					{ label: 'Report', onClick: () => setLastAction('Report') },
				])}
			/>
			{lastAction && <Text type="supporting" color="secondary">Last action: {lastAction}</Text>}
		</VStack>
	)
}
