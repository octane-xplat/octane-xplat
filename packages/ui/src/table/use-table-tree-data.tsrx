/** @jsxImportSource @nativescript-community/octane */
// Tree-data plugin — universal leaf. Same contract as the web leaf; the
// expander is a tappable view, indent is a fixed dip inset, and row-click
// expansion maps to the leaf's onClick → onTap row wiring (the web-only
// interactive-descendant/text-selection guards don't apply to taps).

import { useRef } from 'octane'
import type {
	TablePlugin,
	BodyRowRenderProps,
	HeaderCellRenderProps,
	TableTreeRowMeta,
	UseTableTreeDataConfig,
} from './types'

import type { TableColumn } from '../props'
import { Icon } from '../Icon'

/** Indent step per level (dips), matching the web spacing tokens. */
const INDENT_STEP = { sm: 12, md: 16, lg: 24 } as const

function TreeCellContent<T extends Record<string, unknown>>(props: {
	meta: TableTreeRowMeta | undefined
	indent: 'sm' | 'md' | 'lg'
	onToggle: () => void
	children: any
}) @{
	const meta = props.meta
	if (!meta) {
		return <>{props.children}</>
	}

	const indent = meta.level > 0 ? meta.level * INDENT_STEP[props.indent] : 0

	<masonview
		className="vx-table-tree-cell"
		style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: indent }}
	>
		{meta.hasChildren ? (
			<masonview
				className="vx-table-expander"
				onTap={props.onToggle}
				accessibilityLabel={meta.isExpanded ? 'Collapse row' : 'Expand row'}
				style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
			>
				<Icon name="xplat-chevron-right" size={12} />
			</masonview>
		) : (
			<masonview style={{ width: 24, height: 24 }} />
		)}
		{typeof props.children === 'string' || typeof props.children === 'number' ? (
			<label text={String(props.children)} />
		) : (
			props.children
		)}
	</masonview>
}

function TreeExpandAllToggle(props: {
	isAllExpanded: boolean | 'indeterminate'
	onExpandAll: () => void
	onCollapseAll: () => void
}) @{
	const allExpanded = props.isAllExpanded === true

	<masonview
		className="vx-table-expander"
		onTap={() => (allExpanded ? props.onCollapseAll() : props.onExpandAll())}
		accessibilityLabel={allExpanded ? 'Collapse all rows' : 'Expand all rows'}
		style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
	>
		<Icon name="xplat-chevron-right" size={12} />
	</masonview>
}

export function useTableTreeData<T extends Record<string, unknown>>(
	config: UseTableTreeDataConfig<T>,
): TablePlugin<T> {
	const configRef = useRef(config)
	configRef.current = config

	const treeKeyRef = useRef<string | undefined>(undefined)

	return {
		transformColumns(columns: TableColumn<T>[]) {
			const { hasExpandableRows, treeColumnKey } = configRef.current

			const configuredExists = treeColumnKey != null && columns.some((c) => c.key === treeColumnKey)
			const treeKey = configuredExists
				? treeColumnKey
				: (columns.find((c) => !c.key.startsWith('__'))?.key ?? columns[0]?.key)

			treeKeyRef.current = treeKey

			if (!hasExpandableRows) {
				return columns
			}

			return columns.map((col) => {
				if (col.key !== treeKey) {
					return col
				}

				const originalRenderCell = col.renderCell
				return {
					...col,
					renderCell: (item: T) => {
						const cfg = configRef.current
						return (
							<TreeCellContent
								meta={cfg.getRowMeta(item)}
								indent={cfg.indent ?? 'md'}
								onToggle={() => cfg.onToggleItem(item)}
							>
								{originalRenderCell
									? originalRenderCell(item)
									: String((item[col.key] as string | number | null | undefined) ?? '')}
							</TreeCellContent>
						)
					},
				}
			})
		},

		transformHeaderCell(
			props: HeaderCellRenderProps,
			column: TableColumn<T>,
		): HeaderCellRenderProps {
			const { hasExpandableRows, hasExpandAllControl, isAllExpanded, onExpandAll, onCollapseAll } =
				configRef.current

			if (
				!hasExpandAllControl ||
				!hasExpandableRows ||
				column.key !== treeKeyRef.current ||
				isAllExpanded === undefined ||
				!onExpandAll ||
				!onCollapseAll
			) {
				return props
			}

			return {
				...props,
				before: (
					<>
						{props.before}
						<TreeExpandAllToggle
							isAllExpanded={isAllExpanded}
							onExpandAll={onExpandAll}
							onCollapseAll={onCollapseAll}
						/>
					</>
				),
			}
		},

		transformBodyRow(props: BodyRowRenderProps, item: T): BodyRowRenderProps {
			const cfg = configRef.current
			if (!cfg.hasExpandableRows) {
				return props
			}

			const meta = cfg.getRowMeta(item)
			const rowClickExpandable = cfg.hasRowClickExpansion === true && meta?.hasChildren === true

			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					'aria-level': meta ? meta.level + 1 : undefined,
					'aria-expanded': meta?.hasChildren === true ? meta.isExpanded : undefined,
					...(rowClickExpandable ? { onClick: () => configRef.current.onToggleItem(item) } : {}),
				},
				classes: rowClickExpandable ? [...props.classes, 'vx-table-row--clickable'] : props.classes,
			}
		},
	}
}

export type { TableTreeRowMeta, UseTableTreeDataConfig }
