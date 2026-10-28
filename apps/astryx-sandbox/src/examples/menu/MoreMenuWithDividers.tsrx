// Port of upstream MoreMenu/MoreMenuWithDividers.tsx (Astryx 0.6.4, MIT).
import { MoreMenu } from '@octane-xplat/ui'
import { menuItems } from './helpers'

export function MoreMenuWithDividers() @{
	return (
		<MoreMenu
			variant="secondary"
			items={
				menuItems([
					{ label: 'Edit', icon: 'sandbox-pencil-square', onClick: () => {} },
					{ label: 'Duplicate', icon: 'sandbox-document-duplicate', onClick: () => {} },
					{ type: 'divider' },
					{ label: 'Delete', icon: 'sandbox-trash', onClick: () => {} },
				]) as any
			}
		/>
	)
}
