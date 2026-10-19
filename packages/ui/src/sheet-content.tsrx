import type { Renderable } from './props'

/** A keyed identity boundary for one panel's editing state; adds no host view. */
export function SheetContent(props: { key?: string | null; children?: Renderable }) @{
	<>{props.children}</>
}
