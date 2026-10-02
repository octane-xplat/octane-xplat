import { useState, useEffect, useRef } from 'octane';
import { View, HStack, Text, Pressable, ScrollableArea, useRoute, pushRoute, useColorScheme, BottomSheet } from '@octane-xplat/ui';
import { DOCS, routeForDoc, type DocPage } from './docs';
import { docPath, GROUPS, INDEX_SLUG, NOTES_INDEX_SLUG } from './doc-meta';
import { MdDoc } from './MdDoc.tsrx';
import { searchDocs, type SearchHit } from './search';
import { resetDocScroll } from './scroll';
import { animateConstellation } from './constellation';
import logoMark from './assets/logo-mark.svg';
import wordmark from './assets/wordmark.svg';
import constellation from './assets/constellation.svg?raw';
import orbitUser from './assets/orbit-user.webp';
import orbitSafari from './assets/orbit-safari.webp';
import orbitFirefox from './assets/orbit-firefox.webp';
import orbitChrome from './assets/orbit-chrome.webp';
import orbitLinux from './assets/orbit-linux.webp';
import orbitApple from './assets/orbit-apple.webp';
import orbitAndroid from './assets/orbit-android.webp';
import orbitMicrosoft from './assets/orbit-microsoft.webp';
import orbitMacos from './assets/orbit-macos.webp';

const ORBIT_BADGES = [
	orbitSafari,
	orbitFirefox,
	orbitChrome,
	orbitLinux,
	orbitApple,
	orbitAndroid,
	orbitMicrosoft,
	orbitMacos,
];

const HIT_GROUP: Partial<Record<SearchHit['kind'], string>> = {
	api: 'API',
	body: 'Content',
};

export function App() @{
	const [override, setOverride] = useState<boolean | null>(null);
	const [paletteOpen, setPaletteOpen] = useState(false);
	const [paletteMounted, setPaletteMounted] = useState(false);
	const [query, setQuery] = useState('');
	const [active, setActive] = useState(0);
	const [leaving, setLeaving] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const paletteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const menuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const scheme = useColorScheme();
	const dark = override ?? scheme === 'dark';
	const openPalette = () => {
		if (menuOpen) {
			closeMenu();
		}

		if (paletteTimer.current !== null) {
			clearTimeout(paletteTimer.current);
			paletteTimer.current = null;
		}

		setPaletteMounted(true);
		setPaletteOpen(true);
	};

	const closePalette = () => {
		setPaletteOpen(false);

		if (paletteTimer.current !== null) {
			clearTimeout(paletteTimer.current);
		}

		paletteTimer.current = setTimeout(() => {
			paletteTimer.current = null;
			setPaletteMounted(false);
		}, 180);
	};

	const openMenu = () => {
		if (menuTimer.current !== null) {
			clearTimeout(menuTimer.current);
			menuTimer.current = null;

			// Reopen during the slide-out: the panel is still mounted
			// holding the close transform — park it back at the detent.
			const panel = document.querySelector<HTMLElement>('.vx-sheet.docs-menu');
			const shade = document.querySelector<HTMLElement>('.vx-sheet-backdrop');
			if (panel) {
				panel.style.transition = 'transform 200ms ease-out';
				panel.style.transform = 'translateY(0px)';
			}
			if (shade) {
				shade.style.transition = 'opacity 200ms ease-out';
				shade.style.opacity = '0.4'; // BASE_SCRIM
			}
		}

		setMenuOpen(true);
	};

	const closeMenu = () => {
		if (menuTimer.current !== null) {
			return;
		}

		const panel = document.querySelector<HTMLElement>('.vx-sheet.docs-menu');
		if (!panel) {
			setMenuOpen(false);
			return;
		}

		// open=false unmounts instantly; the detent slide-out only runs on
		// drag/shade dismiss. Drive the drop here, then unmount.
		const shade = document.querySelector<HTMLElement>('.vx-sheet-backdrop');
		panel.style.transition = 'transform 200ms ease-in';
		panel.style.transform = 'translateY(102%)';
		if (shade) {
			shade.style.transition = 'opacity 200ms ease-in';
			shade.style.opacity = '0';
		}

		menuTimer.current = setTimeout(() => {
			menuTimer.current = null;
			setMenuOpen(false);
		}, 200);
	};

	const route = useRoute('notes') ?? useRoute('root');
	const slug = route ? route.name || (route.stack === 'notes' ? NOTES_INDEX_SLUG : INDEX_SLUG) : INDEX_SLUG;
	const doc = DOCS.find((d) => d.slug === slug) ?? DOCS[0];
	const nextDoc = DOCS.filter((d) => d.group === doc.group)[DOCS.filter((d) => d.group === doc.group).findIndex((d) => d.slug === doc.slug) + 1];
	const notesIndex = DOCS.find((d) => d.slug === NOTES_INDEX_SLUG);

	const open = (s: string, anchor?: string) => {
		if (menuOpen) {
			closeMenu();
		}

		const d = DOCS.find((x) => x.slug === s);
		// The index doc lives at '/', not /README.
		pushRoute(routeForDoc(d));
		history.replaceState(history.state, '', docPath(s, d?.group) + (anchor ? `#${anchor}` : ''));
		resetDocScroll();
	};

	const selectDoc = (s: string, anchor?: string) => {
		// Sheet slide-down runs alongside the doc fade, not after it.
		if (menuOpen) {
			closeMenu();
		}

		if (s === doc.slug) {
			open(s, anchor);
			return;
		}

		if (navigationTimer.current !== null) {
			clearTimeout(navigationTimer.current);
		}

		setLeaving(true);
		navigationTimer.current = setTimeout(() => {
			navigationTimer.current = null;
			open(s, anchor);
		}, 200);
	};

	// Safety net for navs that flow through octane's commit path.
	useEffect(() => {
		setLeaving(false);
		resetDocScroll();
		document.title = doc.title === 'Xplat' ? 'Xplat docs' : `${doc.title} — Xplat`;
	}, [doc.slug]);

	useEffect(() => () => {
		if (navigationTimer.current !== null) {
			clearTimeout(navigationTimer.current);
		}

		if (paletteTimer.current !== null) {
			clearTimeout(paletteTimer.current);
		}

		if (menuTimer.current !== null) {
			clearTimeout(menuTimer.current);
		}
	}, []);

	useEffect(() => {
		const host = document.querySelector<HTMLElement>('.constellation');
		const content = document.getElementById('doc-content');
		if (!host || !content) { return; }

		// Trusted local asset: inline it so each polygon can animate independently.
		host.innerHTML = constellation;
		return animateConstellation(host, content);
	}, []);

	// ⌘K/Ctrl+K toggles the palette (resets when already open); '/' opens it
	// from anywhere outside a text field; Esc closes.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				if (paletteOpen) {
					setQuery('');
					setActive(0);
					(document.getElementById('palette-input') as HTMLInputElement | null)?.focus();
				} else {
					openPalette();
				}

				return;
			}

			if (e.key === 'Escape' && paletteOpen) {
				closePalette();
				return;
			}

			if (e.key === '/' && !paletteOpen) {
				const t = e.target as HTMLElement | null;
				if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
					return;
				}

				e.preventDefault();
				openPalette();
			}
		};

		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [paletteOpen]);

	// Keep the keyboard-active row visible while arrowing through the list.
	useEffect(() => {
		document.querySelector('.hit.active')?.scrollIntoView({ block: 'nearest' });
	}, [active]);

	const hits: SearchHit[] = query.trim()
		? searchDocs(query)
		: DOCS.slice(0, 8).map((d) => ({
			kind: 'page' as const,
			slug: d.slug,
			label: d.title,
			context: d.group === 'notes' ? 'Note' : 'Guide',
			score: 0,
		}));

	const selectHit = (h: SearchHit) => {
		closePalette();
		setQuery('');
		setActive(0);
		selectDoc(h.slug, h.anchor);
	};

	const onPaletteKey = (e: KeyboardEvent) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setActive((a) => (hits.length ? (a + 1) % hits.length : 0));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setActive((a) => (hits.length ? (a - 1 + hits.length) % hits.length : 0));
		} else if (e.key === 'Enter') {
			const h = hits[Math.min(active, hits.length - 1)];
			if (h) selectHit(h);
		}
	};

	// Hit rows interleaved with group headers at each kind boundary.
	const rows = hits.flatMap((h, i) => {
		const group = HIT_GROUP[h.kind];
		const head = group && (i === 0 || hits[i - 1].kind !== h.kind)
			? [<Text key={`g-${h.kind}`} className="hit-group">{group}</Text>]
			: [];

		head.push(
			<div key={`${h.slug}:${h.label}`} className={i === active ? 'hit active' : 'hit'}
				onClick={() => selectHit(h)} onMouseEnter={() => setActive(i)}>
				<Text className={h.kind === 'api' ? 'hit-label mono' : 'hit-label'}>{h.label}</Text>
				{h.context && <Text className="hit-sub">{h.context}</Text>}
				{h.snippet && <Text className="hit-sub hit-snip">{h.snippet}</Text>}
			</div>,
		);

		return head;
	});

	const renderDoc = (d: DocPage) => (
		<Pressable key={d.slug} className={d.slug === doc.slug ? 'side-item active' : 'side-item'} onPress={() => selectDoc(d.slug)}>
			<Text className="side-text">{d.title}</Text>
		</Pressable>
	);

	// The sidebar and the mobile sheet render the same nav tree.
	const navTree = () => (
		<View className="nav-tree">
			<View className="side-header">
				<HStack className="brand-row">
					<View className="logo-cluster">
						<img className="logo-mark" src={logoMark} alt="" />
						<img className="wordmark" src={wordmark} alt="Octane Xplat" />
					</View>
					<Pressable className="mode-toggle" onPress={() => setOverride(!dark)} accessibilityLabel="Toggle dark mode">
						<View className="mode-icon" />
					</Pressable>
				</HStack>
				<View className="nav">
					<Pressable className="nav-row" onPress={openPalette}>
						<View className="nav-icon ic-search" />
						<Text className="nav-label">Search</Text>
						<Text className="nav-hint">{'⌘K'}</Text>
					</Pressable>
					<a
						className="nav-row"
						href="https://github.com/octane-xplat/octane-xplat"
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
				<View className="side-divider" />
			</View>
			<View className="side-scroll">
				{GROUPS.map((g) => (
					<View key={g.dir} className="side-sec">
						<Text className="sec-head">{g.label}</Text>
						{DOCS.filter((d) => d.group === 'guides' && d.section === g.dir).map(renderDoc)}
					</View>
				))}
				{notesIndex && <View className="side-sec">{renderDoc(notesIndex)}</View>}
			</View>
		</View>
	);

	<View className={['shell', dark ? 'dark' : 'light']}>
		<HStack className="mobile-header">
			<Pressable className="logo-cluster mh-brand" accessibilityLabel="Go to the introduction" onPress={() => open(DOCS[0].slug)}>
				<img className="logo-mark" src={logoMark} alt="" />
				<img className="wordmark" src={wordmark} alt="Octane Xplat" />
			</Pressable>
			<HStack className="mh-actions">
				<Pressable className="icon-btn" accessibilityLabel="Search docs" onPress={openPalette}>
					<View className="nav-icon ic-search" />
				</Pressable>
				<Pressable className="icon-btn" accessibilityLabel="Open menu" onPress={openMenu}>
					<View className="nav-icon ic-menu" />
				</Pressable>
			</HStack>
		</HStack>
		<HStack className="body">
			<View className="side">{navTree()}</View>
			<View className="card">
				<div className="constellation" aria-hidden="true" />
				<ScrollableArea id="doc-content" className="content">
					<View key={doc.slug} className={leaving ? 'doc-page leaving' : 'doc-page'}>
						{doc.slug === DOCS[0].slug && (
							<div className="orbit" aria-hidden="true">
								<div className="orbit-ring">
									{ORBIT_BADGES.map((src) => (
										<div key={src} className="orbit-pos"><div className="orbit-spin"><div className="orbit-tilt"><img className="orbit-badge" src={src} alt="" /></div></div></div>
									))}
								</div>
								<img className="orbit-user" src={orbitUser} alt="" />
							</div>
						)}
						<MdDoc md={doc.md} dir={doc.dir} showPageActions={doc.slug !== 'README'} agentPrompt={doc.slug === 'README'
							? 'Set up Octane Xplat for me. Fetch https://octane-xplat.goddardai.org/llms-full.txt and follow the “Create and run” guide.'
							: undefined} />
						{nextDoc && (
							<Pressable className="doc-next" onPress={() => selectDoc(nextDoc.slug)}>
								<View className="doc-next-copy">
									<Text className="doc-next-label">Next page</Text>
									<Text className="doc-next-title">{nextDoc.title}</Text>
								</View>
								<Text className="doc-next-arrow">→</Text>
							</Pressable>
						)}
					</View>
				</ScrollableArea>
			</View>
		</HStack>
		{/* Mobile nav sheet — portals to document.body, so it doesn't
		    inherit .dark from .shell; pass the scheme via className. */}
		<BottomSheet
			isOpen={menuOpen}
			label="Documentation menu"
			onOpenChange={(o) => { if (!o) setMenuOpen(false); }}
			snapPoints={[0.85]}
			className={dark ? 'docs-menu dark' : 'docs-menu'}
		>
			{navTree()}
		</BottomSheet>
		{paletteMounted && (
			<div
				className={paletteOpen ? 'palette-backdrop' : 'palette-backdrop closing'}
				aria-hidden={!paletteOpen}
				onClick={closePalette}
			>
				<div className="palette" role="dialog" aria-label="Search docs" onClick={(e: MouseEvent) => e.stopPropagation()}>
					<div className="palette-head">
						<View className="nav-icon ic-search" />
						<input
							id="palette-input"
							className="palette-input"
							placeholder="Search docs…"
							value={query}
							onInput={(e) => { setQuery((e.target as HTMLInputElement).value); setActive(0); }}
							onKeyDown={onPaletteKey}
							autoFocus
						/>
						<Text className="palette-esc">esc</Text>
					</div>
					{rows.length ? (
						<div className="palette-list">{rows}</div>
					) : (
						<Text className="hit-empty">No matches for “{query}”</Text>
					)}
				</div>
			</div>
		)}
	</View>
}
