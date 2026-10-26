// Port of upstream Card/CardWithInnerLayout.tsx (Astryx 0.6.4, MIT).
import { Button, Card, Heading, HStack, Layout, LayoutContent, LayoutFooter, LayoutHeader, Text } from '@octane-xplat/ui'

export function CardWithInnerLayout() @{
	<Card width={380}>
		<Layout
			header={<LayoutHeader hasDivider><Heading level={3}>Edit Profile</Heading></LayoutHeader>}
			content={<LayoutContent><Text type="body" color="secondary">Update your display name, bio, and profile photo. Changes are saved immediately.</Text></LayoutContent>}
			footer={<LayoutFooter hasDivider><HStack gap={2} hAlign="end"><Button label="Cancel" variant="ghost" /><Button label="Save changes" variant="primary" /></HStack></LayoutFooter>}
		/>
	</Card>
}
