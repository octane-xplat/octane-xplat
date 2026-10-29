// Renderer-neutral ownership. One instance flow mounts once per owning tree.
import { createContext, useContext, useMemo } from 'octane'
const OutletFlows = createContext<ReadonlyMap<object, ReadonlySet<string>>>(new Map())
const Provider: any = OutletFlows
export function RouterOutletBoundary(props: {
	host: object
	flow: string
	base?: any
	children?: any
}): any {
	const parent = useContext(OutletFlows)
	const flows = useMemo(
		() => new Map(parent).set(props.host, new Set(parent.get(props.host)).add(props.flow)),
		[parent, props.host, props.flow],
	)

	return parent.get(props.host)?.has(props.flow) ? (
		props.base
	) : (
		<Provider value={flows}>{props.children}</Provider>
	)
}
