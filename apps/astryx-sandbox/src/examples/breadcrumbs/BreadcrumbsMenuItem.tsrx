// Port of upstream Breadcrumbs/BreadcrumbsMenuItem.tsx (Astryx 0.6.4, MIT).
import { BreadcrumbItem, Breadcrumbs } from '@octane-xplat/ui'

const teamMenu = [
	{ label: 'Design', onClick: () => {} },
	{ label: 'Engineering', onClick: () => {} },
	{ type: 'divider' as const },
	{ label: 'Data', onClick: () => {} },
]

export function BreadcrumbsMenuItem() @{
	<Breadcrumbs>
		<BreadcrumbItem href="/">Home</BreadcrumbItem>
		<BreadcrumbItem menu={teamMenu}>Teams</BreadcrumbItem>
		<BreadcrumbItem isCurrent>Overview</BreadcrumbItem>
	</Breadcrumbs>
}
