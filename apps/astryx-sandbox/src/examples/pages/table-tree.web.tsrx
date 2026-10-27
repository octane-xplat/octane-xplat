// Astryx 0.6.4 repository tree (MIT): search prunes branches; sort stays within siblings.
import { useMemo, useState } from 'octane'
import {
	Button,
	Heading,
	HStack,
	Table,
	Text,
	TextInput,
	VStack,
	pixel,
	proportional,
	useTableColumnResize,
	useTableSortable,
	useTableSortableState,
	useTableTreeData,
	useTableTreeState,
} from '@octane-xplat/ui'

import { Markdown } from '@octane-xplat/ui/markdown'
import type { TableColumn, TablePlugin } from '@octane-xplat/ui'
import {
	ROLLED_UP,
	DEFAULT_EXPANDED,
	readmeFor,
	pruneTree,
	collectIds,
	countMatches,
} from './repo-data'

import type { RepoEntry } from './repo-data'

const columns: TableColumn<RepoEntry>[] = [
	{ key: 'name', header: 'Name', width: proportional(2), sortable: true },
	{ key: 'commitMessage', header: 'Last commit', width: proportional(3), sortable: true },
	{
		key: 'committedAt',
		header: 'Committed',
		width: pixel(140),
		sortable: true,
		renderCell: (item) => new Date(item.committedAt).toLocaleDateString('en-US'),
	},
]

export function TableTreeTemplate() @{
	const [query, setQuery] = useState('')
	const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set(DEFAULT_EXPANDED))
	const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
	const [focusedId, setFocusedId] = useState<string | null>(null)
	const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
	const needle = query.toLowerCase().trim()
	const data = useMemo(() => (needle ? pruneTree(ROLLED_UP, needle) : ROLLED_UP), [needle])
	const sortable = useTableSortableState<RepoEntry>({
		data,
		comparators: {
			name: (a, b) =>
				Number(b.kind === 'folder') - Number(a.kind === 'folder') || a.name.localeCompare(b.name),
		},
	})

	const treeState = useTableTreeState({
		data,
		idKey: 'id',
		expandedIds: needle ? collectIds(data, new Set()) : expandedIds,
		onExpandedIdsChange: needle ? () => {} : setExpandedIds,
		sortSiblings: sortable.applySort,
	})

	const tree = useTableTreeData({ ...treeState.treeConfig, hasExpandAllControl: true })
	const sort = useTableSortable<RepoEntry>(sortable.sortConfig)
	const resize = useTableColumnResize<RepoEntry>({
		columnWidths,
		onColumnResizeEnd: setColumnWidths,
	})

	const navigation: TablePlugin<RepoEntry> = {
		transformBodyRow(props, item) {
			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					tabIndex:
						focusedId === item.id || (!focusedId && treeState.visibleData[0] === item) ? 0 : -1,
					onFocus: () => setFocusedId(item.id),
					onClick: () => {
						setFocusedId(item.id)
						if (item.kind === 'folder') {
							setSelectedFolderId(item.id)
						}
					},
					onKeyDown: (event: KeyboardEvent) => {
						if (event.target !== event.currentTarget) {
							return
						}

						const rows = treeState.visibleData
						const index = rows.indexOf(item)
						let nextIndex = index
						switch (event.key) {
							case 'ArrowRight':
								if (item.children && !treeState.expandedIds.has(item.id)) {
									treeState.treeConfig.onToggleItem(item)
								} else if (item.children) {
									nextIndex++
								}

								break
							case 'ArrowLeft':
								if (item.children && treeState.expandedIds.has(item.id)) {
									treeState.treeConfig.onToggleItem(item)
								} else {
									nextIndex = rows.findIndex(
										(row) => row.id === item.id.slice(0, item.id.lastIndexOf('/')),
									)
								}

								break
							case 'ArrowDown':
								nextIndex++
								break
							case 'ArrowUp':
								nextIndex--
								break
							case 'Home':
								nextIndex = 0
								break
							case 'End':
								nextIndex = rows.length - 1
								break
							default:
								return
						}

						event.preventDefault()
						const next = rows[nextIndex]
						if (next && nextIndex !== index) {
							setFocusedId(next.id)
							const row = event.currentTarget as HTMLElement
							row.parentElement?.querySelectorAll<HTMLElement>('tr')[nextIndex]?.focus()
						}
					},
				},
			}
		},
	}

	const readme = readmeFor(selectedFolderId)

	<VStack gap={4} padding={4}>
		<Heading level={1}>canvas-editor</Heading>
		<Text>A small, embeddable vector canvas. TypeScript · MIT</Text>
		<HStack gap={3}>
			<Text>{`main / ${selectedFolderId ?? ''}`}</Text>
			<Button label="Repository root" clickAction={() => setSelectedFolderId(null)} />
		</HStack>
		<TextInput
			label="Search repository"
			value={query}
			onChange={setQuery}
			placeholder="Go to file…"
		/>
		{needle && <Text>{`${countMatches(ROLLED_UP, needle)} matching files and folders`}</Text>}
		<Table
			data={treeState.visibleData}
			columns={columns}
			idKey="id"
			plugins={{ navigation, sort, tree, resize }}
			hasHover
		/>
		{readme && <Markdown text={readme} />}
	</VStack>
}
