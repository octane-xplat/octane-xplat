// Port of upstream Dialog/DialogAdaptivePresentation.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { BottomSheet, Button, Dialog, DialogHeader, Heading, HStack, TextArea, TextInput, useMediaQuery, VStack, Text } from '@octane-xplat/ui'
import type { DialogPurpose } from '@octane-xplat/ui'

const TOUCH_ORIENTED_LG_QUERY = '(max-width: 1024px) and (pointer: coarse) and (hover: none)'

type AdaptivePresentation = 'dialog' | 'fullscreen' | 'bottom-sheet'

function AdaptiveDialog(props: {
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	title: string
	children?: any
	footer?: any
	purpose?: DialogPurpose
	width?: number | string
	maxHeight?: number | string
	touchPresentation?: AdaptivePresentation
	presentation?: AdaptivePresentation
	bottomSheetHeight?: 'hug' | 'capped' | 'tall' | number | string
}) @{
	const isTouch = useMediaQuery(TOUCH_ORIENTED_LG_QUERY)
	const resolved = props.presentation ?? (isTouch ? (props.touchPresentation ?? 'dialog') : 'dialog')
	if (resolved === 'bottom-sheet') {
		return (
			<BottomSheet isOpen={props.isOpen} onOpenChange={props.onOpenChange} label={props.title} purpose={props.purpose ?? 'info'} height={props.bottomSheetHeight ?? 'capped'}>
				<VStack gap={4} style={{ padding: 'var(--spacing-4)' }}>
					<Heading level={3}>{props.title}</Heading>
					{props.children}
					{props.footer}
				</VStack>
			</BottomSheet>
		)
	}
	return (
		<Dialog isOpen={props.isOpen} onOpenChange={props.onOpenChange} purpose={props.purpose ?? 'info'} width={props.width ?? 480} maxHeight={props.maxHeight ?? '75dvh'} variant={resolved === 'fullscreen' ? 'fullscreen' : 'standard'}>
			<VStack>
				<DialogHeader title={props.title} onOpenChange={props.onOpenChange} />
				<VStack gap={4} style={{ padding: 'var(--spacing-4)' }}>
					{props.children}
					{props.footer}
				</VStack>
			</VStack>
		</Dialog>
	)
}

export function DialogAdaptivePresentation() @{
	const [isOpen, setIsOpen] = useState(false)
	const [name, setName] = useState('Ruby Cheung')
	const [email, setEmail] = useState('ruby@example.com')
	const [notes, setNotes] = useState('')
	return (
		<>
			<Button label="Edit profile" clickAction={() => setIsOpen(true)} />
			<AdaptiveDialog
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				title="Edit profile"
				purpose="form"
				touchPresentation="bottom-sheet"
				bottomSheetHeight="tall"
				footer={
					<HStack gap={2} justify="end">
						<Button label="Cancel" variant="secondary" clickAction={() => setIsOpen(false)} />
						<Button label="Save profile" variant="primary" clickAction={() => setIsOpen(false)} />
					</HStack>
				}
			>
				<VStack gap={4}>
					<Text className="sb-type-supporting sb-color-secondary">
						Dialog remains the default presentation. This example opts into a Bottom Sheet only at lg and below when the device has a coarse pointer and no hover.
					</Text>
					<TextInput label="Name" value={name} onChange={setName} />
					<TextInput label="Email" keyboardType="email" value={email} onChange={setEmail} />
					<TextArea label="Notes" rows={6} value={notes} onChange={setNotes} />
				</VStack>
			</AdaptiveDialog>
		</>
	)
}
