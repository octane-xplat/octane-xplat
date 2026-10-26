// Port of upstream BreadcrumbItem/BreadcrumbItemBasic.tsx (Astryx 0.6.4, MIT).
import { BreadcrumbItem, Breadcrumbs } from '@octane-xplat/ui'

export function BreadcrumbItemBasic() @{
	<Breadcrumbs>
		<BreadcrumbItem href="/">Home</BreadcrumbItem>
		<BreadcrumbItem href="/settings">Settings</BreadcrumbItem>
		<BreadcrumbItem isCurrent>Profile</BreadcrumbItem>
	</Breadcrumbs>
}
