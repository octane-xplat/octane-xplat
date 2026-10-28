// Port of upstream LayoutContent/LayoutContentShowcase.tsx (Astryx 0.6.4, MIT).
import {
	Card,
	Center,
	Heading,
	Layout,
	LayoutContent,
	LayoutFooter,
	LayoutHeader,
	LayoutPanel,
	Text,
	VStack,
} from '@octane-xplat/ui'

export function LayoutContentShowcase() @{
	<Center width={500}>
		<Layout
			style={{ width: '100%' }}
			height="fill"
			header={
				<LayoutHeader hasDivider>
					<Card variant="muted" />
				</LayoutHeader>
			}
			start={
				<LayoutPanel hasDivider width={140}>
					<Card variant="muted" />
				</LayoutPanel>
			}
			content={
				<LayoutContent role="main">
					<VStack gap={3}>
						<Heading level={5}>Main Content Area</Heading>
						<Text type="body" color="secondary">
							LayoutContent provides automatic padding and scroll containment. It fills the
							remaining space between the header and footer.
						</Text>
						<Text type="body" color="secondary">
							Content that overflows will scroll within this area while the header and footer remain
							fixed.
						</Text>
					</VStack>
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
