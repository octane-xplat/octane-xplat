// Port of upstream DropdownMenu/DropdownMenuShowcase.tsx (Astryx 0.6.4, MIT).
import { DropdownMenu } from '@octane-xplat/ui'
import { menuItems } from './helpers'

export function DropdownMenuShowcase() @{
	return (
		<DropdownMenu
			button={{ label: 'Actions' }}
			items={menuItems([
				{ label: 'Edit', onClick: () => {} },
				{ label: 'Duplicate', onClick: () => {} },
				{ label: 'Delete', onClick: () => {} },
			])}
		/>
	)
}
