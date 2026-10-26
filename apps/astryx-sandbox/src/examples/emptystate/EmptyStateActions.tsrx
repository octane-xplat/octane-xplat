// Port of upstream EmptyState/EmptyStateActions.tsx (Astryx 0.6.4, MIT).
import { Button, EmptyState, Icon } from '@octane-xplat/ui'

export function EmptyStateActions() @{
	<EmptyState
		icon={<Icon name="sandbox-magnifying-glass" size={24} />}
		title="No results found"
		description="Try adjusting your search terms or clearing filters to see more results."
		actions={
			<>
				<Button label="Go back" variant="secondary" />
				<Button label="Clear filters" variant="primary" />
			</>
		}
	/>
}
