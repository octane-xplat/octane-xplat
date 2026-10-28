// Port of upstream Code/CodeInlineInParagraph.tsx (Astryx 0.6.4, MIT).
import { Code, Text } from '@octane-xplat/ui'

export function CodeInlineInParagraph() {
	return (
		<Text type="body" style={{ maxWidth: 400 }}>
			Use <Code>useState</Code> for local state and <Code>useEffect</Code> for
			side effects. If you need shared state across components, consider{' '}
			<Code>useContext</Code> or a state management library.
		</Text>
	)
}
