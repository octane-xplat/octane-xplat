// Port of upstream Layout/LayoutContentWidth.tsx (Astryx 0.6.4, MIT).
import { Button, Heading, HStack, Layout, LayoutContent, LayoutFooter, LayoutHeader, Text, VStack } from '@octane-xplat/ui'

export function LayoutContentWidth() @{
	<Layout
		height="fill"
		contentWidth={360}
		header={<LayoutHeader hasDivider><Heading level={4}>Centered Form</Heading></LayoutHeader>}
		content={
			<LayoutContent>
				<VStack gap={3}>
					<Text type="body">The contentWidth prop constrains content to a maximum width and centers it within the layout. Dividers remain full-bleed while content stays narrow and readable.</Text>
					<Text type="body" color="secondary">Common widths: 640 for forms, 960 for content pages.</Text>
				</VStack>
			</LayoutContent>
		}
		footer={<LayoutFooter hasDivider><HStack gap={2} hAlign="end"><Button label="Cancel" variant="secondary" /><Button label="Submit" variant="primary" /></HStack></LayoutFooter>}
	/>
}
