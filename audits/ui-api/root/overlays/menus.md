# DropdownMenu, ContextMenu, and MoreMenu

Current exports: `DropdownMenu`, `ContextMenu`, `MoreMenu`, `DropdownMenuItem`, `DropdownMenuDivider`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSubMenu`, `ContextMenuItem`, `ContextMenuDivider`, `ContextMenuCheckboxItem`, `ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuSubMenu`, `BreadcrumbMenuItem`, `BreadcrumbMenuDivider`, `BreadcrumbMenuCheckboxItem`, `BreadcrumbMenuRadioGroup`, `BreadcrumbMenuRadioItem`, `BreadcrumbMenuSubMenu`, `DropdownMenuContext`, `useDropdownMenuContext`.

**Fix: Use the discriminated MenuOption type for actual menu inputs.**

MenuOption already discriminates actions, dividers, checkboxes, and radio groups, but DropdownMenu.items uses loose MenuItem[] with optional type, value, and any callbacks. Switch the public input to the precise union so an agent cannot create a divider with checkbox state or the wrong callback value.

Proposed shape (illustrative):

```ts
type ProposedMenuEntry =
	| { type: 'action'; id: string; label: string; onPress(): void }
	| { type: 'divider' }
	| {
			type: 'checkbox'
			id: string
			label: string
			checked: boolean
			onCheckedChange(value: boolean): void
	  }
```

**Design: Normalize open state and reduce aliases for identical menu parts.**

DropdownMenu accepts isOpen and open plus two disabled spellings; MoreMenu uses isMenuOpen. Use the standard open triple. Keep DropdownMenu/ContextMenu as trigger strategies, but consider shared MenuItem parts instead of three six-part alias families. MoreMenu can be an icon-trigger preset rather than a separate state model.

Proposed shape (illustrative):

```ts
type ProposedMenuState = {
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
	disabled?: boolean
}
```

Evidence: [src/props.ts:2888](../../../../packages/ui/src/props.ts#L2888), [src/props.ts:2928](../../../../packages/ui/src/props.ts#L2928), [src/props.ts:3001](../../../../packages/ui/src/props.ts#L3001), [src/props.ts:5630](../../../../packages/ui/src/props.ts#L5630).

[Audit index](../../README.md)
