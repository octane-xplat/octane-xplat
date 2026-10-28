/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { DropdownMenu } from './DropdownMenu.macos.tsrx'
import { ContextMenu } from './ContextMenu.macos.tsrx'
import { MenuSurface } from './MenuSurface.macos.tsrx'
import { DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSubMenu, DropdownMenuLink } from './MenuParts.macos.tsrx'
import { ButtonGroupProvider } from './button-group-context'

// Inline surfaces exercise source ownership only, not NSPopover/native input.
vi.mock('./Popover.macos.tsrx', () => ({ Popover: (props: any) => props.open ? <masonview>{props.children}</masonview> : null }))
function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	render(props)
	return { root, render, all, byID: (id: string) => all().find((node) => node.props?.id === id) }
}
function lists(env: ReturnType<typeof mount>) {
	return env.all().filter((node) => String(node.props?.className).split(' ').includes('vx-menu-list'))
}

it('disabled action/checkbox/radio hosts remove native activation and reenable on the retained rows', () => {
	const action = vi.fn(), check = vi.fn(), radio = vi.fn(), close = vi.fn()
	function Rows(props: any) {
		return <MenuSurface closeMenu={close}>
			<DropdownMenuItem id="action" label="Archive" isDisabled={props.disabled} onSelect={action} hasCloseOnSelect={false} />
			<DropdownMenuCheckboxItem id="check" label="Pinned" value={false} isDisabled={props.disabled} onValueChange={check} />
			<DropdownMenuRadioGroup value={props.sort} isDisabled={props.disabled} onValueChange={radio} hasCloseOnSelect={false}>
				<DropdownMenuRadioItem id="radio" label="Newest" value="newest" />
			</DropdownMenuRadioGroup>
		</MenuSurface>
	}
	const env = mount(Rows, { disabled: true, sort: 'oldest' })
	try {
		const hosts = ['action', 'check', 'radio'].map(env.byID)
		for (const host of hosts) {
			expect(host.props.disabled).toBe(true)
			expect(host.props.onTap).toBeUndefined()
			expect(host.props.accessibilityState.disabled).toBe(true)
		}
		expect(String(hosts[2].props.className)).toContain('vx-menu-item--disabled')
		env.render({ disabled: false, sort: 'oldest' })
		for (const [index, id] of ['action', 'check', 'radio'].entries()) {
			expect(env.byID(id)).toBe(hosts[index]); env.byID(id).props.onTap()
		}
		expect(action).toHaveBeenCalledOnce(); expect(check).toHaveBeenCalledWith(true)
		expect(radio).toHaveBeenCalledWith('newest'); expect(close).not.toHaveBeenCalled()
		expect(env.byID('radio').props.accessibilityState.checked).toBe(false) // Parent remains authoritative.
		env.render({ disabled: false, sort: 'newest' })
		expect(env.byID('radio').props.accessibilityState.checked).toBe(true)
	} finally { env.root.unmount() }
})

it('dropdown button refs and IDs reach the same native trigger and caller ID overrides the nested button ID', () => {
	const first = vi.fn(), second = { current: null as any }
	const env = mount(DropdownMenu, { button: { id: 'button-id', label: 'Actions', ref: first } })
	try {
		const host = env.byID('button-id')
		expect(first).toHaveBeenCalledWith(host)
		env.render({ id: 'menu-id', button: { id: 'button-id', label: 'Actions', ref: second } })
		expect(env.byID('menu-id')).toBe(host)
		expect(first).toHaveBeenLastCalledWith(null)
		expect(second.current).toBe(host)
		env.root.unmount(); expect(second.current).toBeNull()
	} finally { env.root.unmount() }
})

it('controlled dropdowns suppress open surfaces for own, button or inherited group disablement', async () => {
	const changes = vi.fn()
	function Grouped(props: any) {
		return <ButtonGroupProvider value={{ position: 'only', isDisabled: props.group }}>
			<DropdownMenu id="menu" isOpen isDisabled={props.own} button={{ label: 'Actions', isDisabled: props.button }} onOpenChange={changes}>
				<DropdownMenuItem label="Archive" />
			</DropdownMenu>
		</ButtonGroupProvider>
	}
	const env = mount(Grouped, {})
	try {
		expect(lists(env)).toHaveLength(1)
		for (const flag of ['own', 'button', 'group']) {
			changes.mockClear(); env.render({ [flag]: true })
			expect(lists(env)).toHaveLength(0)
			expect(env.byID('menu').props.accessibilityState.expanded).toBe(false)
			expect(env.byID('menu').props.onTap).toBeUndefined()
			await vi.waitFor(() => expect(changes).toHaveBeenCalledWith(false))
			env.render({}); expect(lists(env)).toHaveLength(1) // Controlled parent still requests open.
		}
	} finally { env.root.unmount() }
})

it('disabled controlled submenu/context surfaces hide immediately and request close', async () => {
	const submenu = vi.fn(), context = vi.fn()
	function Menus(props: any) {
		return <>
			<MenuSurface closeMenu={() => {}}>
				<DropdownMenuSubMenu id="sub" label="More" isOpen isDisabled={props.disabled} onOpenChange={submenu}>
					<DropdownMenuItem label="Nested action" />
				</DropdownMenuSubMenu>
			</MenuSurface>
			<ContextMenu id="context" isOpen isDisabled={props.disabled} onOpenChange={context}
				menu={<DropdownMenuItem label="Context action" />}><label text="Item" /></ContextMenu>
		</>
	}
	const env = mount(Menus, {})
	try {
		expect(lists(env)).toHaveLength(3)
		expect(env.byID('sub').props.accessibilityState.expanded).toBe(true)
		env.render({ disabled: true })
		expect(lists(env)).toHaveLength(1)
		expect(env.byID('sub').props.onTap).toBeUndefined()
		expect(env.byID('sub').props.accessibilityState.expanded).toBe(false)
		expect(env.byID('context').props.onLongPress).toBeUndefined()
		await vi.waitFor(() => { expect(submenu).toHaveBeenCalledWith(false); expect(context).toHaveBeenCalledWith(false) })
	} finally { env.root.unmount() }
})

it('all actionable row kinds forward destructive tone and remove it on retained hosts', () => {
	function Rows(props: any) {
		return <MenuSurface closeMenu={() => {}}>
			<DropdownMenuItem id="action" label="Archive" variant={props.variant} />
			<DropdownMenuCheckboxItem id="check" label="Pinned" variant={props.variant} value={false} />
			<DropdownMenuRadioGroup value="newest"><DropdownMenuRadioItem id="radio" label="Newest" value="newest" variant={props.variant} /></DropdownMenuRadioGroup>
			<DropdownMenuLink id="link" label="Help" href="https://example.test/help" variant={props.variant} />
			<DropdownMenuSubMenu id="sub" label="More" variant={props.variant} />
		</MenuSurface>
	}
	const env = mount(Rows, { variant: 'destructive' })
	try {
		const ids = ['action', 'check', 'radio', 'link', 'sub'], hosts = ids.map(env.byID)
		for (const host of hosts) expect(String(host.props.className)).toContain('vx-menu-item--destructive')
		env.render({})
		for (const [index, id] of ids.entries()) {
			expect(env.byID(id)).toBe(hosts[index])
			expect(String(hosts[index].props.className)).not.toContain('vx-menu-item--destructive')
		}
	} finally { env.root.unmount() }
})
