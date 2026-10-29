import { useState, useEffect, useRef } from 'octane'
import {
	View,
	Image,
	Icon,
	Link,
	Theme,
	IconRegistryProvider,
	useMediaQuery,
	setThemePreference,
	HStack,
	Text,
	Pressable,
	ScrollableArea,
	RouteOutlet,
	useColorScheme,
	BottomSheet,
	CommandPalette,
	type CommandPaletteItem,
	type SearchSource,
} from '@octane-xplat/ui'

import { useRouterState, router } from '@octane-xplat/ui/routing'
import { DOCS, routeForDoc, type DocPage } from './docs'
import { docPath, GROUPS } from './doc-meta'
import { DocNavigationProvider } from './DocPage.tsrx'
import { searchDocs, type SearchHit } from './search'
import { resetDocScroll } from './scroll'
import { readThemePreference, saveThemePreference } from './docs-preferences'
import { useConstellation, useDocsKeyboard, restoreMenu, animateMenuDismiss } from './docs-host'

import logoMark from './assets/logo-mark.svg'
import wordmark from './assets/wordmark.svg'
import { docsIcons } from './icons'
import { docsTheme, compactDocsTheme } from './docs-theme'

const HIT_GROUP: Partial<Record<SearchHit['kind'], string>> = {
	api: 'API',
	body: 'Content',
}

/** The palette reports row ids back through onValueChange; the Map resolves
 *  them to the hit that produced the row. Cleared and repopulated on every
 *  source call. */
const paletteHits = new Map<string, SearchHit>()

const paletteItem = (hit: SearchHit, index: number): CommandPaletteItem => {
	const id = `${hit.kind}-${hit.slug}-${hit.anchor ?? 'doc'}-${index}`
	paletteHits.set(id, hit)
	return {
		id,
		label: hit.label,
		description: hit.snippet,
		auxiliaryData: { group: HIT_GROUP[hit.kind] ?? 'Guide', hit },
	}
}

const DOC_SEARCH: SearchSource<CommandPaletteItem> = {
	bootstrap() {
		paletteHits.clear()
		return DOCS.slice(0, 8).map((d, index) =>
			paletteItem(
				{ kind: 'page', slug: d.slug, label: d.title, context: 'Guide', score: 0 },
				index,
			),
		)
	},
	search(query) {
		paletteHits.clear()
		return searchDocs(query).map(paletteItem)
	},
}

export function App() @{
	const [override, setOverride] = useState<boolean | null>(readThemePreference)
	const [paletteOpen, setPaletteOpen] = useState(false)
	const [leaving, setLeaving] = useState(false)
	const [menuOpen, setMenuOpen] = useState(false)
	const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const menuTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const scheme = useColorScheme()
	const dark = override ?? scheme === 'dark'
	const compact = useMediaQuery('(max-width: 1100px)')
	useEffect(() => {
		setThemePreference(override === null ? 'system' : override ? 'dark' : 'light')
	}, [override])

	const openPalette = () => {
		if (menuOpen) {
			closeMenu()
		}

		setPaletteOpen(true)
	}

	const openMenu = () => {
		if (menuTimer.current !== null) {
			clearTimeout(menuTimer.current)
			menuTimer.current = null

			restoreMenu()
		}

		setMenuOpen(true)
	}

	const closeMenu = () => {
		if (menuTimer.current !== null) {
			return
		}

		if (!animateMenuDismiss()) {
			setMenuOpen(false)
			return
		}

		menuTimer.current = setTimeout(() => {
			menuTimer.current = null
			setMenuOpen(false)
		}, 200)
	}

	const route = useRouterState().route
	const doc = route?.contract === 'declared' && route.to === '/:slug?' ? route.data : DOCS[0]

	const open = (s: string, anchor?: string) => {
		if (menuOpen) {
			closeMenu()
		}

		const d = DOCS.find((x) => x.slug === s)
		// The index doc lives at '/', not /README.
		void router.push({ ...routeForDoc(d), hash: anchor }).then((result) => {
			if (result.status === 'committed') {
				resetDocScroll()
			}
		})
	}

	const selectDoc = (s: string, anchor?: string) => {
		// Sheet slide-down runs alongside the doc fade, not after it.
		if (menuOpen) {
			closeMenu()
		}

		if (s === doc.slug) {
			open(s, anchor)
			return
		}

		if (navigationTimer.current !== null) {
			clearTimeout(navigationTimer.current)
		}

		setLeaving(true)
		navigationTimer.current = setTimeout(() => {
			navigationTimer.current = null
			open(s, anchor)
		}, 200)
	}

	// Includes same-page section links activated through NavLink.
	useEffect(() => {
		setLeaving(false)
		resetDocScroll()
	}, [route?.href])

	useEffect(
		() => () => {
			if (navigationTimer.current !== null) {
				clearTimeout(navigationTimer.current)
			}

			if (menuTimer.current !== null) {
				clearTimeout(menuTimer.current)
			}
		},
		[],
	)

	useConstellation()
	useDocsKeyboard({ isOpen: paletteOpen, open: openPalette })

	const renderDoc = (d: DocPage) => (
		<Pressable
			key={d.slug}
			className={d.slug === doc.slug ? 'side-item active' : 'side-item'}
			onPress={() => selectDoc(d.slug)}
		>
			<Text className="side-text">{d.title}</Text>
		</Pressable>
	)

	// The sidebar and the mobile sheet render the same nav tree.
	const navTree = () => (
		<View className="nav-tree">
			<View className="side-header">
				<HStack className="brand-row">
					<View className="logo-cluster">
						<Image className="logo-mark" src={logoMark} alt="" />
						<Image className="wordmark" src={wordmark} alt="Octane Xplat" />
					</View>
					<Pressable
						className="mode-toggle"
						onPress={() => {
							const next = !dark
							saveThemePreference(next)
							setOverride(next)
						}}
						accessibilityLabel="Toggle dark mode"
					>
						<View className="mode-icon" />
					</Pressable>
				</HStack>
				<View className="nav">
					<Pressable className="nav-row" onPress={openPalette}>
						<View className="nav-icon ic-search" />
						<Text className="nav-label">Search</Text>
						<Text className="nav-hint">{'⌘K'}</Text>
					</Pressable>
					<Link
						className="nav-row"
						href="https://github.com/octane-xplat/octane-xplat"
						target="_blank"
					>
						<View className="nav-icon ic-github" />
						<Text className="nav-label">Github</Text>
					</Link>
					<Pressable className="nav-row" onPress={() => open(DOCS[0].slug)}>
						<View className="nav-icon ic-start" />
						<Text className="nav-label">Get Started</Text>
					</Pressable>
					<Link className="nav-row" href="/llms.txt" target="_blank">
						<View className="nav-icon ic-doc" />
						<Text className="nav-label">llms.txt</Text>
					</Link>
				</View>
				<View className="side-divider" />
			</View>
			<View className="side-scroll">
				{GROUPS.map((g) => (
					<View key={g.dir} className="side-sec">
						<Text className="sec-head">{g.label}</Text>
						{DOCS.filter((d) => d.section === g.dir).map(renderDoc)}
					</View>
				))}
			</View>
		</View>
	)

	<Theme theme={compact ? compactDocsTheme : docsTheme} mode={dark ? 'dark' : 'light'}>
		<IconRegistryProvider value={docsIcons}>
			<View className={['shell', dark ? 'dark' : 'light']}>
				<HStack className="mobile-header">
					<Pressable
						className="logo-cluster mh-brand"
						accessibilityLabel="Go to the introduction"
						onPress={() => open(DOCS[0].slug)}
					>
						<Image className="logo-mark" src={logoMark} alt="" />
						<Image className="wordmark" src={wordmark} alt="Octane Xplat" />
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
						<Icon name="docs-constellation" registry={docsIcons} className="constellation" />
						<ScrollableArea id="doc-content" className="content">
							<DocNavigationProvider value={{ leaving, selectDoc }}>
								<RouteOutlet />
							</DocNavigationProvider>
						</ScrollableArea>
					</View>
				</HStack>
				{/* Mobile nav sheet — portals to document.body, so it doesn't
		    inherit .dark from .shell; pass the scheme via className. */}
				<BottomSheet
					isOpen={menuOpen}
					label="Documentation menu"
					onOpenChange={(o) => {
						if (!o) {
							setMenuOpen(false)
						}
					}}
					snapPoints={[0.85]}
					className={dark ? 'docs-menu dark' : 'docs-menu'}
				>
					{navTree()}
				</BottomSheet>
				{/* Search palette — the layer portals to document.body, so it doesn't
		    inherit .dark from .shell; pass the scheme via className. */}
				<CommandPalette
					id="palette"
					className={dark ? 'palette dark' : 'palette'}
					open={paletteOpen}
					onOpenChange={(open) => {
						if (!open) {
							setPaletteOpen(false)
						}
					}}
					searchSource={DOC_SEARCH}
					onValueChange={(id) => {
						const hit = paletteHits.get(id)
						if (hit) {
							selectDoc(hit.slug, hit.anchor)
						}
					}}
					label="Search docs"
					placeholder="Search docs…"
					emptySearchText="No matches"
					maxHeight={520}
					renderItem={(item) => {
						const hit = (item.auxiliaryData as { hit?: SearchHit } | undefined)?.hit
						return (
							<>
								<Text className={hit?.kind === 'api' ? 'hit-label mono' : 'hit-label'}>
									{item.label}
								</Text>
								{hit?.context ? <Text className="hit-sub">{hit.context}</Text> : null}
								{hit?.snippet ? <Text className="hit-sub hit-snip">{hit.snippet}</Text> : null}
							</>
						)
					}}
				/>
			</View>
		</IconRegistryProvider>
	</Theme>
}
