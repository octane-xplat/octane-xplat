// Port of upstream ContextMenu/ContextMenuBottomSheet.tsx (Astryx 0.6.4, MIT).
import { ContextMenu, Text, VStack, View } from '@octane-xplat/ui'
import { menuItems } from './helpers'

export function ContextMenuBottomSheet() @{
	return (
		<ContextMenu
			presentation="bottom-sheet"
			label="Document actions"
			items={menuItems([
				{
					label: 'Rename document',
					description: 'Change the title shown to collaborators.',
					icon: 'sandbox-pencil-square',
					onClick: () => {},
				},
				{
					label: 'Duplicate document',
					description: 'Create a copy in the same workspace.',
					icon: 'sandbox-document-duplicate',
					onClick: () => {},
				},
				{
					label: 'Share document',
					description: 'Invite people or copy a share link.',
					icon: 'sandbox-share',
					onClick: () => {},
				},
				{
					label: 'Delete document',
					description: 'Move this document to the trash.',
					icon: 'sandbox-trash',
					variant: 'destructive',
					onClick: () => {},
				},
			])}
		>
			<View style={{ padding: 32, border: '1px solid var(--color-border)', borderRadius: 12 }}>
				<VStack gap={2}>
					<Text style={{ fontWeight: 600 }}>Quarterly plan</Text>
					<Text type="supporting" color="secondary">
						Long-press on touch or right-click for document actions.
					</Text>
				</VStack>
			</View>
		</ContextMenu>
	)
}
