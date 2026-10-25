// Port of upstream Toast/ToastStacking.tsx (Astryx 0.6.4, MIT).
import { useRef } from 'octane'
import { Button, Toast, useToast, VStack } from '@octane-xplat/ui'

const MESSAGES = [
	{ body: 'Changes saved.', type: 'info' as const },
	{ body: 'Failed to upload file.', type: 'error' as const },
	{ body: 'Message sent to Sarah Chen.', type: 'info' as const },
]

export function ToastStacking() @{
	const toast = useToast()
	const countRef = useRef(0)
	return (
		<VStack gap={3}>
			{MESSAGES.map((msg) => (
				<Toast key={msg.body} type={msg.type} body={msg.body} isAutoHide={false} autoHideDuration={5000} isExiting={false} onDismiss={() => {}} />
			))}
			<VStack align="start">
				<Button label="Show toast" variant="secondary" size="sm" clickAction={() => { toast(MESSAGES[countRef.current++ % MESSAGES.length]) }} />
			</VStack>
		</VStack>
	)
}
