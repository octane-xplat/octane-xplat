import { useState } from 'octane';
import type { ButtonProps } from "./props";
import { applyWebProps } from './platformProps.web';
import { Pressable } from './Pressable.web.tsrx';
import { ActivityIndicator } from './ActivityIndicator.web.tsrx';
import { Icon } from './Icon.web.tsrx';
import { useButtonGroup } from './button-group-context';
import { sanitizeUrl } from './safe-url';

/** Self-drawn button — Pressable row with optional icon/label/end content
 *  and a loading state that swaps content for the spinner and blocks
 *  presses. Accepts the Astryx vocabulary (`label`, `variant`, `size`,
 *  `isDisabled`, `isLoading`, `icon`, `isIconOnly`, `endContent`,
 *  `elevation`, `tooltip`, `href`, `clickAction`, `isInterruptible`);
 *  `href` renders a real anchor so link semantics (new tab, copy link)
 *  stay intact. Inside a ButtonGroup the group supplies size/disabled and a
 *  position class for the connected edge treatment. */
export function Button(props: ButtonProps) @{
	const group = useButtonGroup();
	const [actionPending, setActionPending] = useState(false);
	const disabled = !!(props.disabled || props.isDisabled || props.isLoading || props.loading || group?.isDisabled);
	const loading = !!(props.loading || props.isLoading || actionPending);
	const size = props.size ?? group?.size ?? 'md';
	const icon = typeof props.icon === 'string' ? <Icon name={props.icon} /> : props.icon;
	const labelEl = props.label != null ? <span className="vx-button-label">{props.label}</span> : null;
	const content = loading
		? <ActivityIndicator />
		: props.isIconOnly
			? icon ?? props.children ?? labelEl
			: <>{icon ?? props.leading}{props.children ?? labelEl}{props.endContent ?? props.trailing}</>;

	const cls = [
		'vx-button',
		`vx-button--${props.variant ?? 'secondary'}`,
		size && `vx-button--size-${size}`,
		props.elevation && props.elevation !== 'none' && `vx-button--elev-${props.elevation}`,
		props.isIconOnly && 'vx-button--icon',
		loading && 'vx-button--loading',
		disabled && 'vx-button--disabled',
		group && `vx-button--group-${group.position}`,
		props.className,
	];

	const runPress = (e?: any) => {
		if (disabled || (actionPending && !props.isInterruptible)) {
			e?.preventDefault?.();
			return;
		}

		props.onPress?.();
		const action = props.clickAction?.();
		if (action && typeof (action as any).then === 'function') {
			setActionPending(true);
			Promise.resolve(action).then(() => setActionPending(false), () => setActionPending(false));
		}
	};

	@if (props.href != null) {
		<a
			id={props.id}
			data-testid={props.testID}
			className={cls}
			style={props.style}
			href={sanitizeUrl(props.href) ?? undefined}
			target={props.target}
			rel={props.target === '_blank' ? 'noreferrer' : undefined}
			title={props.tooltip}
			aria-label={props.accessibilityLabel ?? (props.isIconOnly ? props.label : undefined)}
			aria-disabled={disabled || undefined}
			tabIndex={disabled ? -1 : undefined}
			onClick={runPress}
			ref={(el: any) => applyWebProps(el, props.web)}
		>
			{content}
		</a>
	} @else {
		<Pressable
			{...props}
			disabled={disabled}
			onPress={runPress}
			className={cls}
			accessibilityRole={props.accessibilityRole ?? 'button'}
			accessibilityLabel={props.accessibilityLabel ?? (props.isIconOnly ? props.label : undefined)}
			web={{ title: props.tooltip, ...props.web }}
		>
			{content}
		</Pressable>
	}
}
