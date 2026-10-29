// Selection is UI state. Named stacks supply routing ownership to their panes.
import { useId, useState } from 'octane'
import type { TabSpec, TabsProps } from '../props'

export const routeTabKey = (tab: TabSpec | undefined, index: number) => tab?.key ?? String(index)

export function useRouteTabsSelection(props: TabsProps) {
	const [internal, setInternal] = useState(
		() => props.defaultSelectedKey ?? routeTabKey(props.tabs[0], 0),
	)

	const selectedKey =
		props.selectedKey ??
		(props.selectedIndex != null
			? routeTabKey(props.tabs[props.selectedIndex], props.selectedIndex)
			: internal)

	const panelId = useId()
	const select = (key: string) => {
		setInternal(key)
		props.onSelectionChange?.(key)
		props.onSelectedIndexChanged?.(
			props.tabs.findIndex((tab, index) => routeTabKey(tab, index) === key),
		)
	}

	return { selectedKey, panelId, select }
}
