import type { SelectableCardProps } from './props'
import { cx } from './cx'

export function SelectableCard(props: SelectableCardProps) @{
	<button id={props.id} type="button" role="checkbox" aria-checked={props.isSelected} aria-label={props.label} disabled={props.isDisabled} className={cx('vx-card', 'vx-selectable-card', `vx-card--${props.variant ?? 'default'}`, props.elevation && `vx-card--elev-${props.elevation}`, props.isSelected && 'vx-selectable-card--selected', props.isDisabled && 'vx-card--disabled', props.className)} style={{...props.style, padding:(props.padding ?? 4)*4, width:props.width, height:props.height, maxWidth:props.maxWidth}} onClick={() => !props.isDisabled && props.onChange(!props.isSelected)}>{props.children}</button>
}
