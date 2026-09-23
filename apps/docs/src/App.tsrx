import { useState } from 'octane';
import { View, Row, Text, Pressable, List, ScrollView, useRoute, pushRoute, useColorScheme } from '@octane-xplat/ui';
import { DOCS } from './docs';
import { MdDoc } from './MdDoc.tsrx';

export function App() @{
	const [override, setOverride] = useState<boolean | null>(null);
	const scheme = useColorScheme();
	const dark = override ?? scheme === 'dark';

	const route = useRoute('root');
	const slug = (route?.params?.page as string) || DOCS[0].slug;
	const doc = DOCS.find((d) => d.slug === slug) ?? DOCS[0];

	const open = (s: string) => pushRoute({ stack: 'root', name: 'doc', params: { page: s } });

	// De Stijl shell: orthogonal grid, black rules, primary blocks.
	<View className={['shell', dark ? 'dark' : 'light']}>
		<Row className="topbar">
			<View className="brand-block"><Text className="brand">octane-xplat</Text></View>
			<View className="topbar-mid"><Text className="tagline">one codebase — web · ios · android</Text></View>
			<Pressable className="mode-block" onPress={() => setOverride(!dark)}>
				<Text className="mode-text">{dark ? 'light' : 'dark'}</Text>
			</Pressable>
		</Row>
		<Row className="body">
			<View className="side">
				<List
					items={DOCS}
					renderItem={(d) => (
						<Pressable className={d.slug === doc.slug ? 'side-item active' : 'side-item'} onPress={() => open(d.slug)}>
							<Text className="side-text">{d.title.toLowerCase()}</Text>
						</Pressable>
					)}
				/>
			</View>
			<ScrollView className="content">
				<MdDoc md={doc.md} />
			</ScrollView>
		</Row>
	</View>
}
