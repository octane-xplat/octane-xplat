import type { Context } from 'octane'
import { createContext, useContext, useMemo } from 'octane'
import type { LayoutGroupProps } from '../types'

export const LayoutGroupContext: Context<readonly string[]> = createContext<readonly string[]>([])

/** Namespace shared layout IDs. Commits already invalidate every registered layout host. */
export function LayoutGroup(props: LayoutGroupProps): unknown @{
	const parent = useContext(LayoutGroupContext)
	const namespace = useMemo(() => {
		const inherited = props.inherit === false ? [] : parent
		return props.id === undefined ? inherited : [...inherited, props.id]
	}, [parent, props.id, props.inherit])

	<LayoutGroupContext value={namespace}>{props.children}</LayoutGroupContext>
}
