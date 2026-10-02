/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane';
import type { TreeProps, TreeNode } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

function TreeRow(props: { node: TreeNode; depth: number; open: Set<string>; toggle: (n: TreeNode) => void; onSelect?: (n: TreeNode) => void }) @{
	const node = props.node;
	const kids = node.children ?? [];
	const isOpen = props.open.has(node.key);

	<flexboxlayout className="vx-tree-node">
		<flexboxlayout
			className={cx('vx-tree-row', node.disabled && 'vx-tree-row--disabled')}
			style={{ paddingLeft: props.depth * 16, ...(node.disabled ? { opacity: 0.5 } : {}) }}
			onTap={node.disabled ? undefined : () => (kids.length ? props.toggle(node) : props.onSelect?.(node))}
		>
			<label className="vx-tree-caret" style={{ width: 14, marginLeft: 4 }} text={kids.length ? (isOpen ? '▾' : '▸') : ''} />
			<label className="vx-tree-label" text={node.label ?? node.key} />
		</flexboxlayout>
		{isOpen && kids.map((kid: TreeNode) => (
			<TreeRow node={kid} depth={props.depth + 1} open={props.open} toggle={props.toggle} onSelect={props.onSelect} />
		))}
	</flexboxlayout>
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

	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-tree', props.className)} style={props.style}>
		{props.nodes.map((node: TreeNode) => (
			<TreeRow node={node} depth={0} open={open} toggle={toggle} onSelect={props.onSelect} />
		))}
	</flexboxlayout>
}
