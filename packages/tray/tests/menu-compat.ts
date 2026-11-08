// Type-level contract: tray menu definitions double as @octane-xplat/ui
// MenuOption data (DropdownMenu/ContextMenu). Typecheck-only — no runtime code.
import type { MenuOption } from '@octane-xplat/ui'

import type {
	TrayActionItem,
	TrayCheckboxItem,
	TrayMenuItem,
	TrayRadioGroupItem,
	TraySectionItem,
	TraySeparatorItem,
	TraySubmenuItem,
} from '../src/types'

type IsAssignable<A, B> = A extends B ? true : false
type Expect<T extends true> = T

// Every variant is assignable to MenuOption as declared.
export const actionIsMenuOption: Expect<IsAssignable<TrayActionItem, MenuOption>> = true
export const checkboxIsMenuOption: Expect<IsAssignable<TrayCheckboxItem, MenuOption>> = true
export const radioGroupIsMenuOption: Expect<IsAssignable<TrayRadioGroupItem, MenuOption>> = true
export const submenuIsMenuOption: Expect<IsAssignable<TraySubmenuItem, MenuOption>> = true
export const sectionIsMenuOption: Expect<IsAssignable<TraySectionItem, MenuOption>> = true
export const separatorIsMenuOption: Expect<IsAssignable<TraySeparatorItem, MenuOption>> = true

// A nested tree (submenu and section containing a radio-group) is assignable.
declare const nested: readonly [
	TraySubmenuItem & { items: [TrayRadioGroupItem] },
	TraySectionItem & { items: [TraySubmenuItem & { items: [TrayRadioGroupItem] }] },
]
const nestedTree: readonly MenuOption[] = nested

// A literal menu definition satisfies both APIs unchanged — the same object
// literal is a valid TrayMenuItem[] and a valid MenuOption[].
const sharedMenu = [
	{ type: 'action', key: 'open', label: 'Open', onSelect: () => {} },
	{
		type: 'checkbox',
		key: 'sound',
		label: 'Sound',
		value: true,
		onValueChange: (_v: boolean) => {},
	},
	{
		type: 'radio-group',
		key: 'mode',
		label: 'Mode',
		value: 'auto',
		items: [
			{ key: 'auto', label: 'Auto' },
			{ key: 'manual', label: 'Manual', value: 'manual' },
		],
		onValueChange: (_v: string) => {},
	},
	{
		type: 'submenu',
		key: 'recent',
		label: 'Recent',
		items: [{ type: 'action', key: 'r1', label: 'Doc 1' }],
	},
	{ type: 'section', key: 'group', label: 'Group', items: [{ type: 'separator', key: 's1' }] },
	{ type: 'separator', key: 's2' },
] satisfies readonly TrayMenuItem[]

const forTray: readonly TrayMenuItem[] = sharedMenu
const forMenu: MenuOption[] = sharedMenu

export { nestedTree, forTray, forMenu }
