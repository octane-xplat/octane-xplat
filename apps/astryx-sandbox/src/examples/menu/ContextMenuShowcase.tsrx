// Port of upstream ContextMenu/ContextMenuShowcase.tsx (Astryx 0.6.4, MIT).
import { ContextMenu, View } from '@octane-xplat/ui'
import { menuItems } from './helpers'

export function ContextMenuShowcase() @{
	return (
		<ContextMenu
			presentation="adaptive"
			items={menuItems([
				{ label: 'Cut', onClick: () => {} },
				{ label: 'Copy', onClick: () => {} },
				{ label: 'Paste', onClick: () => {} },
			])}
		>
			<View style={{ padding: 48, border: '2px dashed var(--color-border)', borderRadius: 8, textAlign: 'center' }}>
				Right-click or long-press this area
			</View>
		</ContextMenu>
	)
}
