// Port of upstream Breadcrumbs/BreadcrumbsDeepHierarchy.tsx (Astryx 0.6.4, MIT).
import { BreadcrumbItem, Breadcrumbs, Icon } from '@octane-xplat/ui'

export function BreadcrumbsDeepHierarchy() @{
	<Breadcrumbs>
		<BreadcrumbItem href="/" startIcon={<Icon name="sandbox-home" size={16} />}>Home</BreadcrumbItem>
		<BreadcrumbItem href="/products">Products</BreadcrumbItem>
		<BreadcrumbItem href="/products/electronics">Electronics</BreadcrumbItem>
		<BreadcrumbItem href="/products/electronics/phones">Phones</BreadcrumbItem>
		<BreadcrumbItem isCurrent>iPhone 15 Pro</BreadcrumbItem>
	</Breadcrumbs>
}
