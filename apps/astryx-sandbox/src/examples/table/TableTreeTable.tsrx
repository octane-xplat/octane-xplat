// Port of upstream Table/TableTreeTable.tsx (Astryx 0.6.4, MIT).
import { Table, pixel, proportional, useTableTreeData, useTableTreeState } from '@octane-xplat/ui'

interface FileNode extends Record<string, unknown> {
	id: string
	name: string
	kind: 'folder' | 'file'
	size: string
	children?: FileNode[]
}

const fileTree: FileNode[] = [
	{
		id: 'src',
		name: 'src',
		kind: 'folder',
		size: '',
		children: [
			{
				id: 'src/components',
				name: 'components',
				kind: 'folder',
				size: '',
				children: [
					{ id: 'src/components/Button.tsx', name: 'Button.tsx', kind: 'file', size: '4.2 KB' },
					{ id: 'src/components/Table.tsx', name: 'Table.tsx', kind: 'file', size: '12.8 KB' },
				],
			},
			{ id: 'src/index.ts', name: 'index.ts', kind: 'file', size: '0.4 KB' },
		],
	},
	{ id: 'package.json', name: 'package.json', kind: 'file', size: '1.8 KB' },
]

const columns = [
	{ key: 'name', header: 'Name', width: proportional(2) },
	{ key: 'kind', header: 'Kind', width: pixel(90) },
	{ key: 'size', header: 'Size', width: pixel(90) },
]

export function TableTreeTable() @{
	// useTableTreeState owns the expanded set and flattens the nested data into
	// the visible rows; useTableTreeData draws the indent + expander in the tree
	// column. hasExpandAllControl adds the expand-all toggle to the header.
	const { visibleData, treeConfig } = useTableTreeState<FileNode>({
		data: fileTree,
		idKey: 'id',
		defaultExpandedIds: ['src'],
	})

	const tree = useTableTreeData({ ...treeConfig, hasExpandAllControl: true })

	<Table data={visibleData} columns={columns} idKey="id" hasHover plugins={{ tree }} />
}
