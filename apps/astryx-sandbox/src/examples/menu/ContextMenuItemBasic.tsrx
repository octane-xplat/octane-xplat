// Port of upstream ContextMenuItem/ContextMenuItemBasic.tsx (Astryx 0.6.4, MIT).
import { ContextMenu, ContextMenuItem, View } from '@octane-xplat/ui'

export function ContextMenuItemBasic() @{
	return (
		<ContextMenu
			menu={
				<>
					<ContextMenuItem label="Edit" description="Modify this item" onSelect={() => {}} />
					<ContextMenuItem label="Duplicate" description="Create a copy" onSelect={() => {}} />
					<ContextMenuItem label="Delete" description="This action cannot be undone" onSelect={() => {}} />
				</>
			}
		>
			<View style={{ padding: 48, border: '2px dashed var(--color-border)', borderRadius: 8, textAlign: 'center' }}>
				Right-click this area
			</View>
		</ContextMenu>
	)
}
