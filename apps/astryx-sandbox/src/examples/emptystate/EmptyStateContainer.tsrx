// Port of upstream EmptyState/EmptyStateContainer.tsx (Astryx 0.6.4, MIT).
import { Button, Card, EmptyState, Icon } from '@octane-xplat/ui'

export function EmptyStateContainer() @{
	<Card>
		<EmptyState
			icon={<Icon name="sandbox-folder" size={24} />}
			title="No projects yet"
			description="Create your first project to start organizing your work. You can invite team members after."
			actions={
				<>
					<Button label="Import" variant="secondary" />
					<Button label="Create project" variant="primary" />
				</>
			}
		/>
	</Card>
}
