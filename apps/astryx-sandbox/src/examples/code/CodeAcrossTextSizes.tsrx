// Port of upstream Code/CodeAcrossTextSizes.tsx (Astryx 0.6.4, MIT).
import { Code, Heading, Text, VStack } from '@octane-xplat/ui'

export function CodeAcrossTextSizes() {
	return (
		<VStack gap={3}>
			<Heading level={3}>
				Heading with <Code>inline code</Code>
			</Heading>
			<Text type="body">
				Body text with <Code>inline code</Code>
			</Text>
			<Text type="supporting">
				Supporting text with <Code>inline code</Code>
			</Text>
			<Text type="label">
				Label text with <Code>inline code</Code>
			</Text>
		</VStack>
	)
}
