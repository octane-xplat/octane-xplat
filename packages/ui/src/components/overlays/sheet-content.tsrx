import type { Renderable } from '../../props'
import type { JSX } from 'octane/jsx-runtime'

/** A keyed identity boundary for one panel's editing state; adds no host view. */
export function SheetContent(props: {
	key?: string | null
	children?: Renderable
}): JSX.Element @{
	<>{props.children}</>
}
