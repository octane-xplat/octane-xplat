/** @jsxImportSource @octane-xplat/jsx/dom */
import type { BoxProps } from './BoxProps'
import type { JSX } from 'octane/jsx-runtime'

export function Box<T>(props: BoxProps<T>): JSX.Element @{
	<div title={props.label}>{String(props.value)}</div>
}
