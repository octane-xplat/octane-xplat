// Port of upstream LayoutHeader/LayoutHeaderShowcase.tsx (Astryx 0.6.4, MIT).
import {
	Button,
	Card,
	Center,
	Heading,
	HStack,
	Layout,
	LayoutContent,
	LayoutFooter,
	LayoutHeader,
	LayoutPanel,
} from '@octane-xplat/ui'

export function LayoutHeaderShowcase() @{
	<Center width={400}>
		<Layout
			style={{ width: '100%' }}
			height="fill"
			header={
				<LayoutHeader hasDivider>
					<HStack gap={2} vAlign="center" hAlign="between">
						<Heading level={4}>Dashboard</Heading>
						<HStack gap={2}>
							<Button label="Export" variant="secondary" />
							<Button label="New Item" variant="primary" />
						</HStack>
					</HStack>
				</LayoutHeader>
			}
			start={
				<LayoutPanel hasDivider width={140}>
					<Card variant="muted" />
				</LayoutPanel>
			}
			content={
				<LayoutContent>
					<Card variant="muted" />
				</LayoutContent>
			}
			footer={
				<LayoutFooter hasDivider>
					<Card variant="muted" />
				</LayoutFooter>
			}
		/>
	</Center>
}
