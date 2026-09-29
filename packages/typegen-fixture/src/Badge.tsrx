export default function Badge(props: { label: string; tone?: 'quiet' | 'loud' }) @{
	<span title={props.tone}>{props.label}</span>
}
