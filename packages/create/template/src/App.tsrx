import { useState } from 'octane';
import { View, Row, Text, Pressable, List, useColorScheme } from '@octane-xplat/ui';

const FEATURES = [
	'shared components',
	'platform leaves (.web / .native)',
	'design tokens + dark mode',
	'native navigation',
];

/** Every element here compiles for web AND for NativeScript iOS/Android —
 *  the same file, no branches. Platform divergence lives in leaf files
 *  (.web.tsrx / .native.tsrx), never inside a component. */
export function App() @{
	const [count, setCount] = useState(0);
	// null = follow the system; the toggle overrides it for this session.
	const [override, setOverride] = useState<boolean | null>(null);
	const scheme = useColorScheme();
	const dark = override ?? scheme === 'dark';

	<View className={['app', dark ? 'dark' : 'light']}>
		<Text className="title">octane-xplat</Text>
		<Text className="muted">one codebase — web · iOS · android</Text>

		<Row className="counter">
			<Pressable className="btn" onPress={() => setCount(count - 1)}><Text>−</Text></Pressable>
			<Text className="count">{count}</Text>
			<Pressable className="btn" onPress={() => setCount(count + 1)}><Text>+</Text></Pressable>
		</Row>

		<List items={FEATURES} renderItem={(f) => <Text className="chip">{f}</Text>} />

		<Pressable className="link" onPress={() => setOverride(!dark)}>
			<Text>{dark ? 'light' : 'dark'} mode (system: {scheme})</Text>
		</Pressable>
	</View>
}
