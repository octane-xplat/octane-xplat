// Port of upstream LayoutHeader/LayoutHeaderWithActions.tsx (Astryx 0.6.4, MIT).
import { Button, Card, Center, Heading, HStack, Layout, LayoutContent, LayoutHeader } from '@octane-xplat/ui'

export function LayoutHeaderWithActions() @{
	<Center width={400}>
		<Layout
			style={{ width: '100%' }}
			height="fill"
			header={
				<LayoutHeader hasDivider>
					<HStack gap={2} vAlign="center" hAlign="between">
						<Heading level={4}>Inbox</Heading>
						<Button label="Compose" variant="primary" size="sm" />
					</HStack>
				</LayoutHeader>
			}
			content={<LayoutContent><Card variant="muted" /></LayoutContent>}
		/>
	</Center>
}
