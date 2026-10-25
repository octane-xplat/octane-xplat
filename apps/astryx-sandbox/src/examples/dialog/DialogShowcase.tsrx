// Port of upstream Dialog/DialogShowcase.tsx (Astryx 0.6.4, MIT).
// Upstream Layout header/content slots re-authored as VStack composition.
import { Dialog, DialogHeader, Text, VStack } from '@octane-xplat/ui'

export function DialogShowcase() @{
	return (
		<Dialog isOpen isInline onOpenChange={() => {}}>
			<VStack>
				<DialogHeader title="Modal Title" onOpenChange={() => {}} />
				<VStack gap={3} style={{ padding: 'var(--spacing-4)' }}>
					<Text className="sb-type-body">Dialog content goes here.</Text>
				</VStack>
			</VStack>
		</Dialog>
	)
}
