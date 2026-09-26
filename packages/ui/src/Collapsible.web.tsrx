import { useState } from 'octane';
import type { CollapsibleProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Pressable } from './Pressable.web.tsrx';

/** Self-drawn collapsible — `trigger` toggles `children` between shown and
 *  hidden (unmounted). Controlled via `open`/`onOpenChange`, uncontrolled
 *  via `defaultOpen`. The trigger reports aria-expanded. */
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

	<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-collapsible', open ? 'vx-collapsible--open' : undefined, props.className]} style={props.style}>
		<Pressable
			className="vx-collapsible-trigger"
			disabled={props.disabled}
			onPress={toggle}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityState={{ disabled: props.disabled }}
		>
			{props.trigger}
		</Pressable>
		{open ? <div className="vx-collapsible-content">{props.children}</div> : null}
	</div>
}
