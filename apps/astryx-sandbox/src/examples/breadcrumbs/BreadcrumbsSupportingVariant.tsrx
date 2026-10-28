// Port of upstream Breadcrumbs/BreadcrumbsSupportingVariant.tsx (Astryx 0.6.4, MIT).
import { BreadcrumbItem, Breadcrumbs, Stack, Text } from '@octane-xplat/ui'

export function BreadcrumbsSupportingVariant() @{
	<Stack direction="vertical" gap={4}>
		<Stack direction="vertical" gap={1}>
			<Text type="supporting" color="secondary">
				Default
			</Text>
			<Breadcrumbs>
				<BreadcrumbItem href="/">Home</BreadcrumbItem>
				<BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
				<BreadcrumbItem isCurrent>My Project</BreadcrumbItem>
			</Breadcrumbs>
		</Stack>
		<Stack direction="vertical" gap={1}>
			<Text type="supporting" color="secondary">
				Supporting
			</Text>
			<Breadcrumbs variant="supporting">
				<BreadcrumbItem href="/">Home</BreadcrumbItem>
				<BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
				<BreadcrumbItem isCurrent>My Project</BreadcrumbItem>
			</Breadcrumbs>
		</Stack>
	</Stack>
}
