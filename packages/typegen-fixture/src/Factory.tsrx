export function createBadge(defaultLabel: string) {
	return function Badge(props: { label?: string }) @{
		<span>{props.label ?? defaultLabel}</span>
	}
}
