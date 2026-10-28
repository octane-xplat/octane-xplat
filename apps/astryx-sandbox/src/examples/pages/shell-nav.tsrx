// Port of upstream templates/pages/shell-nav/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/shell-nav/.
// GAPS: upstream TreeList items carry `startContent` icons and per-node
// `isExpanded`/`isSelected`; the public TreeListNode has key/label/children/
// disabled/href only — expansion/selection move to defaultExpandedKeys +
// selectionMode/defaultSelectedKeys and node icons are dropped (recorded).
// CommandPalette `isOpen` → `open`. Stack onClick wrapper → plain div.
import { useEffect, useMemo, useState } from 'octane'
import {
	AppShell, Button, Card, CommandPalette, createStaticSource,
	DropdownMenu, DropdownMenuDivider, DropdownMenuItem, HStack, Icon, IconButton, Kbd, Layout,
	LayoutContent, LayoutHeader, SideNav, TextInput, TopNav, TreeList,
	VStack,
} from '@octane-xplat/ui'
import type { TreeListNode } from '@octane-xplat/ui'

const noop = () => {}

const FILE_TREE: TreeListNode[] = [
	{
		key: 'src',
		label: 'src',
		children: [
			{
				key: 'components',
				label: 'components',
				children: [
					{ key: 'AppShell.tsx', label: 'AppShell.tsx' },
					{ key: 'TopNav.tsx', label: 'TopNav.tsx' },
					{ key: 'SideNav.tsx', label: 'SideNav.tsx' },
				],
			},
			{
				key: 'hooks',
				label: 'hooks',
				children: [
					{ key: 'useTheme.ts', label: 'useTheme.ts' },
					{ key: 'useResizable.ts', label: 'useResizable.ts' },
				],
			},
			{ key: 'index.tsx', label: 'index.tsx' },
			{ key: 'App.tsx', label: 'App.tsx' },
		],
	},
	{
		key: 'public',
		label: 'public',
		children: [
			{ key: 'favicon.ico', label: 'favicon.ico' },
			{ key: 'robots.txt', label: 'robots.txt' },
		],
	},
	{ key: 'package.json', label: 'package.json' },
	{ key: 'tsconfig.json', label: 'tsconfig.json' },
	{ key: 'README.md', label: 'README.md' },
]

// Upstream expands every folder except `public` and selects AppShell.tsx.
const EXPANDED_KEYS = new Set(['src', 'components', 'hooks'])

// Each menu is split into groups; groups are separated by a divider.
// `[label, shortcut]` — the shortcut renders as a single combined Kbd
// (e.g. ⌘N); an empty shortcut renders no Kbd.
type MenuEntry = [label: string, shortcut: string]

const MENU_WIDTH = 280

const MENUS: { label: string; groups: MenuEntry[][] }[] = [
	{
		label: 'File',
		groups: [
			[
				['New File', '⌘N'],
				['New Window', '⇧⌘N'],
			],
			[
				['Open...', '⌘O'],
				['Save', '⌘S'],
				['Save As...', '⇧⌘S'],
			],
			[['Close Editor', '⌘W']],
		],
	},
	{
		label: 'Edit',
		groups: [
			[
				['Undo', '⌘Z'],
				['Redo', '⇧⌘Z'],
			],
			[
				['Cut', '⌘X'],
				['Copy', '⌘C'],
				['Paste', '⌘V'],
			],
			[['Find', '⌘F']],
		],
	},
	{
		label: 'View',
		groups: [
			[['Command Palette', '⇧⌘P']],
			[
				['Explorer', '⇧⌘E'],
				['Search', '⇧⌘F'],
			],
			[
				['Toggle Terminal', '⌃`'],
				['Zen Mode', '⌘K'],
			],
		],
	},
	{
		label: 'Window',
		groups: [
			[
				['Minimize', '⌘M'],
				['Zoom', ''],
			],
			[
				['Next Tab', '⌃⇥'],
				['Previous Tab', '⌃⇧⇥'],
			],
			[['Bring All to Front', '']],
		],
	},
	{
		label: 'Help',
		groups: [
			[
				['Documentation', ''],
				['Release Notes', ''],
				['Report Issue', ''],
				['About', ''],
			],
		],
	},
]

const CODE_LINES = [
	'38%',
	'62%',
	'54%',
	'0%',
	'46%',
	'70%',
	'58%',
	'34%',
	'0%',
	'50%',
	'66%',
	'42%',
	'60%',
	'28%',
]

const EDITOR_TABS = ['AppShell.tsx', 'TopNav.tsx', 'theme.ts']

const COMMANDS = [
	{ id: 'new-file', label: 'New File' },
	{ id: 'open-file', label: 'Open File…' },
	{ id: 'save-all', label: 'Save All' },
	{ id: 'find-in-files', label: 'Find in Files' },
	{ id: 'toggle-terminal', label: 'Toggle Terminal' },
	{ id: 'go-to-symbol', label: 'Go to Symbol…' },
	{ id: 'appshell', label: 'AppShell.tsx' },
	{ id: 'topnav', label: 'TopNav.tsx' },
	{ id: 'sidenav', label: 'SideNav.tsx' },
	{ id: 'use-theme', label: 'useTheme.ts' },
	{ id: 'theme', label: 'theme.ts' },
]

export function ShellNavTemplate() @{
	const [isPaletteOpen, setIsPaletteOpen] = useState(false)
	const searchSource = useMemo(() => createStaticSource(COMMANDS), [])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault()
				setIsPaletteOpen(true)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	<>
		<AppShell
			contentPadding={0}
			style={{ height: '100%', minHeight: 0 }}
			topNav={
				<TopNav
					label="Astryx Studio menu bar"
					startContent={
						<>
							{MENUS.map((menu) => (
								<DropdownMenu
									key={menu.label}
									button={{ label: menu.label, variant: 'ghost', size: 'sm' }}
									hasChevron={false}
									menuWidth={MENU_WIDTH}
								>
									{menu.groups.flatMap((group, gi) => [
										...(gi > 0 ? [<DropdownMenuDivider key={`divider-${gi}`} />] : []),
										...group.map(([label, shortcut]) => (
											<DropdownMenuItem
												key={label}
												label={label}
												onSelect={noop}
												endContent={shortcut ? <Kbd keys={shortcut} /> : undefined}
											/>
										)),
									])}
								</DropdownMenu>
							))}
						</>
					}
					endContent={
						<>
							<div onClick={() => setIsPaletteOpen(true)}>
								<TextInput
									label="Search files and commands"
									isLabelHidden
									size="sm"
									width={240}
									startIcon={<Icon name="sandbox-magnifying-glass" size={16} />}
									placeholder="Search files and commands…"
									value=""
									onChange={() => {}}
								/>
							</div>
							<IconButton
								label="Run project"
								tooltip="Run"
								variant="ghost"
								icon={<Icon name="sandbox-play" size={16} />}
							/>
							<Button label="Share" variant="secondary" />
						</>
					}
				/>
			}
			sideNav={
				<SideNav resizable={{ defaultWidth: 240, minWidth: 180, maxWidth: 400 }}>
					<TreeList
						nodes={FILE_TREE}
						defaultExpandedKeys={EXPANDED_KEYS}
						selectionMode="single"
						defaultSelectedKeys={new Set(['AppShell.tsx'])}
						onAction={noop}
					/>
				</SideNav>
			}
		>
			<Layout
				height="fill"
				header={
					<LayoutHeader hasDivider padding={6}>
						<HStack gap={2}>
							{EDITOR_TABS.map((tab) => (
								<Card
									key={tab}
									variant="muted"
									padding={0}
									width={132}
									height={36}
								/>
							))}
						</HStack>
					</LayoutHeader>
				}
				content={
					<LayoutContent padding={6}>
						<VStack gap={2}>
							{CODE_LINES.map((width, i) =>
								width === '0%' ? (
									<Card
										key={i}
										variant="muted"
										padding={0}
										width={1}
										height={14}
									/>
								) : (
									<HStack key={i} gap={3} vAlign="center">
										<Card
											variant="muted"
											padding={0}
											width={20}
											height={14}
										/>
										<Card
											variant="muted"
											padding={0}
											width={width}
											height={14}
										/>
									</HStack>
								),
							)}
						</VStack>
					</LayoutContent>
				}
			/>
		</AppShell>
		<CommandPalette
			open={isPaletteOpen}
			onOpenChange={setIsPaletteOpen}
			searchSource={searchSource}
			label="Search files and commands"
			onValueChange={() => setIsPaletteOpen(false)}
		/>
	</>
}
