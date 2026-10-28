// Port of upstream Layout/LayoutSidebarLayout.tsx (Astryx 0.6.4, MIT).
import {
	Button,
	Card,
	Heading,
	HStack,
	Layout,
	LayoutContent,
	LayoutFooter,
	LayoutHeader,
	LayoutPanel,
	List,
	ListItem,
	Text,
	VStack,
} from '@octane-xplat/ui'

export function LayoutSidebarLayout() @{
	<Card width="100%" style={{ maxWidth: 500 }}>
		<Layout
			header={
				<LayoutHeader hasDivider>
					<Heading level={4}>Settings</Heading>
				</LayoutHeader>
			}
			start={
				<LayoutPanel hasDivider role="navigation" width={150}>
					<List>
						<ListItem label="General" isSelected />
						<ListItem label="Account" />
						<ListItem label="Privacy" />
						<ListItem label="Notifications" />
						<ListItem label="Security" />
					</List>
				</LayoutPanel>
			}
			content={
				<LayoutContent>
					<VStack gap={3}>
						<Heading level={5}>General Settings</Heading>
						<Text type="body">
							Configure your general preferences here. The sidebar navigation allows you to switch
							between different settings sections.
						</Text>
					</VStack>
				</LayoutContent>
			}
			footer={
				<LayoutFooter hasDivider>
					<HStack gap={2} hAlign="end">
						<Button label="Reset" variant="secondary" />
						<Button label="Save Changes" variant="primary" />
					</HStack>
				</LayoutFooter>
			}
		/>
	</Card>
}
