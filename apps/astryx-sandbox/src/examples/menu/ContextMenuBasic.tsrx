// Port of upstream ContextMenu/ContextMenuBasic.tsx (Astryx 0.6.4, MIT).
import { ContextMenu, View } from '@octane-xplat/ui'
import { menuItems } from './helpers'

export function ContextMenuBasic() @{
	return (
		<ContextMenu
			presentation="adaptive"
			items={menuItems([
				{ label: 'Cut', onClick: () => {} },
				{ label: 'Copy', onClick: () => {} },
				{ label: 'Paste', onClick: () => {} },
				{ type: 'divider' },
				{ label: 'Delete', onClick: () => {} },
			])}
		>
			<View
				style={{
					padding: 48,
					border: '2px dashed var(--color-border)',
					borderRadius: 8,
					textAlign: 'center',
				}}
			>
				Right-click or long-press this area
			</View>
		</ContextMenu>
	)
}
