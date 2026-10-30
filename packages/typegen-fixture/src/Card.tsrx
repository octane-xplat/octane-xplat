/** @jsxImportSource @octane-xplat/jsx/dom */
import type { JSX } from 'octane/jsx-runtime'
function CardRoot(props: { title: string }): JSX.Element @{
	<div>{props.title}</div>
}

function CardHeader(props: { text: string }): JSX.Element @{
	<span>{props.text}</span>
}

export const Card: typeof CardRoot & { Header: typeof CardHeader } = Object.assign(CardRoot, {
	Header: CardHeader,
})
