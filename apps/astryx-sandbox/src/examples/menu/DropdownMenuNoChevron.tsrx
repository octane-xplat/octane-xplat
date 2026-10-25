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
				accessibilityLabel="More actions"
				trigger={<Icon name="xplat-more-horizontal" />}
				triggerClassName="vx-button vx-button--ghost vx-button--size-md vx-button--icon"
				items={menuItems([
					{ label: 'Copy link', onClick: () => setLastAction('Copy link') },
					{ label: 'Download', onClick: () => setLastAction('Download') },
					{ label: 'Print', onClick: () => setLastAction('Print') },
					{ type: 'divider' },
					{ label: 'Report', onClick: () => setLastAction('Report') },
				])}
			/>
			{lastAction && <Text className="sb-type-supporting sb-color-secondary">Last action: {lastAction}</Text>}
		</VStack>
	)
}
