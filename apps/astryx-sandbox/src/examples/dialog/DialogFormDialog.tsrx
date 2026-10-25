// Port of upstream Dialog/DialogFormDialog.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { useImperativeDialog, Dialog, DialogHeader, Button, HStack, TextArea, TextInput, VStack } from '@octane-xplat/ui'

function Content(props: { onClose: () => void }) @{
	const [name, setName] = useState('Ruby Cheung')
	const [bio, setBio] = useState('Design systems engineer')
	<VStack>
		<DialogHeader title="Edit profile" subtitle="Update your display name and bio" onOpenChange={() => props.onClose()} />
		<VStack gap={4} style={{ padding: 'var(--spacing-4)' }}>
			<TextInput label="Display name" value={name} onChange={setName} placeholder="Enter your name" />
			<TextArea label="Bio" value={bio} onChange={setBio} placeholder="Tell us about yourself" />
			<HStack gap={2} justify="end">
				<Button label="Cancel" variant="secondary" clickAction={props.onClose} />
				<Button label="Save" variant="primary" clickAction={props.onClose} />
			</HStack>
		</VStack>
	</VStack>
}

export function DialogFormDialog() @{
	const dialog = useImperativeDialog({ purpose: 'form', width: 480 })
	return (
		<>
			<Dialog isOpen isInline onOpenChange={() => {}} purpose="form" width={480}>
				<Content onClose={() => dialog.show(<Content onClose={() => dialog.hide()} />)} />
			</Dialog>
			{dialog.element}
		</>
	)
}
