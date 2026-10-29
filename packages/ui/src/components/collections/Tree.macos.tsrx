/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo, useState } from 'octane'
import type { Key, Selection, TreeProps, TreeListNode } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { gridListPress, isGridListKeySelected, normalizeSelection } from './grid-list-selection'

function leafKeys(nodes: readonly TreeListNode[], into: Key[] = []): Key[] {
	for (const node of nodes) {
		if (node.children?.length) {
			leafKeys(node.children, into)
		} else if (!node.disabled) {
			into.push(node.key)
		}
	}

	return into
}

function TreeRow(props: {
	node: TreeListNode
	depth: number
	open: ReadonlySet<Key>
	selected: Selection
	selectionMode: 'none' | 'single' | 'multiple'
	toggle: (n: TreeListNode) => void
	press: (n: TreeListNode) => void
}) @{
	const node = props.node
	const kids = node.children ?? []
	const isLeaf = kids.length === 0
	const isOpen = props.open.has(node.key)
	const isSelected =
		isLeaf && props.selectionMode !== 'none' && isGridListKeySelected(props.selected, node.key)

	<masonview className="vx-tree-node" style={{ display: 'flex' }}>
		<masonview
			className={cx(
				'vx-tree-row',
				node.disabled && 'vx-tree-row--disabled',
				isSelected && 'vx-tree-row--selected',
			)}
			style={mergeStyle(
				{ display: 'flex' },
				{ paddingLeft: props.depth * 16, ...(node.disabled ? { opacity: 0.5 } : {}) },
			)}
			onTap={node.disabled ? undefined : () => (isLeaf ? props.press(node) : props.toggle(node))}
			accessibilityState={{
				disabled: node.disabled || undefined,
				selected: props.selectionMode !== 'none' && isLeaf ? isSelected : undefined,
			}}
		>
			<label
				className="vx-tree-caret"
				style={{ width: 14, marginLeft: 4 }}
				text={isLeaf ? '' : isOpen ? '▾' : '▸'}
			/>
			<label className="vx-tree-label" text={node.label ?? String(node.key)} />
		</masonview>
		{isOpen &&
			kids.map((kid: TreeListNode) => (
				<TreeRow
					node={kid}
					depth={props.depth + 1}
					open={props.open}
					selected={props.selected}
					selectionMode={props.selectionMode}
					toggle={props.toggle}
					press={props.press}
				/>
			))}
	</masonview>
}

/** TreeList — recursive indent + collapse. `expandedKeys`/`onExpandedChange`
 *  control the open set, `defaultExpandedKeys` seeds it; leaf rows keep a
 *  keyed selection under `selectionMode` and `onAction` reports leaf
 *  activation. */
export function Tree<T extends TreeListNode = TreeListNode>(props: TreeProps<T>) @{
	const selectionMode = props.selectionMode ?? 'none'
	const [openInternal, setOpenInternal] = useState<Set<Key>>(
		() => new Set(props.defaultExpandedKeys ?? []),
	)

	const open: ReadonlySet<Key> =
		props.expandedKeys !== undefined ? new Set(props.expandedKeys) : openInternal

	const [selectedInternal, setSelectedInternal] = useState<Selection>(() =>
		normalizeSelection(props.defaultSelectedKeys),
	)

	const selected: Selection =
		props.selectedKeys !== undefined ? normalizeSelection(props.selectedKeys) : selectedInternal

	const keys = useMemo(() => leafKeys(props.nodes), [props.nodes])

	const toggle = (node: TreeListNode) => {
		const next = new Set(open)
		if (next.has(node.key)) {
			next.delete(node.key)
		} else {
			next.add(node.key)
		}

		if (props.expandedKeys === undefined) {
			setOpenInternal(next)
		}

		props.onExpandedChange?.(next)
	}

	const press = (node: TreeListNode) => {
		if (selectionMode !== 'none') {
			const next = gridListPress({
				selection: selected,
				key: node.key,
				index: 0,
				anchorIndex: null,
				keys,
				selectionMode,
				selectionBehavior: 'toggle',
			}).selection

			if (props.selectedKeys === undefined) {
				setSelectedInternal(next)
			}

			props.onSelectionChange?.(next)
		}

		props.onAction?.(node.key)
	}

	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-tree', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		{props.nodes.map((node: T) => (
			<TreeRow
				node={node}
				depth={0}
				open={open}
				selected={selected}
				selectionMode={selectionMode}
				toggle={toggle}
				press={press}
			/>
		))}
	</masonview>
}
