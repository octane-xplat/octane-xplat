/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import type { CollapsibleProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Pressable } from './Pressable.tsrx';

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

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-collapsible', open && 'vx-collapsible--open', props.className)}
		style={props.style}
	>
		<Pressable
			className="vx-collapsible-trigger"
			disabled={props.disabled}
			onPress={toggle}
			accessibilityLabel={props.accessibilityLabel}
		>
			{props.trigger}
		</Pressable>
		{open ? <flexboxlayout className="vx-collapsible-content">{props.children}</flexboxlayout> : null}
	</flexboxlayout>
}
