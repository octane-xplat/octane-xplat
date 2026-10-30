/** @jsxImportSource @octane-xplat/jsx/dom */
import type { JSX } from 'octane/jsx-runtime'
export default function Badge(props: {
	label: string
	tone?: 'quiet' | 'loud'
}): JSX.Element @{
	<span title={props.tone}>{props.label}</span>
}
