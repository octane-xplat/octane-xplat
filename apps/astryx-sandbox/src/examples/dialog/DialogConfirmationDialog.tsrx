// Port of upstream Dialog/DialogConfirmationDialog.tsx (Astryx 0.6.4, MIT).
import {
	useImperativeDialog,
	Dialog,
	DialogHeader,
	Button,
	HStack,
	Text,
	VStack,
} from '@octane-xplat/ui'

function Content(props: { onClose: () => void }) @{
	<VStack>
		<DialogHeader title="Delete project?" onOpenChange={() => props.onClose()} />
		<VStack gap={3} style={{ padding: 'var(--spacing-4)' }}>
			<Text type="body">
				This will permanently delete "Marketing Dashboard" and all of its data. This action cannot
				be undone.
			</Text>
			<HStack gap={2} justify="end">
				<Button label="Cancel" variant="secondary" clickAction={props.onClose} />
				<Button label="Delete" variant="destructive" clickAction={props.onClose} />
			</HStack>
		</VStack>
	</VStack>
}

export function DialogConfirmationDialog() @{
	const dialog = useImperativeDialog({ width: 400, purpose: 'form' })
	return (
		<>
			<Dialog isOpen isInline onOpenChange={() => {}} width={400} purpose="form">
				<Content onClose={() => dialog.show(<Content onClose={() => dialog.hide()} />)} />
			</Dialog>
			{dialog.element}
		</>
	)
}
