import { useState, useEffect } from 'octane';
import { View, Row, Text, Pressable, List, ScrollView, useRoute, pushRoute, useColorScheme } from '@octane-xplat/ui';
import { DOCS, type DocPage } from './docs';
import { MdDoc } from './MdDoc.tsrx';
import { resetDocScroll } from './scroll';

export function App() @{
	const [override, setOverride] = useState<boolean | null>(null);
	const scheme = useColorScheme();
	const dark = override ?? scheme === 'dark';

	const route = useRoute('root');
	const slug = (route?.params?.page as string) || DOCS[0].slug;
	const doc = DOCS.find((d) => d.slug === slug) ?? DOCS[0];

	const open = (s: string) => { pushRoute({ stack: 'root', name: 'doc', params: { page: s } }); resetDocScroll(); };
	// Safety net for navs that flow through octane's commit path.
	useEffect(() => { resetDocScroll(); }, [doc.slug]);
	const renderDoc = (d: DocPage) => (
		<Pressable className={d.slug === doc.slug ? 'side-item active' : 'side-item'} onPress={() => open(d.slug)}>
			<Text className="side-text">{d.title.toLowerCase()}</Text>
		</Pressable>
	);

	// De Stijl shell: orthogonal grid, black rules, primary blocks.
	<View className={['shell', dark ? 'dark' : 'light']}>
		<Row className="topbar">
			<View className="brand-block">
				<View className="logo-tile"><View className="logo-flame" /></View>
				<Text className="brand">xplat</Text>
			</View>
			<View className="topbar-mid">
				<Text className="tagline">one codebase — web · ios · android</Text>
				<View className="disc-chip"><Text className="disc-text">not affiliated with octane</Text></View>
			</View>
			<Pressable className="mode-block" onPress={() => setOverride(!dark)}>
				<Text className="mode-text">{dark ? 'light' : 'dark'}</Text>
			</Pressable>
		</Row>
		<Row className="body">
			<View className="side">
				<List items={DOCS} renderItem={renderDoc} />
			</View>
			<ScrollView id="doc-content" className="content">
				<MdDoc md={doc.md} />
			</ScrollView>
		</Row>
	</View>
}
