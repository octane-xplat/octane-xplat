/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import { useState } from 'octane';
import type { CollapsibleProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";
import { Pressable } from './Pressable.macos.tsrx';

/** Self-drawn collapsible — `trigger` toggles `children` between shown and
 *  hidden (unmounted). Controlled via `open`/`onOpenChange`, uncontrolled
 *  via `defaultOpen`. */
export function Collapsible(props: CollapsibleProps) @{
	const [internal, setInternal] = useState(props.defaultOpen ?? false);
	const controlled = props.open !== undefined;
	const open = controlled ? props.open : internal;

	const toggle = () => {
		if (props.disabled) return;
		const next = !open;
		if (!controlled) setInternal(next);
		props.onOpenChange?.(next);
	};

	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-collapsible', open && 'vx-collapsible--open', props.className)} style={mergeStyle({display: "flex"}, props.style)}>
		<Pressable
			className="vx-collapsible-trigger"
			disabled={props.disabled}
			onPress={toggle}
			accessibilityLabel={props.accessibilityLabel}
		>
			{typeof props.trigger === 'string' || typeof props.trigger === 'number' ? (
				<label className="vx-collapsible-trigger-text" text={String(props.trigger)} />
			) : (
				props.trigger
			)}
		</Pressable>
		{open ? <masonview className="vx-collapsible-content" style={{display: "flex"}}>{props.children}</masonview> : null}
	</masonview>
}

// CollapsibleGroup has no AppKit-specific leaf yet; reuse the shared
// implementation so the barrel resolves.
export { CollapsibleGroup } from "./Collapsible.tsrx";
