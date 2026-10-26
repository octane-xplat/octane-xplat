// Port of upstream EmptyState/EmptyStateShowcase.tsx (Astryx 0.6.4, MIT).
import { Button, EmptyState, Icon } from '@octane-xplat/ui'

export function EmptyStateShowcase() @{
	<EmptyState
		icon={<Icon name="sandbox-magnifying-glass" size={24} />}
		title="No results found"
		description="Try adjusting your search or filters to find what you need."
		actions={<Button label="Clear filters" variant="secondary" />}
	/>
}
