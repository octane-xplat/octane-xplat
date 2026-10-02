import { useMemo, useRef } from 'octane';
import { refList } from './ref-list'
import type { TokenProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon.web.tsrx';

/** Token — inline entity chip. Plain `<span>` by default; `onClick` renders
 *  an inner button hit-surface (real button semantics, :focus-within ring on
 *  the chip); `href` renders an `<a>`; `href` + `onRemove` keeps them
 *  siblings (a <button> inside an <a> is invalid HTML) and delegates clicks
 *  on the rest of the chip to the link, including ⌘/Ctrl-click new-tab. */
export function Token(props: TokenProps) @{
	const rootRef = useRef<HTMLElement | null>(null);
	const linkRef = useRef<HTMLAnchorElement | null>(null);

	const icon = props.icon == null
		? null
		: typeof props.icon === 'string'
			? <Icon name={props.icon} size={14} />
			: props.icon;

	const removeButton = props.onRemove != null && !props.isDisabled
		? <button
			type="button"
			className="vx-token-remove"
			aria-label={`Remove ${props.label}`}
			onClick={(e: any) => { e.stopPropagation(); props.onRemove?.(); }}
		>{'✕'}</button>
		: null;

	const labelEl = <span className={['vx-token-label', props.isLabelHidden ? 'vx-sr-only' : undefined]}>{props.label}</span>;

	const classes = [
		'vx-token',
		`vx-token--size-${props.size ?? 'md'}`,
		`vx-token--${props.color ?? 'default'}`,
		(props.onClick || props.href) ? 'vx-token--interactive' : undefined,
		props.isDisabled ? 'vx-token--disabled' : undefined,
		props.className,
	];

	const sharedProps = {
		'aria-label': props.isLabelHidden ? props.label : undefined,
		'aria-description': props.description,
	};

	// Activate the inner link for clicks on the rest of the chip, preserving
	// ⌘/Ctrl/middle-click "open in new tab" through the real anchor.
	const delegateToLink = (e: any) => {
		if (props.isDisabled) return;
		const target = e.target as HTMLElement;
		if (target.closest('button, a')) return;
		if (e.metaKey || e.ctrlKey || e.button === 1) {
			window.open(props.href, '_blank', 'noreferrer');
		} else {
			linkRef.current?.click();
		}
	};

	const forwardedRef = useMemo(() => refList((el: any) => { if (el) { applyEscapeProps(el, props); } rootRef.current = el; }, props.ref), [props.ref, props.ios, props.android, props.web]);

	if (props.href != null) {
		if (props.onRemove == null) {
			return <a
				ref={forwardedRef}
				id={props.id}
				href={props.isDisabled ? undefined : props.href}
				className={classes}
				style={props.style}
				aria-disabled={props.isDisabled || undefined}
				onClick={props.isDisabled ? (e: any) => e.preventDefault() : undefined}
				{...sharedProps}
			>
				{icon}
				{labelEl}
				{props.endContent}
			</a>
		}

		return <span
			ref={forwardedRef}
			id={props.id}
			className={classes}
			style={props.style}
			onClick={delegateToLink}
			onMouseUp={(e: any) => { if (e.button === 1) { e.preventDefault(); delegateToLink(e); } }}
			{...sharedProps}
		>
			{icon}
			<a
				ref={(el: any) => { linkRef.current = el; }}
				href={props.isDisabled ? undefined : props.href}
				className="vx-token-hit"
				aria-disabled={props.isDisabled || undefined}
				onClick={props.isDisabled ? (e: any) => e.preventDefault() : undefined}
			>
				{labelEl}
			</a>
			{props.endContent}
			{removeButton}
		</span>
	}

	if (props.onClick != null) {
		const delegateToButton = (e: any) => {
			const target = e.target as HTMLElement;
			if (target.closest('button, a')) return;
			props.onClick?.();
		};

		return <span
			ref={forwardedRef}
			id={props.id}
			className={classes}
			style={props.style}
			onClick={props.isDisabled ? undefined : delegateToButton}
			{...sharedProps}
		>
			{icon}
			<button
				type="button"
				className="vx-token-hit"
				disabled={props.isDisabled || undefined}
				onClick={props.isDisabled ? undefined : () => props.onClick?.()}
			>
				{labelEl}
			</button>
			{props.endContent}
			{removeButton}
		</span>
	}

	return <span
		ref={forwardedRef}
		id={props.id}
		className={classes}
		style={props.style}
		{...sharedProps}
	>
		{icon}
		{labelEl}
		{props.endContent}
		{removeButton}
	</span>
}
