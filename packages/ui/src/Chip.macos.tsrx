/** @jsxImportSource @octane-xplat/macos-renderer */
import type { ChipProps } from "./props";
import { cx } from "./cx";
import { Pressable } from './Pressable.macos.tsrx';

/** Chip — small action/filter element with a selected state and an
 *  optional ✕ remove affordance. */
export function Chip(props: ChipProps) @{
	<Pressable
		id={props.id}
		className={cx('vx-chip', props.selected && 'vx-chip--on', props.disabled && 'vx-chip--disabled', props.className)}
		// `--on` chrome is a CSS modifier on web — inline the same values
		// (AppKit has no style layer; keep in step with .vx-chip--on).
		style={{ ...(props.selected ? { backgroundColor: '#171717', color: '#fafafa' } : {}), ...props.style }}
		disabled={props.disabled}
		onPress={props.onSelect}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityState={{ selected: props.selected, disabled: props.disabled }}
	>
		{props.children}
		{props.onRemove
			? <label className="vx-chip-remove" text="✕" style={{ marginLeft: 6, width: 12, height: 16, textAlign: 'center' }} onTap={props.disabled ? undefined : props.onRemove} />
			: null}
	</Pressable>
}
