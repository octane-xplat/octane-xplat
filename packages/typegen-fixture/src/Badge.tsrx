/** @jsxImportSource @octane-xplat/jsx/dom */
export default function Badge(props: { label: string; tone?: 'quiet' | 'loud' }) @{
	<span title={props.tone}>{props.label}</span>
}
