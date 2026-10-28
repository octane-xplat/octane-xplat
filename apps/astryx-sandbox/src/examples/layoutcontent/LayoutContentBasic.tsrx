// Port of upstream LayoutContent/LayoutContentBasic.tsx (Astryx 0.6.4, MIT).
import {
	Card,
	Center,
	Heading,
	Layout,
	LayoutContent,
	LayoutHeader,
	Text,
	VStack,
} from '@octane-xplat/ui'

export function LayoutContentBasic() @{
	<Center width={400}>
		<Layout
			style={{ width: '100%' }}
			height="fill"
			header={
				<LayoutHeader hasDivider>
					<Card variant="muted" />
				</LayoutHeader>
			}
			content={
				<LayoutContent role="main">
					<VStack gap={3}>
						<Heading level={5}>Main Content</Heading>
						<Text type="body" color="secondary">
							LayoutContent fills the remaining space and scrolls when its content overflows, while
							the header stays fixed.
						</Text>
					</VStack>
				</LayoutContent>
			}
		/>
	</Center>
}
