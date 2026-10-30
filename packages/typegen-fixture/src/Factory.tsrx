/** @jsxImportSource @octane-xplat/jsx */
export function createBadge(defaultLabel: string): (props: { label?: string }) => unknown {
	return function Badge(props: { label?: string }) @{
		<span>{props.label ?? defaultLabel}</span>
	}
}
