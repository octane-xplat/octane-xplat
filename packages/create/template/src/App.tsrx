import { useState } from 'octane';
import { View, Row, Text, Pressable, ScrollView, useColorScheme } from '@octane-xplat/ui';
import { storage } from '@octane-xplat/platform';

const FEATURES = [
	'shared components',
	'platform leaves (.web / .mobile)',
	'design tokens + dark mode',
	'native navigation',
];

/** Every element here compiles for web AND for NativeScript iOS/Android —
 *  the same file, no branches. Platform divergence lives in leaf files
 *  (.web.tsrx / .mobile.tsrx), never inside a component. */
export function App() @{
	const [count, setCount] = useState(0);
	// null = follow the system until the user chooses a mode.
	const [override, setOverride] = useState<boolean | null>(() => {
		const saved = storage.getString('theme-preference');
		return saved === 'light' ? false : saved === 'dark' ? true : null;
	});

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

		<ScrollView>
			{FEATURES.map((f) => <Text className="chip">{f}</Text>)}
		</ScrollView>

		<Pressable className="link" onPress={() => {
			const next = !dark;
			storage.setString('theme-preference', next ? 'dark' : 'light');
			setOverride(next);
		}}>
			<Text>{dark ? 'light' : 'dark'} mode (system: {scheme})</Text>
		</Pressable>
	</View>
}
