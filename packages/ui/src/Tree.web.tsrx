import { useState } from 'octane';
import type { TreeProps, TreeNode } from "./props";
import { applyEscapeProps } from "./escape-props";

function TreeRow(props: { node: TreeNode; depth: number; open: Set<string>; toggle: (n: TreeNode) => void; onSelect?: (n: TreeNode) => void }) @{
	const node = props.node;
	const kids = node.children ?? [];
	const isOpen = props.open.has(node.key);

	<div className="vx-tree-node" role="treeitem" aria-expanded={kids.length ? isOpen : undefined}>
		<div
			className={['vx-tree-row', node.disabled ? 'vx-tree-row--disabled' : undefined]}
			style={{ paddingLeft: props.depth * 16 }}
			role="button"
			tabIndex={node.disabled ? undefined : 0}
			onClick={node.disabled ? undefined : () => (kids.length ? props.toggle(node) : props.onSelect?.(node))}
			onKeyDown={(e: any) => {
				if (node.disabled) return;
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					if (kids.length) props.toggle(node); else props.onSelect?.(node);
				}
			}}
		>
			<span className="vx-tree-caret" aria-hidden="true">{kids.length ? (isOpen ? '▾' : '▸') : ''}</span>
			<span className="vx-tree-label">{node.label ?? node.key}</span>
		</div>
		{isOpen && kids.map((kid: TreeNode) => (
			<TreeRow key={kid.key} node={kid} depth={props.depth + 1} open={props.open} toggle={props.toggle} onSelect={props.onSelect} />
		))}
	</div>
}

/** Tree — recursive indent + collapse. `defaultExpanded` seeds the open
 *  set (uncontrolled); `onToggle`/`onSelect` report changes. */
export function Tree(props: TreeProps) @{
	const [open, setOpen] = useState<Set<string>>(new Set(props.defaultExpanded ?? []));

	const toggle = (node: TreeNode) => {
		const next = new Set(open);
		const willOpen = !next.has(node.key);
		if (willOpen) next.add(node.key); else next.delete(node.key);
		setOpen(next);
		props.onToggle?.(node.key, willOpen);
	};

	<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-tree', props.className]} style={props.style} role="tree">
		{props.nodes.map((node: TreeNode) => (
			<TreeRow key={node.key} node={node} depth={0} open={open} toggle={toggle} onSelect={props.onSelect} />
		))}
	</div>
}
