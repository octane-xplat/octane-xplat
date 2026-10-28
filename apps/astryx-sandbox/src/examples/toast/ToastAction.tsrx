// Port of upstream Toast/ToastAction.tsx (Astryx 0.6.4, MIT).
import { Button, Link, Toast, useToast, VStack } from '@octane-xplat/ui'

export function ToastAction() @{
	const toast = useToast()
	const undo = () => {
		toast({ body: 'Undo successful', type: 'info' })
	}

	return (
		<VStack gap={3}>
			<Toast
				type="info"
				body="Item deleted"
				isAutoHide={false}
				autoHideDuration={5000}
				isExiting={false}
				onDismiss={() => {}}
				endContent={<Button label="Undo" variant="secondary" size="sm" clickAction={undo} />}
			/>
			<Toast
				type="info"
				body="Your report is ready."
				isAutoHide={false}
				autoHideDuration={5000}
				isExiting={false}
				onDismiss={() => {}}
				endContent={<Link href="#">View report</Link>}
			/>
		</VStack>
	)
}
