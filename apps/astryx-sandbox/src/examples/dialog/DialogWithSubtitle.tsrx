// Port of upstream Dialog/DialogWithSubtitle.tsx (Astryx 0.6.4, MIT).
import { useImperativeDialog, Dialog, DialogHeader, Button, HStack, Text, VStack } from '@octane-xplat/ui'

function Content(props: { onClose: () => void }) @{
	<VStack>
		<DialogHeader title="Transfer project ownership" subtitle="This action requires confirmation from the new owner" />
		<VStack gap={3} style={{ padding: 'var(--spacing-4)' }}>
			<Text className="sb-type-body">
				You are about to transfer "Marketing Dashboard" to Sarah Chen. Once accepted, you will lose admin access.
			</Text>
			<HStack gap={2} justify="end">
				<Button label="Cancel" variant="secondary" clickAction={props.onClose} />
				<Button label="Transfer" variant="primary" clickAction={props.onClose} />
			</HStack>
		</VStack>
	</VStack>
}

export function DialogWithSubtitle() @{
	const dialog = useImperativeDialog({ purpose: 'required' })
	return (
		<>
			<Dialog isOpen isInline onOpenChange={() => {}} purpose="required">
				<Content onClose={() => dialog.show(<Content onClose={() => dialog.hide()} />)} />
			</Dialog>
			{dialog.element}
		</>
	)
}
