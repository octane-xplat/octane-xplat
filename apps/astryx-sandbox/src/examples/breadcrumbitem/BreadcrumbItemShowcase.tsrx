// Port of upstream BreadcrumbItem/BreadcrumbItemShowcase.tsx (Astryx 0.6.4, MIT).
import { BreadcrumbItem, Breadcrumbs, Icon, Text, VStack } from '@octane-xplat/ui'

export function BreadcrumbItemShowcase() @{
	<VStack gap={4}>
		<VStack gap={1}>
			<Text type="supporting" color="secondary">With start icon</Text>
			<Breadcrumbs>
				<BreadcrumbItem href="/" startIcon={<Icon name="sandbox-home" size={16} />}>Home</BreadcrumbItem>
				<BreadcrumbItem href="/docs">Docs</BreadcrumbItem>
				<BreadcrumbItem isCurrent>Components</BreadcrumbItem>
			</Breadcrumbs>
		</VStack>
		<VStack gap={1}>
			<Text type="supporting" color="secondary">As current page (non-link)</Text>
			<Breadcrumbs>
				<BreadcrumbItem href="/">Home</BreadcrumbItem>
				<BreadcrumbItem href="/settings">Settings</BreadcrumbItem>
				<BreadcrumbItem isCurrent>Profile</BreadcrumbItem>
			</Breadcrumbs>
		</VStack>
		<VStack gap={1}>
			<Text type="supporting" color="secondary">Supporting variant</Text>
			<Breadcrumbs variant="supporting">
				<BreadcrumbItem href="/">Home</BreadcrumbItem>
				<BreadcrumbItem href="/admin">Admin</BreadcrumbItem>
				<BreadcrumbItem href="/admin/users">Users</BreadcrumbItem>
				<BreadcrumbItem isCurrent>Permissions</BreadcrumbItem>
			</Breadcrumbs>
		</VStack>
		<VStack gap={1}>
			<Text type="supporting" color="secondary">With onClick handler (no href)</Text>
			<Breadcrumbs>
				<BreadcrumbItem onPress={() => {}}>Dashboard</BreadcrumbItem>
				<BreadcrumbItem onPress={() => {}}>Projects</BreadcrumbItem>
				<BreadcrumbItem isCurrent>Project Alpha</BreadcrumbItem>
			</Breadcrumbs>
		</VStack>
	</VStack>
}
