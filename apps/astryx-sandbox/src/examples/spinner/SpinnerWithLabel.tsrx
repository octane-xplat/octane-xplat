// Port of upstream Spinner/SpinnerWithLabel.tsx (Astryx 0.6.4, MIT).
import { HStack, Spinner, Text, VStack } from '@octane-xplat/ui'

export function SpinnerWithLabel() @{
	<HStack gap={8} vAlign="start">
		<Spinner size="lg" label="Loading..." />
		<Spinner
			size="lg"
			label={
				<VStack gap={0} hAlign="center">
					<Text type="body" weight="bold">
						Fetching data
					</Text>
					<Text type="supporting" color="secondary">
						This may take a moment
					</Text>
				</VStack>
			}
			accessibilityLabel="Fetching data"
		/>
	</HStack>
}
