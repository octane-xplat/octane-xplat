/** @jsxImportSource @nativescript-community/octane */
import type { SelectableCardProps } from './props'
import { Pressable } from './Pressable'
import { cx } from './cx'

export function SelectableCard(props: SelectableCardProps) @{
	<Pressable id={props.id} className={cx('vx-card', 'vx-selectable-card', `vx-card--${props.variant ?? 'default'}`, props.elevation && `vx-card--elev-${props.elevation}`, props.isSelected && 'vx-selectable-card--selected', props.isDisabled && 'vx-card--disabled', props.className)} style={{...props.style, padding: (props.padding ?? 4) * 4, width: props.width, height: props.height, maxWidth: props.maxWidth}} disabled={props.isDisabled} onPress={() => !props.isDisabled && props.onChange(!props.isSelected)} accessibilityRole="checkbox" accessibilityLabel={props.label} accessibilityState={{selected:props.isSelected, checked:props.isSelected, disabled:props.isDisabled}}>{props.children}</Pressable>
}
