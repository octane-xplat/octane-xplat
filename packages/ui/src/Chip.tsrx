/** @jsxImportSource @nativescript-community/octane */
import type { ChipProps } from "./props";
import { cx } from "./cx";
import { Pressable } from './Pressable.tsrx';

/** Chip — small action/filter element with a selected state and an
 *  optional ✕ remove affordance. */
export function Chip(props: ChipProps) @{
	<Pressable
		id={props.id}
		className={cx('vx-chip', props.selected && 'vx-chip--on', props.disabled && 'vx-chip--disabled', props.className)}
		style={props.style}
		disabled={props.disabled}
		onPress={props.onSelect}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityState={{ selected: props.selected, disabled: props.disabled }}
		ios={props.ios}
		android={props.android}
	>
		{props.children}
		{props.onRemove
			? <label className="vx-chip-remove" text="✕" onTap={props.disabled ? undefined : props.onRemove} />
			: null}
	</Pressable>
}
