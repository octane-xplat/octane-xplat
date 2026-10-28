// Port of upstream Code/CodeVariousContent.tsx (Astryx 0.6.4, MIT).
import { Code, Text, VStack } from '@octane-xplat/ui'

export function CodeVariousContent() {
	return (
		<VStack gap={3}>
			<Text type="body">
				Variable: <Code>const count = 0</Code>
			</Text>
			<Text type="body">
				Terminal: <Code>yarn build --watch</Code>
			</Text>
			<Text type="body">
				CSS property: <Code>border-radius: 8px</Code>
			</Text>
			<Text type="body">
				File path: <Code>packages/core/src/CodeBlock/Code.tsx</Code>
			</Text>
			<Text type="body">
				Keyboard shortcut: <Code>Ctrl+Shift+P</Code>
			</Text>
		</VStack>
	)
}
