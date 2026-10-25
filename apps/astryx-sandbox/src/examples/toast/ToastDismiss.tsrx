// Port of upstream Toast/ToastDismiss.tsx (Astryx 0.6.4, MIT).
// Upstream dismiss fn → ToastHandle.dismiss().
import { useRef } from 'octane'
import { Button, HStack, Toast, useToast, VStack } from '@octane-xplat/ui'
import type { ToastHandle } from '@octane-xplat/ui'

export function ToastDismiss() @{
	const toast = useToast()
	const handleRef = useRef<ToastHandle | null>(null)
	return (
		<VStack gap={3}>
			<Toast type="info" body="Uploading file…" isAutoHide={false} autoHideDuration={5000} isExiting={false} onDismiss={() => {}} />
			<HStack gap={3}>
				<Button label="Show toast" variant="secondary" size="sm" clickAction={() => { handleRef.current = toast({ body: 'Uploading file…', isAutoHide: false }) }} />
				<Button label="Dismiss via code" variant="ghost" size="sm" clickAction={() => { handleRef.current?.dismiss(); handleRef.current = null }} />
			</HStack>
		</VStack>
	)
}
