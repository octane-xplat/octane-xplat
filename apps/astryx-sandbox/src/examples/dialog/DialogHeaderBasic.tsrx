// Port of upstream DialogHeader/DialogHeaderBasic.tsx (Astryx 0.6.4, MIT).
import { Dialog, DialogHeader, Text, VStack } from '@octane-xplat/ui'

export function DialogHeaderBasic() @{
	return (
		<Dialog isOpen isInline onOpenChange={() => {}}>
			<VStack>
				<DialogHeader title="Invite teammates" subtitle="Send invitations to join your workspace" onOpenChange={() => {}} />
				<VStack style={{ padding: 'var(--spacing-4)' }}>
					<Text type="body" color="secondary">Dialog body content goes here.</Text>
				</VStack>
			</VStack>
		</Dialog>
	)
}
