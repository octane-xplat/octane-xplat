/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo, useState } from 'octane'
import type { Key, Selection, TreeProps, TreeListNode } from './props'
import { applyEscapeProps } from './escape-props'
import { gridListPress, isGridListKeySelected, normalizeSelection } from './grid-list-selection'
import { useLinkComponent } from './use-link-component.web.tsrx'

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

	const LinkEl: any = useLinkComponent()

	<div
		className="vx-tree-node"
		role="treeitem"
		aria-expanded={isLeaf ? undefined : isOpen}
		aria-selected={props.selectionMode !== 'none' && isLeaf ? isSelected : undefined}
	>
		<div
			className={[
				'vx-tree-row',
				node.disabled ? 'vx-tree-row--disabled' : undefined,
				isSelected ? 'vx-tree-row--selected' : undefined,
			]}
			style={{ paddingLeft: props.depth * 16 }}
			role="button"
			tabIndex={node.disabled ? undefined : 0}
			onClick={node.disabled ? undefined : () => (isLeaf ? props.press(node) : props.toggle(node))}
			onKeyDown={(e: any) => {
				if (node.disabled) {
					return
				}

				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					if (isLeaf) {
						props.press(node)
					} else {
						props.toggle(node)
					}
				}
			}}
		>
			<span className="vx-tree-caret" aria-hidden="true">
				{isLeaf ? '' : isOpen ? '▾' : '▸'}
			</span>
			{isLeaf && node.href != null ? (
				<LinkEl
					className="vx-tree-label vx-tree-label--link"
					href={node.href}
					onClick={(e: any) => {
						e.stopPropagation()
						props.press(node)
					}}
				>
					{node.label ?? String(node.key)}
				</LinkEl>
			) : (
				<span className="vx-tree-label">{node.label ?? String(node.key)}</span>
			)}
		</div>
		{isOpen &&
			kids.map((kid: TreeListNode) => (
				<TreeRow
					key={kid.key}
					node={kid}
					depth={props.depth + 1}
					open={props.open}
					selected={props.selected}
					selectionMode={props.selectionMode}
					toggle={props.toggle}
					press={props.press}
				/>
			))}
	</div>
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

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-tree', props.className]}
		style={props.style}
		role="tree"
	>
		{props.nodes.map((node: T) => (
			<TreeRow
				key={node.key}
				node={node}
				depth={0}
				open={open}
				selected={selected}
				selectionMode={selectionMode}
				toggle={toggle}
				press={press}
			/>
		))}
	</div>
}
