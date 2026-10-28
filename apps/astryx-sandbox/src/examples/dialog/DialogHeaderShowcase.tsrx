// Port of upstream DialogHeader/DialogHeaderShowcase.tsx (Astryx 0.6.4, MIT).
import { Card, Dialog, DialogHeader, Text, VStack } from '@octane-xplat/ui'

export function DialogHeaderShowcase() @{
	return (
		<Dialog isOpen isInline onOpenChange={() => {}}>
			<VStack>
				<DialogHeader
					title="Edit Profile"
					subtitle="Update your personal information"
					onOpenChange={() => {}}
				/>
				<VStack style={{ padding: 'var(--spacing-4)' }}>
					<Card variant="muted">
						<Text type="body" color="secondary">
							Dialog body content goes here.
						</Text>
					</Card>
				</VStack>
			</VStack>
		</Dialog>
	)
}
