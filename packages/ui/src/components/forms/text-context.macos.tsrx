import { createContext } from 'octane'
import type { Renderable } from '../../props'

/** Shared text owners compose logical runs instead of nested native views. */
export const AppKitTextContext: any = createContext(false)
export function AppKitTextScope(props: { children?: Renderable }) {
	return AppKitTextContext({ value: true, children: props.children })
}
