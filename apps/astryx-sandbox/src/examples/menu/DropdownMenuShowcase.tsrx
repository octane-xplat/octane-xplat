// Port of upstream DropdownMenu/DropdownMenuShowcase.tsx (Astryx 0.6.4, MIT).
import { DropdownMenu } from '@octane-xplat/ui'
import { menuItems } from './helpers'

export function DropdownMenuShowcase() @{
	return (
		<DropdownMenu
			trigger="Actions"
			triggerClassName="vx-button vx-button--secondary vx-button--size-md"
			items={menuItems([
				{ label: 'Edit', onClick: () => {} },
				{ label: 'Duplicate', onClick: () => {} },
				{ label: 'Delete', onClick: () => {} },
			])}
		/>
	)
}
