// Port of upstream MoreMenu/MoreMenuBottomSheet.tsx (Astryx 0.6.4, MIT).
import { HStack, MoreMenu, Text, VStack, View } from '@octane-xplat/ui'
import { menuItems } from './helpers'

export function MoreMenuBottomSheet() @{
	return (
		<HStack gap={4} justify="between" style={{ width: 'min(100%, 360px)', padding: 16, border: '1px solid var(--color-border)', borderRadius: 12 }}>
			<VStack gap={1}>
				<Text style={{ fontWeight: 600 }}>Quarterly plan</Text>
				<Text type="supporting" color="secondary">Updated a few minutes ago</Text>
			</VStack>
			<MoreMenu
				presentation="bottom-sheet"
				label="Project actions"
				items={menuItems([
					{ label: 'Rename project', description: 'Update the project title.', icon: 'sandbox-pencil-square', onClick: () => {} },
					{ label: 'Duplicate project', description: 'Create a copy in this workspace.', icon: 'sandbox-document-duplicate', onClick: () => {} },
					{ label: 'Share project', description: 'Invite people to collaborate.', icon: 'sandbox-share', onClick: () => {} },
					{ label: 'Delete project', description: 'Move this project to the trash.', icon: 'sandbox-trash', variant: 'destructive', onClick: () => {} },
				]) as any}
			/>
		</HStack>
	)
}
