import type { ChipProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Pressable } from './Pressable.web.tsrx';

/** Chip — small action/filter element with a selected state and an
 *  optional ✕ remove affordance. */
export function Chip(props: ChipProps) @{
	<Pressable
		id={props.id}
		className={['vx-chip', props.selected ? 'vx-chip--on' : undefined, props.disabled ? 'vx-chip--disabled' : undefined, props.className]}
		style={props.style}
		disabled={props.disabled}
		onPress={props.onSelect}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityState={{ selected: props.selected, disabled: props.disabled }}
		ios={props.ios}
		android={props.android}
		web={props.web}
	>
		{props.children}
		{props.onRemove
			? <span className="vx-chip-remove" role="button" aria-label="Remove" onClick={(e: any) => { e.stopPropagation(); if (!props.disabled) props.onRemove?.(); }}>✕</span>
			: null}
	</Pressable>
}
