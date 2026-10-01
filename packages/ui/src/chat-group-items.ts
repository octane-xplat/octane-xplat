import type { ChatComposerTriggerItem } from './props'

export interface ChatItemGroup<T extends ChatComposerTriggerItem = ChatComposerTriggerItem> {
	heading: string | null
	items: T[]
}

/** Group trigger items by `auxiliaryData.group`, preserving first-seen group
 *  order; ungrouped items trail (matches upstream groupItems default). */
export function groupChatItems<T extends ChatComposerTriggerItem>(items: T[]): ChatItemGroup<T>[] {
	const getGroup = (item: T) => {
		const aux = item.auxiliaryData as Record<string, unknown> | undefined
		const g = aux?.group
		return typeof g === 'string' && g.length > 0 ? g : null
	}
	if (!items.some((item) => getGroup(item) != null)) {
		return [{ heading: null, items }]
	}
	const order: string[] = []
	const groups = new Map<string, T[]>()
	const ungrouped: T[] = []
	for (const item of items) {
		const group = getGroup(item)
		if (group != null) {
			if (!groups.has(group)) {
				order.push(group)
				groups.set(group, [])
			}
			groups.get(group)!.push(item)
		} else {
			ungrouped.push(item)
		}
	}
	const named = order.map((heading) => ({ heading, items: groups.get(heading)! }))
	return ungrouped.length > 0 ? [...named, { heading: null, items: ungrouped }] : named
}
