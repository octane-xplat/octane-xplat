// Port of upstream MoreMenu/MoreMenuWithSections.tsx (Astryx 0.6.4, MIT).
import { MoreMenu } from '@octane-xplat/ui'
import { menuItems } from './helpers'

export function MoreMenuWithSections() @{
	return (
		<MoreMenu
			variant="secondary"
			label="Document actions"
			items={menuItems([
				{ type: 'section', title: 'Actions', items: [
					{ label: 'Edit', icon: 'sandbox-pencil-square', onClick: () => {} },
					{ label: 'Duplicate', icon: 'sandbox-document-duplicate', onClick: () => {} },
				]},
				{ type: 'section', title: 'Danger zone', items: [
					{ label: 'Delete', icon: 'sandbox-trash', onClick: () => {} },
				]},
			]) as any}
		/>
	)
}
