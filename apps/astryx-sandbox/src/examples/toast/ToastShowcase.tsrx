// Port of upstream Toast/ToastShowcase.tsx (Astryx 0.6.4, MIT).
import { Button, Toast, useToast } from '@octane-xplat/ui'

export function ToastShowcase() @{
	const toast = useToast()
	const show = () => {
		toast({ body: 'Document saved successfully' })
	}

	return (
		<Toast
			type="info"
			body="Document saved successfully"
			endContent={<Button label="Show toast" variant="ghost" size="sm" clickAction={show} />}
			isAutoHide={false}
			autoHideDuration={5000}
			isExiting={false}
			onDismiss={() => {}}
		/>
	)
}
