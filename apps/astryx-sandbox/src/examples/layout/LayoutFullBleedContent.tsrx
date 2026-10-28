// Port of upstream Layout/LayoutFullBleedContent.tsx (Astryx 0.6.4, MIT).
import {
	Button,
	Card,
	Heading,
	HStack,
	Layout,
	LayoutContent,
	LayoutFooter,
	LayoutHeader,
	Section,
	Text,
} from '@octane-xplat/ui'

export function LayoutFullBleedContent() @{
	<Card width="100%" style={{ maxWidth: 400 }}>
		<Layout
			header={
				<LayoutHeader hasDivider>
					<Heading level={4}>Full Bleed Example</Heading>
				</LayoutHeader>
			}
			content={
				<LayoutContent padding={0}>
					<Section variant="muted">
						<Text type="body">
							Section automatically escapes the parent container padding to fill edge-to-edge.
							Useful for wash backgrounds, tables, or images that need to span the full width.
						</Text>
					</Section>
				</LayoutContent>
			}
			footer={
				<LayoutFooter hasDivider>
					<HStack gap={2} hAlign="end">
						<Button label="Close" variant="secondary" />
					</HStack>
				</LayoutFooter>
			}
		/>
	</Card>
}
