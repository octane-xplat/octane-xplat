// Port of upstream (fullscreen)/PreviewShell.tsx — preview chrome for
// template routes and fullscreen authored pages: sidebar tree over all 714
// template destinations, command-palette navigation, preview/code views,
// viewport widths, theme/mode controls, and copyable source. Block examples
// render inline; page templates and fullscreen pages render inside an
// ?embed=1 iframe (upstream used a static embed.html sibling — this SPA
// routes the same URL with embed=1 instead; recorded adaptation).
//
// Embed mode (?embed=1) renders children bare — that is the document the
// iframe loads. Theme/mode changes broadcast to the iframe over
// postMessage('astryx-theme-sync'), matching upstream's contract.

import { useEffect, useMemo, useRef, useState } from 'octane'
import {
	Button,
	CodeBlock,
	CommandPalette,
	createStaticSource,
	DropdownMenu,
	Icon,
	SegmentedControl,
	Text,
	TreeList,
	useClipboard,
	View,
	type CommandPaletteItem,
	type TreeListNode,
} from '@octane-xplat/ui'
import { useRouterState } from '@octane-xplat/ui/routing'
import { coverageRows, type CoverageRow } from '../coverage/coverage'
import { sourceForRow } from '../source-registry'
import { isEmbed, SANDBOX_THEMES, setMode, setThemeName, useThemeName, useThemePreference } from '../theme'
import { followHref } from './follow-href.web'

const VIEWPORT_WIDTHS: Record<string, string> = {
	desktop: '100%',
	tablet: '768px',
	mobile: '375px',
}

type PreviewItem = CommandPaletteItem

/** Command-palette catalog: every pinned template destination plus the
 *  authored pages and category indexes — a superset of upstream's
 *  categories-only list so palette search reaches all 714 template routes. */
function buildSearchItems(): PreviewItem[] {
	return coverageRows
		.filter((r) => r.route !== '/404/')
		.map((r) => ({
			id: r.route,
			label: r.doc?.displayName ?? r.name ?? r.route,
			description: r.doc?.description ?? r.source ?? undefined,
			auxiliaryData: {
				group:
					r.kind === 'template-block'
						? `Components — ${r.family}`
						: r.kind === 'template-page'
							? 'Page templates'
							: 'Sandbox',
			},
		}))
}

function buildNavTree(currentRoute: string): TreeListNode[] {
	const norm = currentRoute.replace(/\/$/, '')
	const selected = (route: string) => route.replace(/\/$/, '') === norm

	const pageItems: TreeListNode[] = coverageRows
		.filter((r) => r.kind === 'template-page')
		.map((r) => ({
			key: r.route,
			label: r.doc?.displayName ?? r.name ?? r.route,
			href: r.route,
		}))

	const families = new Map<string, TreeListNode[]>()
	for (const r of coverageRows) {
		if (r.kind !== 'template-block' || !r.family) continue
		const items = families.get(r.family) ?? []
		items.push({ key: r.route, label: r.doc?.displayName ?? r.name ?? r.route, href: r.route })
		families.set(r.family, items)
	}

	const componentItems: TreeListNode[] = [...families.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([family, items]) => ({ key: `family:${family}`, label: family, children: items }))

	return [
		{ key: 'group:pages', label: 'Pages', children: pageItems },
		{ key: 'group:components', label: 'Components', children: componentItems },
	]
}

export function PreviewShell(props: { row: CoverageRow; children?: any }) @{
	const row = props.row
	const isBlock = row.kind === 'template-block'
	const pageName = row.doc?.displayName ?? row.name ?? row.route

	const [view, setView] = useState<'preview' | 'code'>('preview')
	const [viewport, setViewport] = useState('desktop')
	const [paletteOpen, setPaletteOpen] = useState(false)
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [toolbarHidden, setToolbarHidden] = useState(
		() => window.localStorage.getItem('sandbox-toolbar-hidden') === 'true',
	)
	const iframeRef = useRef<any>(null)
	const themeName = useThemeName()
	const mode = useThemePreference()

	const clipboard = useClipboard()
	const source = sourceForRow(row)

	const navTree = useMemo(() => buildNavTree(row.route), [row.route])
	const searchSource = useMemo(() => createStaticSource(buildSearchItems()), [])

	// The selected route's family stays expanded so the tree shows where you are.
	const [expandedKeys, setExpandedKeys] = useState<Set<any>>(
		() => new Set(['group:pages', 'group:components', `family:${row.family}`]),
	)
	useEffect(() => {
		setExpandedKeys((keys: Set<any>) => new Set([...keys, 'group:pages', 'group:components', `family:${row.family}`]))
	}, [row.route])

	useEffect(() => {
		try {
			window.localStorage.setItem('sandbox-toolbar-hidden', String(toolbarHidden))
		} catch {}
	}, [toolbarHidden])

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.metaKey && e.key === '\\') {
				e.preventDefault()
				setToolbarHidden((prev: boolean) => !prev)
			}
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [])

	// Live theme/mode sync into the embedded preview (upstream broadcasts the
	// same 'astryx-theme-sync' message so the iframe doesn't reload).
	useEffect(() => {
		const frame = iframeRef.current
		if (!frame?.contentWindow) return
		frame.contentWindow.postMessage(
			{ type: 'astryx-theme-sync', theme: themeName, mode },
			window.location.origin,
		)
	}, [themeName, mode])

	if (isEmbed) {
		return <View className="sb-embed-root">{props.children}</View>
	}

	const copy = () => {
		if (source != null) void clipboard.copy(source)
	}

	const iframeSrc = `${row.route}?embed=1&theme=${themeName}&mode=${mode}`

	return (
		<View className="sb-preview" data-preview-shell>
			<View className={['sb-preview-toolbar', toolbarHidden && 'sb-preview-toolbar--hidden']}>
				<Button
					variant="ghost"
					size="sm"
					isIconOnly
					label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
					icon={<Icon name="sandbox-sidebar" size={16} />}
					clickAction={() => setSidebarOpen(!sidebarOpen)}
				/>
				<button className="sb-preview-name" onClick={() => setPaletteOpen(true)}>
					{pageName}
					<Icon name="sandbox-chevron-down" size={14} />
				</button>

				<CommandPalette
					open={paletteOpen}
					onOpenChange={setPaletteOpen}
					searchSource={searchSource}
					label="Navigate to page"
					onValueChange={(value) => {
						setPaletteOpen(false)
						followHref(value)
					}}
					width={480}
					renderItem={(item: PreviewItem) => (
						<View className="sb-palette-item">
							<Text>{item.label}</Text>
							{item.description ? (
								<Text className="sb-palette-item-desc">{item.description}</Text>
							) : null}
						</View>
					)}
				/>

				<SegmentedControl
					options={[
						{ value: 'preview', label: 'Preview' },
						{ value: 'code', label: 'Code' },
					]}
					value={view}
					onValueChange={(v) => setView(v as 'preview' | 'code')}
					accessibilityLabel="Toggle preview or code view"
					size="sm"
				/>

				{view === 'preview' && !isBlock ? (
					<SegmentedControl
						options={[
							{ value: 'desktop', label: 'Desktop' },
							{ value: 'tablet', label: 'Tablet' },
							{ value: 'mobile', label: 'Mobile' },
						]}
						value={viewport}
						onValueChange={setViewport}
						accessibilityLabel="Viewport size"
						size="sm"
					/>
				) : null}

				<DropdownMenu
					trigger={
						<Text className="sb-preview-theme-label">
							{SANDBOX_THEMES.find((t) => t.id === themeName)?.label ?? themeName}
						</Text>
					}
					accessibilityLabel="Preview theme"
					size="sm"
					items={[
						{
							type: 'radio-group',
							key: 'theme',
							value: themeName,
							onValueChange: (v) => setThemeName(v as typeof themeName),
							items: SANDBOX_THEMES.map((t) => ({ key: t.id, label: t.label, value: t.id })),
						},
					]}
				/>
				<Button
					variant="ghost"
					size="sm"
					isIconOnly
					label={mode === 'light' ? 'Light mode' : 'Dark mode'}
					icon={<Icon name={mode === 'light' ? 'sandbox-sun' : 'sandbox-moon'} size={16} />}
					clickAction={() => setMode(mode === 'light' ? 'dark' : 'light')}
				/>
				<Button
					variant="ghost"
					size="sm"
					isIconOnly
					label={clipboard.isCopied ? 'Copied' : 'Copy source'}
					icon={<Icon name={clipboard.isCopied ? 'sandbox-check' : 'sandbox-copy'} size={16} />}
					clickAction={copy}
				/>
			</View>
			<View className="sb-preview-body">
				{sidebarOpen ? (
					<View className="sb-preview-sidebar">
						<TreeList
							className="sb-preview-tree"
							nodes={navTree}
							selectionMode="single"
							selectedKeys={[row.route]}
							expandedKeys={expandedKeys}
							onExpandedChange={setExpandedKeys}
							onAction={(key) => {
								if (typeof key === 'string' && key.startsWith('/')) followHref(key)
							}}
						/>
					</View>
				) : null}
				{view === 'preview' ? (
					isBlock ? (
						<View className="sb-preview-stage">{props.children}</View>
					) : viewport === 'desktop' ? (
						<iframe
							ref={iframeRef}
							src={iframeSrc}
							sandbox="allow-scripts allow-same-origin"
							title={`${pageName} — ${viewport}`}
							className="sb-preview-iframe"
						/>
					) : (
						<View className="sb-preview-device">
							<iframe
								ref={iframeRef}
								src={iframeSrc}
								sandbox="allow-scripts allow-same-origin"
								title={`${pageName} — ${viewport}`}
								className="sb-preview-iframe sb-preview-iframe--device"
								style={{ width: VIEWPORT_WIDTHS[viewport] }}
							/>
						</View>
					)
				) : (
					<View className="sb-preview-code">
						{source != null ? (
							<CodeBlock code={source} language="tsx" hasLineNumbers hasCopyButton width="100%" />
						) : (
							<View className="sb-preview-nosource">
								<Text className="sb-type-body sb-color-secondary">
									Source not available — this route renders the pending-port
									placeholder. Upstream source: {row.source ?? 'unknown'}
								</Text>
							</View>
						)}
					</View>
				)}
			</View>
		</View>
	)
}
