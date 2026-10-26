// Port of upstream Card/ClickableCardWithNestedButton.tsx (Astryx 0.6.4, MIT).
import { Button, ClickableCard, Heading, Stack, Text } from '@octane-xplat/ui'

export function ClickableCardWithNestedButton() @{
	<ClickableCard label="Product" href="#" width={320}>
		<Stack direction="vertical" gap={3}>
			<Stack direction="vertical" gap={1}>
				<Heading level={4}>Wireless Headphones</Heading>
				<Text type="body" color="secondary">$79.99</Text>
			</Stack>
			<Button label="Add to cart" clickAction={() => {}} variant="primary" />
		</Stack>
	</ClickableCard>
}
