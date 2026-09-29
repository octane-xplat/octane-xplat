import { useState, useEffect } from 'octane';
import { View, Row, Text, Pressable, ScrollView, useRoute, pushRoute, useColorScheme } from '@octane-xplat/ui';
import { DOCS, type DocPage } from './docs';
import { MdDoc } from './MdDoc.tsrx';
import { resetDocScroll } from './scroll';
import logoMark from './assets/logo-mark.svg';
import wordmark from './assets/wordmark.svg';
import constellation from './assets/constellation.svg';

const GROUPS: { key: DocPage['group']; label: string }[] = [
	{ key: 'guides', label: 'Guides' },
	{ key: 'notes', label: 'Notes' },
];

export function App() @{
	const [override, setOverride] = useState<boolean | null>(null);
	const [searchOpen, setSearchOpen] = useState(false);
	const [query, setQuery] = useState('');
	const scheme = useColorScheme();
	const dark = override ?? scheme === 'dark';

	const route = useRoute('notes') ?? useRoute('root');
	const slug = route?.name ?? DOCS[0].slug;
	const doc = DOCS.find((d) => d.slug === slug) ?? DOCS[0];

	const open = (s: string) => {
		const d = DOCS.find((x) => x.slug === s);
		// The index doc lives at '/', not /README.
		pushRoute({ stack: d?.group === 'notes' ? 'notes' : 'root', name: s === DOCS[0].slug ? '' : s, params: {} });
		resetDocScroll();
	};

	// Safety net for navs that flow through octane's commit path.
	useEffect(() => {
		resetDocScroll();
		document.title = doc.title === 'xplat' ? 'xplat docs' : `${doc.title} — xplat`;
	}, [doc.slug]);

	const q = query.trim().toLowerCase();
	const results = q ? DOCS.filter((d) => d.title.toLowerCase().includes(q) || d.md.toLowerCase().includes(q)) : null;

	const renderDoc = (d: DocPage) => (
		<Pressable className={d.slug === doc.slug ? 'side-item active' : 'side-item'} onPress={() => { open(d.slug); setQuery(''); }}>
			<Text className="side-text">{d.title}</Text>
		</Pressable>
	);

	<View className={['shell', dark ? 'dark' : 'light']}>
		<Row className="body">
			<View className="side">
				<Row className="brand-row">
					<View className="logo-cluster">
						<img className="logo-mark" src={logoMark} alt="" />
						<img className="wordmark" src={wordmark} alt="Octane Xplat" />
					</View>
					<Pressable className="mode-toggle" onPress={() => setOverride(!dark)}>
						<View className="mode-icon" />
					</Pressable>
				</Row>
				<View className="nav">
					<Pressable className={searchOpen ? 'nav-row active' : 'nav-row'} onPress={() => setSearchOpen(!searchOpen)}>
						<View className="nav-icon ic-search" />
						<Text className="nav-label">Search</Text>
					</Pressable>
					{searchOpen && (
						<input
							className="search-input"
							placeholder="Filter docs…"
							value={query}
							onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
							autoFocus
						/>
					)}
					<a
						className="nav-row"
						href="https://github.com/aleclarson/octane-xplat"
						target="_blank"
						rel="noopener"
					>
						<View className="nav-icon ic-github" />
						<Text className="nav-label">Github</Text>
					</a>
					<Pressable className="nav-row" onPress={() => open(DOCS[0].slug)}>
						<View className="nav-icon ic-start" />
						<Text className="nav-label">Get Started</Text>
					</Pressable>
					<a className="nav-row" href="/llms.txt" target="_blank" rel="noopener">
						<View className="nav-icon ic-doc" />
						<Text className="nav-label">llms.txt</Text>
					</a>
				</View>
				{results ? (
					<View className="side-sec">
						{results.length ? results.map(renderDoc) : <Text className="side-empty">no matches</Text>}
					</View>
				) : (
					GROUPS.map((g) => (
						<View className="side-sec">
							<Text className="sec-head">{g.label}</Text>
							{DOCS.filter((d) => d.group === g.key).map(renderDoc)}
						</View>
					))
				)}
			</View>
			<View className="card">
				<img className="constellation" src={constellation} alt="" />
				<ScrollView id="doc-content" className="content">
					<MdDoc key={doc.slug} md={doc.md} />
				</ScrollView>
			</View>
		</Row>
	</View>
}
