// Port of upstream Layout/LayoutBasicCardLayout.tsx (Astryx 0.6.4, MIT).
import {
	Button,
	Card,
	Heading,
	HStack,
	Layout,
	LayoutContent,
	LayoutFooter,
	LayoutHeader,
	Text,
	VStack,
} from '@octane-xplat/ui'

export function LayoutBasicCardLayout() @{
	<Card height={300} width="100%" style={{ maxWidth: 400 }}>
		<Layout
			header={
				<LayoutHeader hasDivider>
					<Heading level={4}>Card Title</Heading>
				</LayoutHeader>
			}
			content={
				<LayoutContent>
					<VStack gap={3}>
						<Text type="body">
							This is a basic card layout with a header, scrollable content area, and footer. The
							layout automatically handles padding and spacing between sections.
						</Text>
						<Text type="body">
							When content exceeds the available height, the content area scrolls independently
							while the header and footer stay fixed in place.
						</Text>
						<Text type="body">
							This pattern works well for modal dialogs, detail panels, and any card where the
							amount of content is unpredictable.
						</Text>
						<Text type="body">
							The dividers between header, content, and footer provide clear visual boundaries
							between the fixed and scrollable regions.
						</Text>
					</VStack>
				</LayoutContent>
			}
			footer={
				<LayoutFooter hasDivider>
					<HStack gap={2} hAlign="end">
						<Button label="Cancel" variant="secondary" />
						<Button label="Save" variant="primary" />
					</HStack>
				</LayoutFooter>
			}
		/>
	</Card>
}
