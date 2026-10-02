/** @jsxImportSource @nativescript-community/octane */
import { useMemo } from 'octane'
import { Utils } from '@nativescript/core';
import type { TokenProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityState } from "./escape-props";
import { Icon } from './Icon.tsrx';
import { Pressable } from './Pressable.tsrx';

/** Token — inline entity chip. Native leaf: a chip row; `onClick`/`href`
 *  (opens the URL) make it pressable, `onRemove` adds the ✕ affordance. */
export function Token(props: TokenProps) @{
	const icon = props.icon == null
		? null
		: typeof props.icon === 'string'
			? <Icon name={props.icon} size={14} />
			: props.icon;

	const activate = () => {
		if (props.isDisabled) return;
		if (props.href != null) {
			Utils.openUrl(props.href);
		} else {
			props.onClick?.();
		}
	};

	const interactive = !props.isDisabled && (props.onClick != null || props.href != null);

	const content = <>
		{icon}
		{props.isLabelHidden ? null : <label className="vx-token-label" text={props.label} />}
		{props.endContent}
		{props.onRemove != null
			? <Pressable
				className="vx-token-remove"
				disabled={props.isDisabled}
				onPress={() => props.onRemove?.()}
				accessibilityLabel={'Remove ' + props.label}
			>
				<label text="✕" />
			</Pressable>
			: null}
	</>;

	const classes = cx(
		'vx-token',
		`vx-token--size-${props.size ?? 'md'}`,
		`vx-token--${props.color ?? 'default'}`,
		interactive && 'vx-token--interactive',
		props.isDisabled && 'vx-token--disabled',
		props.className,
	);

	const a11yState = nativeAccessibilityState({ disabled: props.isDisabled }) as any;

	if (interactive) {
		return <Pressable
			id={props.id}
			className={classes}
			style={props.style}
			disabled={props.isDisabled}
			onPress={activate}
			accessibilityLabel={props.label}
			accessibilityHint={props.description}
			accessibilityRole={props.href != null ? 'link' : 'button'}
			ios={props.ios}
			android={props.android}
			ref={props.ref}
		>
			{content}
		</Pressable>
	}

	const forwardedRef = useMemo(() => [(v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref], [props.ref, props.ios, props.android, props.web]);

	return <flexboxlayout
		ref={forwardedRef}
		id={props.id}
		className={classes}
		style={props.style}
		accessibilityLabel={props.isLabelHidden ? props.label : undefined}
		accessibilityHint={props.description}
		accessibilityState={a11yState}
	>
		{content}
	</flexboxlayout>
}
