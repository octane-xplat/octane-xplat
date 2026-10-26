// Port of upstream Breadcrumbs/BreadcrumbsShowcase.tsx (Astryx 0.6.4, MIT).
import { BreadcrumbItem, Breadcrumbs } from '@octane-xplat/ui'

export function BreadcrumbsShowcase() @{
	<Breadcrumbs>
		<BreadcrumbItem href="/">Home</BreadcrumbItem>
		<BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
		<BreadcrumbItem isCurrent>My Project</BreadcrumbItem>
	</Breadcrumbs>
}
