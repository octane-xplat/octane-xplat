import type { BoxProps } from './BoxProps'

export function Box<T>(props: BoxProps<T>) @{
	<div title={props.label}>{String(props.value)}</div>
}
