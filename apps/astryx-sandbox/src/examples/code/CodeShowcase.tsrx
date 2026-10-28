// Port of upstream Code/CodeShowcase.tsx (Astryx 0.6.4, MIT).
import { Code, Stack, Text } from '@octane-xplat/ui'

export function CodeShowcase() {
	return (
		<Stack direction="vertical" gap={3}>
			<Text type="body">
				Run <Code>npm install @astryxdesign/core</Code> to add the package.
			</Text>
			<Text type="body">
				Use the <Code>variant</Code> prop to switch between <Code>primary</Code>,{' '}
				<Code>secondary</Code>, and <Code>ghost</Code> styles.
			</Text>
		</Stack>
	)
}
