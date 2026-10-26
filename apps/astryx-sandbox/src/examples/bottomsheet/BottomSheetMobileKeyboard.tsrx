// Port of upstream BottomSheet/BottomSheetMobileKeyboard.tsx (Astryx 0.6.4, MIT).
// Upstream <form onSubmit> adapted to a plain Save action.
import { useState } from 'octane'
import { BottomSheet, Button, Divider, Heading, Text, TextArea, TextInput, VStack } from '@octane-xplat/ui'

export function BottomSheetMobileKeyboard() @{
	const [isOpen, setIsOpen] = useState(false)
	const [values, setValues] = useState({ name: '', email: '', company: '', role: '', bio: '', notes: '' })
	const update = (field: keyof typeof values) => (value: string) => setValues((v) => ({ ...v, [field]: value }))
	return (
		<>
			<Button label="Edit profile" clickAction={() => setIsOpen(true)} />
			<BottomSheet isOpen={isOpen} onOpenChange={setIsOpen} label="Edit profile" height="tall">
				<VStack gap={4} style={{ padding: 'var(--spacing-4)' }}>
					<Heading level={3}>Edit profile</Heading>
					<Divider />
					<Text type="supporting" color="secondary">
						Focus fields throughout the form to see them remain visible above the mobile keyboard.
					</Text>
					<TextInput label="Name" value={values.name} onChange={update('name')} />
					<TextInput label="Email" keyboardType="email" value={values.email} onChange={update('email')} />
					<TextInput label="Company" value={values.company} onChange={update('company')} />
					<TextInput label="Role" value={values.role} onChange={update('role')} />
					<TextArea label="Bio" rows={5} value={values.bio} onChange={update('bio')} />
					<TextArea label="Notes" rows={5} value={values.notes} onChange={update('notes')} />
					<Button label="Save profile" variant="primary" clickAction={() => setIsOpen(false)} />
				</VStack>
			</BottomSheet>
		</>
	)
}
