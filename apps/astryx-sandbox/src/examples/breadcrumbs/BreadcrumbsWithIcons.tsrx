// Port of upstream Breadcrumbs/BreadcrumbsWithIcons.tsx (Astryx 0.6.4, MIT).
import { BreadcrumbItem, Breadcrumbs, Icon } from '@octane-xplat/ui'

export function BreadcrumbsWithIcons() @{
	<Breadcrumbs>
		<BreadcrumbItem href="/" startIcon={<Icon name="sandbox-home" size={16} />}>Home</BreadcrumbItem>
		<BreadcrumbItem href="/settings" startIcon={<Icon name="sandbox-cog" size={16} />}>Settings</BreadcrumbItem>
		<BreadcrumbItem isCurrent>Profile</BreadcrumbItem>
	</Breadcrumbs>
}
