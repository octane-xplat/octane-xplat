// Shared row mapping for ported menu examples — upstream item data
// ({label, onClick, items?}, {type:'divider'}, {type:'section',title,items})
// → Xplat MenuOption rows.
import type { MenuOption } from '@octane-xplat/ui'

type UpstreamItem = {
	label?: string
	icon?: string
	description?: string
	onClick?: () => void
	isDisabled?: boolean
	variant?: 'default' | 'destructive'
	items?: UpstreamEntry[]
}

type UpstreamEntry =
	| UpstreamItem
	| { type: 'divider' }
	| { type: 'section'; title?: string; items: UpstreamItem[] }

export function menuItems(items: readonly UpstreamEntry[]): MenuOption[] {
	return items.map((item, i) => {
		if ('type' in item && item.type === 'divider') {
			return { type: 'separator', key: `d${i}` }
		}
		if ('type' in item && item.type === 'section') {
			return {
				type: 'section',
				key: `s${i}`,
				label: item.title ?? `Section ${i}`,
				items: menuItems(item.items),
			}
		}
		const it = item as UpstreamItem
		return {
			type: it.items ? 'submenu' : 'action',
			key: it.label ?? `i${i}`,
			label: it.label,
			icon: it.icon as any,
			description: it.description,
			isDisabled: it.isDisabled,
			variant: it.variant,
			onSelect: it.onClick,
			items: it.items ? menuItems(it.items) : undefined,
		} as MenuOption
	})
}
