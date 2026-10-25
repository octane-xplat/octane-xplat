// Port of upstream MoreMenu/MoreMenuDefaultMoreMenu.tsx (Astryx 0.6.4, MIT).
import { MoreMenu } from '@octane-xplat/ui'

export function MoreMenuDefaultMoreMenu() @{
	return (
		<MoreMenu items={[
			{ type: 'action', key: 'edit', label: 'Edit', onSelect: () => {} },
			{ type: 'action', key: 'dup', label: 'Duplicate', onSelect: () => {} },
			{ type: 'action', key: 'del', label: 'Delete', onSelect: () => {} },
		]} />
	)
}
