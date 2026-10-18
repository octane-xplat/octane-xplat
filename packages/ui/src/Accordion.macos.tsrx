/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane';
import type { AccordionProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";
import { Collapsible } from './Collapsible.macos.tsrx';

/** Self-drawn accordion — a list of Collapsibles sharing one open-state.
 *  Controlled via `open` (key, or keys with `multiple`), uncontrolled via
 *  `defaultOpen`. */
export function Accordion(props: AccordionProps) @{
	const normalize = (v: string | string[] | null | undefined) =>
		v == null ? [] : Array.isArray(v) ? v : [v];

	const [internal, setInternal] = useState<string[]>(normalize(props.defaultOpen));
	const controlled = props.open !== undefined;
	const openKeys = controlled ? normalize(props.open) : internal;

	const report = (keys: string[]) => {
		if (!controlled) setInternal(keys);
		if (props.multiple) props.onOpenChange?.(keys)
		else props.onOpenChange?.(keys[0] ?? null)
	};

	const toggle = (key: string, next: boolean) => {
		if (props.multiple) {
			report(next ? [...openKeys, key] : openKeys.filter((k) => k !== key));
		} else {
			report(next ? [key] : []);
		}
	};

	<masonview display="flex" ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-accordion', props.className)} style={props.style}>
		@for (const item of props.items; key item.key) {
			<Collapsible
				className="vx-accordion-item"
				trigger={item.header}
				disabled={item.disabled}
				open={openKeys.includes(item.key)}
				onOpenChange={(next: boolean) => toggle(item.key, next)}
			>
				{item.content}
			</Collapsible>
		}
	</masonview>
}
