/** @jsxImportSource @octane-xplat/jsx */
import type { SelectableCardProps } from './props'
import { styleRecord } from './style-merge'
import { Pressable } from './Pressable.macos.tsrx'
import { cx } from '@octane-xplat/lib'
import { TextSlot } from './text-slot'
export function SelectableCard(props: SelectableCardProps) @{
	<Pressable
		id={props.id}
		className={cx(
			'vx-card',
			'vx-selectable-card',
			`vx-card--${props.variant ?? 'default'}`,
			props.elevation && `vx-card--elev-${props.elevation}`,
			props.isSelected && 'vx-selectable-card--selected',
			props.isDisabled && 'vx-card--disabled',
			props.className,
		)}
		style={{
			...styleRecord(props.style),
			padding: (props.padding ?? 4) * 4,
			width: props.width,
			height: props.height,
			maxWidth: props.maxWidth,
		}}
		disabled={props.isDisabled}
		onPress={() => !props.isDisabled && props.onChange(!props.isSelected)}
		accessibilityRole="checkbox"
		accessibilityLabel={props.label}
		accessibilityState={{
			checked: props.isSelected,
			selected: props.isSelected,
			disabled: props.isDisabled,
		}}
	>
		<TextSlot>{props.children}</TextSlot>
	</Pressable>
}
