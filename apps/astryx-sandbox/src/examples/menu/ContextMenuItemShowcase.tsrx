// Port of upstream ContextMenuItem/ContextMenuItemShowcase.tsx (Astryx 0.6.4, MIT).
import { ContextMenu, ContextMenuItem, View } from '@octane-xplat/ui'

export function ContextMenuItemShowcase() @{
	return (
		<ContextMenu
			menu={
				<>
					<ContextMenuItem
						icon="sandbox-pencil-square"
						label="Edit"
						description="Modify this item"
						onSelect={() => {}}
					/>
					<ContextMenuItem
						icon="sandbox-document-duplicate"
						label="Duplicate"
						description="Create a copy"
						onSelect={() => {}}
					/>
					<ContextMenuItem icon="sandbox-share" label="Share" onSelect={() => {}} />
					<ContextMenuItem
						icon="sandbox-trash"
						label="Delete"
						description="This action cannot be undone"
						variant="destructive"
						onSelect={() => {}}
					/>
				</>
			}
		>
			<View
				style={{
					padding: 48,
					border: '2px dashed var(--color-border)',
					borderRadius: 8,
					textAlign: 'center',
				}}
			>
				Right-click this area
			</View>
		</ContextMenu>
	)
}
