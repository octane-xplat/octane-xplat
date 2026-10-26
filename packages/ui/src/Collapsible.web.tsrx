import { useState, useContext } from 'octane';
import { CollapsibleGroupContext, CollapsibleGroupProvider } from './collapsible-context';
import type { CollapsibleProps, CollapsibleGroupProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Pressable } from './Pressable.web.tsrx';

/** Self-drawn collapsible — `trigger` toggles `children` between shown and
 *  hidden (unmounted). Controlled via `open`/`onOpenChange`, uncontrolled
 *  via `defaultOpen`. The trigger reports aria-expanded. */
export function Collapsible(props: CollapsibleProps) @{
	const group = useContext(CollapsibleGroupContext);
	const [internal, setInternal] = useState(props.defaultOpen ?? false);
	const controlled = props.open !== undefined;
	const grouped = group != null && props.value != null;
	const open = grouped ? group.isOpen(props.value!) : controlled ? props.open : internal;

	const toggle = () => {
		if (props.disabled) return;
		if (grouped) {
			group.toggle(props.value!);
			return;
		}
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

/** CollapsibleGroup — coordinates `Collapsible` children by `value`
 *  (Astryx). `type="single"` opens one at a time; `"multiple"` toggles each
 *  independently. `hasDividers` paints hairlines between rows. */
export function CollapsibleGroup(props: CollapsibleGroupProps) @{
	const [internal, setInternal] = useState<string[]>(() => {
		const dv = props.defaultValue;
		return dv == null ? [] : Array.isArray(dv) ? [...dv] : [dv];
	});
	const controlled = props.value !== undefined;
	const openKeys: string[] = controlled
		? Array.isArray(props.value) ? props.value : props.value != null ? [props.value] : []
		: internal;
	const multiple = props.type === 'multiple';

	const report = (next: string[]) => {
		if (!controlled) setInternal(next);
		props.onChange?.(multiple ? next : next[0] ?? '');
	};
	const ctx = {
		isOpen: (v: string) => openKeys.includes(v),
		toggle: (v: string) => {
			const isOpen = openKeys.includes(v);
			report(multiple ? (isOpen ? openKeys.filter((k) => k !== v) : [...openKeys, v]) : isOpen ? [] : [v]);
		},
	};

	<CollapsibleGroupProvider value={ctx}>
		<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-collapsible-group', props.hasDividers && 'vx-collapsible-group--divided', props.className]} style={props.style}>
			{props.children}
		</div>
	</CollapsibleGroupProvider>
}
