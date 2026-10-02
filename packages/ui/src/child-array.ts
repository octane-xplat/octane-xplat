import { Children } from 'octane'

/** Normalize supported JSX children through their owning renderer. */
export function toChildArray(children: any): any[] {
	return Children.toArray(children)
}

/** Preserve each child's key when placing it inside a wrapper host. */
export function mapChildren(children: any, render: (child: any, index: number) => any): any {
	return Children.map(children, render)
}
