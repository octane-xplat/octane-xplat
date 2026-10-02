import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { ListItemProps } from './props';
import { applyEscapeProps } from './escape-props';
import { applyWebProps } from './platformProps.web';
import { useListContext } from './list-context';

/** ListItem — a `List` row rendered as `<li>`: marker (context-driven) +
 *  startContent + label/description stack + endContent. `onPress`/`href`
 *  render an invisible button/anchor covering the row (one tab stop, real
 *  keyboard + activation semantics; `:focus-within` draws the ring).
 *  `delegateRef` (upstream `interactiveRef`) forwards row presses to a
 *  nested control instead — the row adds no second tab stop. */
export function ListItem(props: ListItemProps) @{
	const ctx = useListContext();
	const interactive = props.onPress != null || props.href != null;
	const rel = props.href != null
		? (props.rel ?? (props.target === '_blank' ? 'noopener noreferrer' : undefined))
		: undefined;

	const onRowClick = (e: any) => {
		if (props.isDisabled || props.delegateRef?.current == null) { return; }
		// Forward row presses to the delegated control unless the press
		// already landed on something interactive inside the row.
		const target = e.target;
		if (target?.closest?.('a,button,input,textarea,select,[role]')) { return; }
		props.delegateRef.current.click?.();
		props.delegateRef.current.focus?.();
	};

	const marker =
		ctx.listStyle === 'disc' ? <span className="vx-listmarker"><span className="vx-listmarker-dot" /></span>
		: ctx.listStyle === 'circle' ? <span className="vx-listmarker"><span className="vx-listmarker-circle" /></span>
		: ctx.listStyle === 'decimal' ? <span className="vx-listmarker vx-listmarker--num" />
		: null;

	const labelNode = typeof props.label === 'string'
		? <span className="vx-listitem-label">{props.label}</span>
		: props.label;

	const descriptionNode = props.description == null ? null
		: typeof props.description === 'string'
			? <span className="vx-listitem-desc">{props.description}</span>
			: props.description;

	const hitLabel = props.accessibilityLabel ?? (typeof props.label === 'string' ? props.label : undefined);
	const hit = props.delegateRef != null ? null
		: props.href != null
			? <a className="vx-listitem-hit" href={props.href} target={props.target} rel={rel} tabIndex={props.isDisabled ? -1 : undefined} aria-label={hitLabel} aria-disabled={props.isDisabled || undefined} onClick={props.isDisabled ? (e: any) => e.preventDefault() : undefined} />
			: props.onPress != null
				? <button type="button" className="vx-listitem-hit" onClick={props.onPress} disabled={props.isDisabled || undefined} aria-label={hitLabel} tabIndex={props.isDisabled ? -1 : undefined} />
				: null;

	const forwardedRef = useMemo(() => refList((e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<li
		id={props.id}
		ref={forwardedRef}
		className={[
			'vx-listitem',
			`vx-listitem--density-${ctx.density}`,
			ctx.listStyle !== 'none' ? 'vx-listitem--marker' : undefined,
			interactive || props.delegateRef != null ? 'vx-listitem--interactive' : undefined,
			props.isDisabled ? 'vx-listitem--disabled' : undefined,
			props.isSelected ? 'vx-listitem--selected' : undefined,
			props.className,
		]}
		style={{
			...(ctx.edgeCompensation === 'inline' ? {
				marginInlineStart: 'calc(-1 * min(var(--vx-item-inset-inline, 0px), var(--vx-container-padding-inline-start, 0px)))',
				marginInlineEnd: 'calc(-1 * min(var(--vx-item-inset-inline, 0px), var(--vx-container-padding-inline-end, 0px)))',
			} : {}),
			...props.style,
		}}
		aria-selected={props.isSelected || undefined}
		aria-disabled={props.isDisabled || undefined}
		aria-label={props.accessibilityLabel}
		aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
		onClick={props.delegateRef != null ? onRowClick : undefined}
	>
		{marker}
		{props.startContent != null ? <span className="vx-listitem-start">{props.startContent}</span> : null}
		<span className="vx-listitem-body">
			{labelNode}
			{descriptionNode}
			{props.children}
		</span>
		{props.endContent != null ? <span className="vx-listitem-end">{props.endContent}</span> : null}
		{hit}
	</li>
}
