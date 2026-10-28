// Port of upstream Layout/LayoutShowcase.tsx (Astryx 0.6.4, MIT).
import {
	Badge,
	Button,
	Heading,
	HStack,
	Layout,
	LayoutContent,
	LayoutFooter,
	LayoutHeader,
	LayoutPanel,
	List,
	ListItem,
	Section,
	Text,
	VStack,
} from '@octane-xplat/ui'

export function LayoutShowcase() @{
	<Section padding={4}>
		<Layout
			height="fill"
			header={
				<LayoutHeader hasDivider>
					<HStack gap={2} vAlign="center">
						<Heading level={4}>Projects</Heading>
						<Badge variant="info" label="3 active" />
					</HStack>
				</LayoutHeader>
			}
			start={
				<LayoutPanel hasDivider width={140}>
					<List>
						<ListItem label="Dashboard" isSelected />
						<ListItem label="Analytics" />
						<ListItem label="Settings" />
					</List>
				</LayoutPanel>
			}
			content={
				<LayoutContent>
					<VStack gap={2}>
						<Heading level={5}>Welcome back</Heading>
						<Text type="body" color="secondary">
							You have 3 active projects and 2 pending reviews.
						</Text>
					</VStack>
				</LayoutContent>
			}
			footer={
				<LayoutFooter hasDivider>
					<HStack gap={2} hAlign="end">
						<Button label="New Project" variant="primary" />
					</HStack>
				</LayoutFooter>
			}
		/>
	</Section>
}
