import type { PowerSearchTokenProps } from './props'
import { resolveOperatorLabel, formatFilterValue, createInternalConfig } from './power-search-config'
import { Button } from './Button.web.tsrx'

type InternalTokenProps = PowerSearchTokenProps & { timezoneID?: string }

export function PowerSearchToken(props: InternalTokenProps) @{
	const value = formatFilterValue(createInternalConfig(props.config), props.operator.value, props.filter.value, props.maxLength, undefined, undefined, props.timezoneID)
	const label = `${props.field.label} ${resolveOperatorLabel(props.operator)}${value ? ` ${value}` : ''}`

	<span className="vx-power-search-token-row">
		<Button label={label} variant="secondary" onPress={props.onPress} isDisabled={props.isDisabled} className="vx-power-search-token" />
		{props.onRemove ? <button type="button" className="vx-power-search-remove" aria-label="Remove filter" onClick={props.onRemove}>×</button> : null}
	</span>
}
