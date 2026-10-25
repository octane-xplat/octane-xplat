// Port of upstream Toast/ToastDeduplication.tsx (Astryx 0.6.4, MIT).
import { Button, HStack, Toast, useToast, VStack } from '@octane-xplat/ui'

export function ToastDeduplication() @{
	const toast = useToast()
	const showOffline = () => { toast({ body: 'You are offline', uniqueID: 'offline', collisionBehavior: 'ignore', isAutoHide: false }) }
	const showProgress = () => { toast({ body: `Uploading… ${Math.floor(Math.random() * 100)}%`, uniqueID: 'upload-progress', collisionBehavior: 'overwrite', isAutoHide: false }) }
	return (
		<VStack gap={3}>
			<Toast type="info" body="You are offline" isAutoHide={false} autoHideDuration={5000} isExiting={false} onDismiss={() => {}} />
			<HStack gap={3}>
				<Button label="Offline (ignore)" variant="secondary" size="sm" clickAction={showOffline} />
				<Button label="Progress (overwrite)" variant="secondary" size="sm" clickAction={showProgress} />
			</HStack>
		</VStack>
	)
}
