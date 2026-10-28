// Port of upstream templates/pages/file-explorer/page.tsx (Astryx 0.6.4,
// MIT) — route /templates/file-explorer/.
// GAPS: IconButton `onClick` → `clickAction`; solid FolderIcon reuses the
// outline glyph (recorded).
import { useMemo, useState } from 'octane'
import {
	Avatar, HStack, Icon, IconButton, Layout, LayoutContent, List, ListItem,
	MetadataList, MetadataListItem, Section, SegmentedControl,
	SegmentedControlItem, Text, Toolbar, VStack,
} from '@octane-xplat/ui'

interface FileSystemItem {
	id: string
	name: string
	type: 'file' | 'folder'
	children?: FileSystemItem[]
}

const FILESYSTEM: FileSystemItem[] = [
	{
		id: 'applications',
		name: 'Applications',
		type: 'folder',
		children: [
			{
				id: 'chrome-apps',
				name: 'Chrome Apps',
				type: 'folder',
				children: [
					{ id: 'component-lab', name: 'Component Lab.app', type: 'file' },
					{ id: 'google-chat', name: 'Google Chat.app', type: 'file' },
					{ id: 'workchat', name: 'Workchat.app', type: 'file' },
				],
			},
			{ id: 'figma', name: 'Figma.app', type: 'file' },
			{ id: 'safari', name: 'Safari.app', type: 'file' },
			{ id: 'slack', name: 'Slack.app', type: 'file' },
			{ id: 'terminal', name: 'Terminal.app', type: 'file' },
			{ id: 'vscode', name: 'Visual Studio Code.app', type: 'file' },
			{ id: 'xcode', name: 'Xcode.app', type: 'file' },
		],
	},
	{ id: 'debug-log', name: 'debug-storybook.log', type: 'file' },
	{
		id: 'desktop',
		name: 'Desktop',
		type: 'folder',
		children: [
			{ id: 'screenshot1', name: 'Screenshot 2026-03-28.png', type: 'file' },
			{ id: 'notes-txt', name: 'meeting-notes.txt', type: 'file' },
			{
				id: 'projects',
				name: 'Projects',
				type: 'folder',
				children: [
					{ id: 'readme-proj', name: 'README.md', type: 'file' },
					{
						id: 'src-folder',
						name: 'src',
						type: 'folder',
						children: [
							{ id: 'index-ts', name: 'index.ts', type: 'file' },
							{ id: 'app-tsx', name: 'App.tsx', type: 'file' },
						],
					},
				],
			},
		],
	},
	{
		id: 'documents',
		name: 'Documents',
		type: 'folder',
		children: [
			{ id: 'design-spec', name: 'design-spec.pdf', type: 'file' },
			{ id: 'resume', name: 'resume.docx', type: 'file' },
			{
				id: 'work',
				name: 'Work',
				type: 'folder',
				children: [
					{ id: 'q1-report', name: 'Q1-report.xlsx', type: 'file' },
					{ id: 'presentation', name: 'team-presentation.pptx', type: 'file' },
				],
			},
		],
	},
	{
		id: 'downloads',
		name: 'Downloads',
		type: 'folder',
		children: [
			{ id: 'archive', name: 'archive.zip', type: 'file' },
			{ id: 'installer', name: 'installer.dmg', type: 'file' },
			{ id: 'photo', name: 'photo-2026.jpg', type: 'file' },
		],
	},
	{ id: 'login-screenshot', name: 'login-02-screenshot.png', type: 'file' },
	{
		id: 'movies',
		name: 'Movies',
		type: 'folder',
		children: [{ id: 'recording', name: 'screen-recording.mov', type: 'file' }],
	},
	{
		id: 'music',
		name: 'Music',
		type: 'folder',
		children: [{ id: 'playlist', name: 'favorites.m3u', type: 'file' }],
	},
	{
		id: 'node-modules',
		name: 'node_modules',
		type: 'folder',
		children: [
			{
				id: 'react',
				name: 'react',
				type: 'folder',
				children: [{ id: 'react-index', name: 'index.js', type: 'file' }],
			},
			{
				id: 'react-dom',
				name: 'react-dom',
				type: 'folder',
				children: [{ id: 'react-dom-index', name: 'index.js', type: 'file' }],
			},
		],
	},
	{
		id: 'pictures',
		name: 'Pictures',
		type: 'folder',
		children: [
			{
				id: 'vacation',
				name: 'vacation-2026',
				type: 'folder',
				children: [
					{ id: 'img1', name: 'IMG_0001.jpg', type: 'file' },
					{ id: 'img2', name: 'IMG_0002.jpg', type: 'file' },
					{ id: 'img3', name: 'IMG_0003.jpg', type: 'file' },
				],
			},
			{
				id: 'screenshots-folder',
				name: 'Screenshots',
				type: 'folder',
				children: [
					{ id: 'ss1', name: 'Screen Shot 1.png', type: 'file' },
					{ id: 'ss2', name: 'Screen Shot 2.png', type: 'file' },
				],
			},
		],
	},
	{
		id: 'public',
		name: 'Public',
		type: 'folder',
		children: [{ id: 'drop-box', name: 'Drop Box', type: 'folder', children: [] }],
	},
	{
		id: 'astryx',
		name: 'astryx',
		type: 'folder',
		children: [
			{ id: 'astryx-readme', name: 'README.md', type: 'file' },
			{ id: 'astryx-pkg', name: 'package.json', type: 'file' },
			{
				id: 'astryx-packages',
				name: 'packages',
				type: 'folder',
				children: [
					{
						id: 'astryx-core',
						name: 'core',
						type: 'folder',
						children: [
							{
								id: 'core-src',
								name: 'src',
								type: 'folder',
								children: [
									{ id: 'button-tsx', name: 'Button.tsx', type: 'file' },
									{ id: 'card-tsx', name: 'Card.tsx', type: 'file' },
									{ id: 'text-tsx', name: 'Text.tsx', type: 'file' },
								],
							},
						],
					},
					{
						id: 'astryx-cli',
						name: 'cli',
						type: 'folder',
						children: [{ id: 'cli-index', name: 'index.ts', type: 'file' }],
					},
				],
			},
			{
				id: 'astryx-apps',
				name: 'apps',
				type: 'folder',
				children: [
					{
						id: 'storybook',
						name: 'storybook',
						type: 'folder',
						children: [
							{ id: 'sb-config', name: '.storybook', type: 'folder', children: [] },
						],
					},
					{
						id: 'sandbox-app',
						name: 'sandbox',
						type: 'folder',
						children: [
							{ id: 'sandbox-src', name: 'src', type: 'folder', children: [] },
						],
					},
				],
			},
		],
	},
]

const page = { height: '100dvh' } as const
const columnRow = { overflowX: 'auto', overflowY: 'hidden' } as const
const scrollable = { overflowY: 'auto' } as const
const fixedColumn = { flexShrink: 0 } as const
const detailColumn = {
	flexGrow: 1,
	flexShrink: 0,
	flexBasis: 320,
} as const

function findItem(items: FileSystemItem[], id: string): FileSystemItem | null {
	for (const item of items) {
		if (item.id === id) {return item}
		if (item.children) {
			const found = findItem(item.children, id)
			if (found) {return found}
		}
	}
	return null
}

function getFileExtension(name: string): string {
	const dot = name.lastIndexOf('.')
	return dot > 0 ? name.substring(dot + 1).toUpperCase() : 'File'
}

export function FileExplorerTemplate() @{
	const [selectedPath, setSelectedPath] = useState<string[]>([
		'applications',
		'chrome-apps',
		'component-lab',
	])

	const columns = useMemo(() => {
		const cols: { items: FileSystemItem[]; selectedId: string | null }[] = []
		cols.push({ items: FILESYSTEM, selectedId: selectedPath[0] ?? null })
		let currentItems: FileSystemItem[] = FILESYSTEM
		for (let i = 0; i < selectedPath.length; i++) {
			const selected = currentItems.find((item) => item.id === selectedPath[i])
			if (selected?.children && selected.children.length > 0) {
				cols.push({
					items: selected.children,
					selectedId: selectedPath[i + 1] ?? null,
				})
				currentItems = selected.children
			} else {
				break
			}
		}
		return cols
	}, [selectedPath])

	const currentFolderName = useMemo(() => {
		if (selectedPath.length === 0) {return 'Home'}
		const lastId = selectedPath[selectedPath.length - 1]
		const item = findItem(FILESYSTEM, lastId)
		if (item?.type === 'folder') {return item.name}
		if (selectedPath.length >= 2) {
			const parent = findItem(FILESYSTEM, selectedPath[selectedPath.length - 2])
			return parent?.name ?? 'Home'
		}
		return 'Home'
	}, [selectedPath])

	const selectedFile = useMemo(() => {
		if (selectedPath.length === 0) {return null}
		const lastId = selectedPath[selectedPath.length - 1]
		const item = findItem(FILESYSTEM, lastId)
		return item?.type === 'file' ? item : null
	}, [selectedPath])

	const handleSelect = (columnIndex: number, itemId: string) => {
		setSelectedPath([...selectedPath.slice(0, columnIndex), itemId])
	}

	<Layout
		style={page}
		height="fill"
		header={
			<Toolbar
				label="File Explorer"
				size="sm"
				dividers={['bottom']}
				startContent={
					<>
						<IconButton
							variant="ghost"
							size="sm"
							icon={<Icon name="sandbox-chevron-left" size={16} />}
							clickAction={() => {
								if (selectedPath.length > 0) {
									setSelectedPath(selectedPath.slice(0, -1))
								}
							}}
							isDisabled={selectedPath.length === 0}
							label="Go back"
						/>
						<IconButton
							variant="ghost"
							size="sm"
							icon={<Icon name="sandbox-chevron-right" size={16} />}
							isDisabled
							label="Go forward"
						/>
						<Text type="label">{currentFolderName}</Text>
					</>
				}
				centerContent={
					<SegmentedControl value="column" onValueChange={() => {}} label="View mode">
						<SegmentedControlItem
							value="grid"
							label="Grid"
							icon={<Icon name="sandbox-squares-2x2" size={16} />}
							isLabelHidden
						/>
						<SegmentedControlItem
							value="list"
							label="List"
							icon={<Icon name="sandbox-bars-4" size={16} />}
							isLabelHidden
						/>
						<SegmentedControlItem
							value="column"
							label="Column"
							icon={<Icon name="sandbox-view-columns" size={16} />}
							isLabelHidden
						/>
						<SegmentedControlItem
							value="gallery"
							label="Gallery"
							icon={<Icon name="sandbox-table-cells" size={16} />}
							isLabelHidden
						/>
					</SegmentedControl>
				}
				endContent={
					<>
						<IconButton
							variant="ghost"
							size="sm"
							icon={<Icon name="sandbox-adjustments-horizontal" size={16} />}
							label="Group"
						/>
						<IconButton
							variant="ghost"
							size="sm"
							icon={<Icon name="sandbox-share" size={16} />}
							label="Share"
						/>
						<IconButton
							variant="ghost"
							size="sm"
							icon={<Icon name="sandbox-tag" size={16} />}
							label="Tags"
						/>
						<IconButton
							variant="ghost"
							size="sm"
							icon={<Icon name="sandbox-ellipsis-horizontal" size={16} />}
							label="More"
						/>
						<IconButton
							variant="ghost"
							size="sm"
							icon={<Icon name="sandbox-magnifying-glass" size={16} />}
							label="Search"
						/>
					</>
				}
			/>
		}
		content={
			<LayoutContent padding={0} isScrollable={false}>
				<HStack height="100%" style={columnRow}>
					{columns.map((col, colIndex) => {
						const showDivider = colIndex < columns.length - 1 || selectedFile != null
						return (
							<Section
								key={colIndex}
								width={240}
								padding={2}
								variant="transparent"
								dividers={showDivider ? ['end'] : undefined}
								style={{ ...scrollable, ...fixedColumn }}
							>
								<List density="compact" hasDividers={false}>
									{col.items.map((item) => {
										const isSelected = col.selectedId === item.id
										const hasChildren =
											item.type === 'folder' &&
											item.children != null &&
											item.children.length > 0
										return (
											<ListItem
												key={item.id}
												label={item.name}
												startContent={
													<Icon
														name={
															item.type === 'folder'
																? 'sandbox-folder'
																: 'sandbox-document'
														}
														color={item.type === 'folder' ? 'accent' : 'secondary'}
														size={16}
													/>
												}
												endContent={
													hasChildren ? (
														<Icon
															name="sandbox-chevron-right"
															size={12}
															color="secondary"
														/>
													) : undefined
												}
												onPress={() => handleSelect(colIndex, item.id)}
												isSelected={isSelected}
											/>
										)
									})}
								</List>
							</Section>
						)
					})}
					{selectedFile ? (
						<Section
							padding={6}
							variant="transparent"
							style={{ ...scrollable, ...detailColumn }}
						>
							<VStack gap={4} hAlign="center">
								<Avatar name={selectedFile.name} size={96} />
								<VStack gap={1} hAlign="center">
									<Text type="label">{selectedFile.name}</Text>
									<Text type="supporting">
										{getFileExtension(selectedFile.name)} Document
									</Text>
								</VStack>
								<MetadataList title="Information">
									<MetadataListItem label="Created">
										March 28, 2026 at 2:15 PM
									</MetadataListItem>
									<MetadataListItem label="Modified">
										Yesterday, 10:27 PM
									</MetadataListItem>
									<MetadataListItem label="Kind">
										{getFileExtension(selectedFile.name)} Document
									</MetadataListItem>
								</MetadataList>
							</VStack>
						</Section>
					) : null}
				</HStack>
			</LayoutContent>
		}
	/>
}
