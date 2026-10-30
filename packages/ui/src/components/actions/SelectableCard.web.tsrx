/** @jsxImportSource @octane-xplat/jsx/dom */
import type { SelectableCardProps } from '../../props'
import { styleRecord } from '../../internal/layout/style-merge'
import { cx } from '@octane-xplat/lib'
import type { JSX } from 'octane/jsx-runtime'

export function SelectableCard(props: SelectableCardProps): JSX.Element @{
	<button
		id={props.id}
		type="button"
		role="checkbox"
		aria-checked={props.isSelected}
		aria-label={props.label}
		disabled={props.isDisabled}
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
		onClick={() => !props.isDisabled && props.onChange(!props.isSelected)}
	>
		{props.children}
	</button>
}
