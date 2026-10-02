/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import { Utils } from '@nativescript/core';
import { TextSlot } from './text-slot';
import type { ButtonProps } from "./props";
import { cx } from "./cx";
import { Pressable } from './Pressable';
import { ActivityIndicator } from './ActivityIndicator.tsrx';
import { Icon } from './Icon';
import { useButtonGroup } from './button-group-context';
import { sanitizeUrl } from './safe-url';

/** Self-drawn button — Pressable row with optional icon/label/end content
 *  and a loading state that swaps content for the spinner and blocks
 *  presses. Accepts the Astryx vocabulary (`label`, `variant`, `size`,
 *  `isDisabled`, `isLoading`, `icon`, `isIconOnly`, `endContent`,
 *  `elevation`, `href`, `clickAction`, `isInterruptible`); `href` opens the
 *  platform browser — touch targets have no link-preview semantics.
 *  Inside a ButtonGroup the group supplies size/disabled and a position
 *  class for the connected edge treatment. */
export function Button(props: ButtonProps) @{
	const group = useButtonGroup();
	const [actionPending, setActionPending] = useState(false);
	const disabled = !!(props.disabled || props.isDisabled || props.isLoading || props.loading || group?.isDisabled);
	const loading = !!(props.loading || props.isLoading || actionPending);
	const size = props.size ?? group?.size ?? 'md';
	const icon = typeof props.icon === 'string' ? <Icon name={props.icon} /> : props.icon;
	const children = props.children == null ? null : <TextSlot className="vx-button-label">{props.children}</TextSlot>;
	const labelEl = props.label != null ? <label className="vx-button-label" text={props.label} /> : null;
	const content = loading
		? <ActivityIndicator />
		: props.isIconOnly
			? icon ?? children ?? labelEl
			: <>{icon ?? props.leading}{children ?? labelEl}{props.endContent ?? props.trailing}</>;

	const runPress = () => {
		if (disabled || (actionPending && !props.isInterruptible)) { return; }
		if (props.href != null) {
			const url = sanitizeUrl(props.href);
			if (url != null) { Utils.openUrl(url); }
		}

		props.onPress?.();
		const action = props.clickAction?.();
		if (action && typeof (action as any).then === 'function') {
			setActionPending(true);
			Promise.resolve(action).then(() => setActionPending(false), () => setActionPending(false));
		}
	};

	<Pressable
		{...props}
		disabled={disabled}
		onPress={runPress}
		className={cx(
			'vx-button',
			`vx-button--${props.variant ?? 'secondary'}`,
			size && `vx-button--size-${size}`,
			props.elevation && props.elevation !== 'none' && `vx-button--elev-${props.elevation}`,
			props.isIconOnly && 'vx-button--icon',
			loading && 'vx-button--loading',
			disabled && 'vx-button--disabled',
			group && `vx-button--group-${group.position}`,
			props.className,
		)}
		accessibilityRole={props.accessibilityRole ?? 'button'}
		accessibilityLabel={props.accessibilityLabel ?? (props.isIconOnly ? props.label : undefined)}
	>
		{content}
	</Pressable>
}
