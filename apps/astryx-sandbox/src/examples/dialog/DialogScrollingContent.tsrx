// Port of upstream Dialog/DialogScrollingContent.tsx (Astryx 0.6.4, MIT).
import { useImperativeDialog, Dialog, DialogHeader, Button, HStack, ScrollableArea, Text, VStack } from '@octane-xplat/ui'

const TERMS = [
	'You agree to use the service only for lawful purposes and in compliance with all applicable laws and regulations in your jurisdiction.',
	'Your account credentials are your responsibility. Notify us immediately if you suspect unauthorized access to your account.',
	'We reserve the right to suspend accounts that violate these terms or engage in abusive behavior toward other users.',
	'Content you upload remains your property. You grant us a license to host and display it within the service.',
	'We may update these terms at any time. Continued use after changes constitutes acceptance of the updated terms.',
	'The service is provided as-is without warranties of any kind. We are not liable for data loss or service interruptions.',
	'You may cancel your account at any time. Your data will be deleted within 30 days of cancellation.',
	'Disputes will be resolved through binding arbitration in accordance with applicable regulations.',
	'You agree not to reverse-engineer, decompile, or disassemble any part of the service or its underlying technology.',
	'We may collect anonymized usage data to improve the service. Personal data is handled per our Privacy Policy.',
	'Third-party integrations are governed by their own terms. We are not responsible for third-party service outages.',
	'You are responsible for maintaining backups of your data. We provide export tools but do not guarantee data recovery.',
	'Commercial use requires a Business plan. Free accounts are limited to personal and non-commercial projects.',
	'We may introduce new features or discontinue existing ones with 30 days notice via email or in-app notification.',
	'Violation of these terms may result in immediate termination of your account without prior notice or refund.',
]

function Content(props: { onClose: () => void }) @{
	<VStack>
		<DialogHeader title="Terms and Conditions" onOpenChange={() => props.onClose()} />
		<ScrollableArea style={{ padding: 'var(--spacing-4)', maxHeight: 320 }}>
			<VStack gap={3}>
				{TERMS.map((term, i) => (
					<Text type="body" key={i}>{i + 1}. {term}</Text>
				))}
			</VStack>
		</ScrollableArea>
		<HStack gap={2} justify="end" style={{ padding: 'var(--spacing-4)' }}>
			<Button label="Decline" variant="secondary" clickAction={props.onClose} />
			<Button label="Accept" variant="primary" clickAction={props.onClose} />
		</HStack>
	</VStack>
}

export function DialogScrollingContent() @{
	const dialog = useImperativeDialog({ maxHeight: '50dvh' })
	return (
		<>
			<Dialog isOpen isInline onOpenChange={() => {}} maxHeight={360}>
				<Content onClose={() => dialog.show(<Content onClose={() => dialog.hide()} />)} />
			</Dialog>
			{dialog.element}
		</>
	)
}
