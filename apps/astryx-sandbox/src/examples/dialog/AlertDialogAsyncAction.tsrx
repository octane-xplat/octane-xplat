// Port of upstream AlertDialog/AlertDialogAsyncAction.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { AlertDialog } from '@octane-xplat/ui'

export function AlertDialogAsyncAction() @{
	const [isLoading, setIsLoading] = useState(false)
	return (
		<AlertDialog
			isOpen
			isInline
			onOpenChange={() => {}}
			title="Revoke access?"
			description="This user will immediately lose access to all shared resources."
			actionLabel="Revoke"
			isActionLoading={isLoading}
			onAction={async () => {
				setIsLoading(true)
				await new Promise((r) => setTimeout(r, 2000))
				setIsLoading(false)
			}}
		/>
	)
}
