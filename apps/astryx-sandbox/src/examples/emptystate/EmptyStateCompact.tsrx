// Port of upstream EmptyState/EmptyStateCompact.tsx (Astryx 0.6.4, MIT).
import { Button, EmptyState, HStack, Icon } from '@octane-xplat/ui'

export function EmptyStateCompact() @{
	<EmptyState
		icon={<Icon name="sandbox-envelope" size={24} />}
		title="No notifications"
		description="You're all caught up. New notifications will appear here."
		actions={
			<HStack gap={2}>
				<Button label="Settings" variant="secondary" size="sm" />
				<Button label="Refresh" variant="primary" size="sm" />
			</HStack>
		}
		isCompact
	/>
}
