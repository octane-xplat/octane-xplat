/** @jsxImportSource @xplat/macos/renderer */
import type { PowerSearchTokenProps } from './props'
import { resolveOperatorLabel, formatFilterValue, createInternalConfig } from './power-search-config'
import { Pressable } from './Pressable.macos.tsrx'
import { cx } from './cx'

type InternalTokenProps = PowerSearchTokenProps & { timezoneID?: string }

export function PowerSearchToken(props: InternalTokenProps) @{
	const value = formatFilterValue(createInternalConfig(props.config), props.operator.value, props.filter.value, props.maxLength, undefined, undefined, props.timezoneID)
	const labelText = `${props.field.label} ${resolveOperatorLabel(props.operator)}${value ? ` ${value}` : ''}`

	<flexboxlayout className="vx-power-search-token-row">
		<Pressable className={cx('vx-power-search-token', props.isDisabled && 'vx-power-search-token--disabled')} onPress={props.onPress} accessibilityRole="button" accessibilityLabel={labelText} disabled={props.isDisabled}><label className="vx-power-search-token-label" text={labelText} /></Pressable>
		{props.onRemove ? <Pressable className="vx-power-search-remove" onPress={props.onRemove} accessibilityRole="button" accessibilityLabel="Remove filter"><label text="×" /></Pressable> : null}
	</flexboxlayout>
}
