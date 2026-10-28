// Port of upstream Toast/ToastTypes.tsx (Astryx 0.6.4, MIT).
import { Button, Toast, useToast, VStack } from '@octane-xplat/ui'

export function ToastTypes() @{
	const toast = useToast()
	const showInfo = () => {
		toast({ body: 'Changes saved successfully.', type: 'info' })
	}

	const showError = () => {
		toast({ body: 'Failed to save changes.', type: 'error' })
	}

	return (
		<VStack gap={3}>
			<Toast
				type="info"
				body="Changes saved successfully."
				isAutoHide={false}
				autoHideDuration={5000}
				isExiting={false}
				onDismiss={() => {}}
				endContent={<Button label="Show toast" variant="ghost" size="sm" clickAction={showInfo} />}
			/>
			<Toast
				type="error"
				body="Failed to save changes."
				isAutoHide={false}
				autoHideDuration={5000}
				isExiting={false}
				onDismiss={() => {}}
				endContent={<Button label="Show toast" variant="ghost" size="sm" clickAction={showError} />}
			/>
		</VStack>
	)
}
