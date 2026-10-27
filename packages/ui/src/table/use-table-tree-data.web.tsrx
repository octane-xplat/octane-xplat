// Tree-data plugin — port of upstream plugins/tree/useTableTreeData.tsx
// (Astryx 0.6.4, MIT), web leaf. The tree affordance decorates the tree
// column's cells in place — indent + a 24px expander (or leaf spacer) — and
// the header optionally carries an expand-all toggle.
//
// DESIGN: row ARIA (aria-level, aria-expanded) is applied declaratively in
// the row's htmlProps rather than upstream's external store + imperative
// ref-subscription — the table re-renders on expansion state change (the
// same rationale unit 6 used for the selection highlight). Row meta is read
// at transform time from the live config ref.

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

/** Indent step per level, by the `indent` config token. */
const INDENT_STEP = {
	sm: 'var(--spacing-3, 12px)',
	md: 'var(--spacing-4, 16px)',
	lg: 'var(--spacing-6, 24px)',
} as const

function TreeExpander(props: { isExpanded: boolean; onToggle: () => void }) @{
	<button
		type="button"
		class="vx-table-expander"
		onClick={(e: any) => {
			e.stopPropagation()
			props.onToggle()
		}}
		aria-label={props.isExpanded ? 'Collapse row' : 'Expand row'}
		aria-expanded={props.isExpanded}
	>
		<span
			class={
				props.isExpanded
					? 'vx-table-chevron-icon vx-table-chevron-icon--expanded'
					: 'vx-table-chevron-icon vx-table-chevron-icon--collapsed'
			}
		>
			<Icon name="xplat-chevron-right" size={12} />
		</span>
	</button>
}

/** Header expand-all/collapse-all toggle — the chevron points down only when
 *  every expandable row is expanded. */
function TreeExpandAllToggle(props: {
	isAllExpanded: boolean | 'indeterminate'
	onExpandAll: () => void
	onCollapseAll: () => void
}) @{
	const allExpanded = props.isAllExpanded === true

	<button
		type="button"
		class="vx-table-expander"
		onClick={(e: any) => {
			e.stopPropagation()
			if (allExpanded) {
				props.onCollapseAll()
			} else {
				props.onExpandAll()
			}
		}}
		aria-label={allExpanded ? 'Collapse all rows' : 'Expand all rows'}
		aria-expanded={allExpanded}
	>
		<span
			class={
				allExpanded
					? 'vx-table-chevron-icon vx-table-chevron-icon--expanded'
					: 'vx-table-chevron-icon vx-table-chevron-icon--collapsed'
			}
		>
			<Icon name="xplat-chevron-right" size={12} />
		</span>
	</button>
}

function TreeCellContent<T extends Record<string, unknown>>(props: {
	item: T
	meta: TableTreeRowMeta | undefined
	indent: 'sm' | 'md' | 'lg'
	onToggle: () => void
	children: any
}) @{
	const meta = props.meta
	if (!meta) {
		return <>{props.children}</>
	}

	const indent = meta.level > 0 ? `calc(${meta.level} * ${INDENT_STEP[props.indent]})` : undefined

	<div class="vx-table-tree-cell" style={indent ? { paddingInlineStart: indent } : undefined}>
		{meta.hasChildren ? (
			<TreeExpander isExpanded={meta.isExpanded} onToggle={props.onToggle} />
		) : (
			<span class="vx-table-tree-leaf-spacer" />
		)}
		{props.children}
	</div>
}

// Interactive elements whose clicks must not trigger row-click expansion.
const INTERACTIVE_CLICK_SELECTOR =
	'button, a, input, select, textarea, [role="button"], [role="checkbox"], [contenteditable="true"]'

export function useTableTreeData<T extends Record<string, unknown>>(
	config: UseTableTreeDataConfig<T>,
): TablePlugin<T> {
	const configRef = useRef(config)
	configRef.current = config

	// The resolved tree column key, written by transformColumns (step 1) and
	// read by transformHeaderCell (step 4) to place the expand-all toggle on
	// the same column that carries the row expanders.
	const treeKeyRef = useRef<string | undefined>(undefined)

	return {
		transformColumns(columns: TableColumn<T>[]) {
			const { hasExpandableRows, treeColumnKey } = configRef.current

			// Resolve the tree column: the configured key when present, else the
			// first non-synthetic column (a configured column may have been hidden
			// by columnSettings — the expander must not vanish).
			const configuredExists = treeColumnKey != null && columns.some((c) => c.key === treeColumnKey)
			const treeKey = configuredExists
				? treeColumnKey
				: (columns.find((c) => !c.key.startsWith('__'))?.key ?? columns[0]?.key)

			treeKeyRef.current = treeKey

			// Migration guarantee: flat data renders identically to a Table
			// without the plugin.
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
								item={item}
								meta={cfg.getRowMeta(item)}
								indent={cfg.indent ?? 'md'}
								onToggle={() => cfg.onToggleItem(item)}
							>
								{originalRenderCell
									? (originalRenderCell(item) as any)
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

			// Wrap the label + toggle in one inline-flex row so the chevron sits
			// to the LEFT of the title on the same line.
			return {
				...props,
				content: (
					<span class="vx-table-tree-header">
						<TreeExpandAllToggle
							isAllExpanded={isAllExpanded}
							onExpandAll={onExpandAll}
							onCollapseAll={onCollapseAll}
						/>
						{props.content as any}
					</span>
				),
			}
		},

		transformBodyRow(props: BodyRowRenderProps, item: T): BodyRowRenderProps {
			const cfg = configRef.current
			if (!cfg.hasExpandableRows) {
				return props
			}

			const meta = cfg.getRowMeta(item)

			// Declarative tree ARIA (replaces upstream's imperative ref store):
			// aria-level on every tree row, aria-expanded only on parents.
			const htmlProps = {
				...props.htmlProps,
				'aria-level': meta ? meta.level + 1 : undefined,
				'aria-expanded': meta?.hasChildren === true ? meta.isExpanded : undefined,
			}

			// Whole-row-click expansion (opt-in). Only expandable rows are
			// clickable; leaves stay inert.
			const rowClickExpandable = cfg.hasRowClickExpansion === true && meta?.hasChildren === true
			if (!rowClickExpandable) {
				return { ...props, htmlProps }
			}

			return {
				...props,
				htmlProps: {
					...htmlProps,
					onClick: (event: any) => {
						// Don't hijack clicks on interactive cell content or a text
						// selection (the chevron already stops propagation; a composed
						// checkbox/link/button does not).
						const target = event?.target as HTMLElement | undefined
						if (target?.closest?.(INTERACTIVE_CLICK_SELECTOR)) {
							return
						}

						if ((window.getSelection()?.toString() ?? '') !== '') {
							return
						}

						configRef.current.onToggleItem(item)
					},
				},
				classes: [...props.classes, 'vx-table-row--clickable'],
			}
		},
	}
}

export type { TableTreeRowMeta, UseTableTreeDataConfig }
