/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { DropdownMenu } from './DropdownMenu.macos.tsrx'
import { ContextMenu } from './ContextMenu.macos.tsrx'
import { MenuSurface } from './MenuSurface.macos.tsrx'
import { DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSubMenu, DropdownMenuLink } from './MenuParts.macos.tsrx'
import { ButtonGroupProvider } from './button-group-context'
import { TextInput } from './text-controls.macos.tsrx'
import { Button } from './Button.macos.tsrx'

// Inline surfaces exercise source ownership only, not NSPopover/native input.
const popup = vi.hoisted(() => ({ current: null as any, byAnchor: new Map<object, any>() }))
vi.mock('./Popover.macos.tsrx', () => ({ Popover: (props: any) => { popup.current = props; popup.byAnchor.set(props.anchor, props); return props.open ? <masonview>{props.children}</masonview> : null } }))
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


function nativeMenuFixture() {
	const excluded = new Set<object>(), retained = new Set<object>(), observers = new Map<object, (event: any) => void>()
	vi.stubGlobal('__xplatAppKit', { keyboardEventsSupported: true,
		suppressTabStop(view: object) { excluded.add(view); return () => excluded.delete(view) },
		retainFocusTarget(view: object) { retained.add(view); return () => retained.delete(view) },
	})
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(name, _owner, _queue, notify) {
			const token = {}
			if (name === ((globalThis as any).NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification')) observers.set(token, notify)
			return token
		},
		removeObserver(token: object) { observers.delete(token) },
	} })
	const window = () => ({ firstResponder: null as any, recalculateKeyViewLoop() {},
		makeFirstResponder(view: any) { if (view?.window !== this) return false; this.firstResponder = view; return true } })
	const hydrate = (node: any, owner: any) => {
		node.window = owner
		node.subviews = { get count() { return node.children?.length ?? 0 }, objectAtIndex: (index: number) => node.children[index] }
		node.bounds = {}; node.scrollRectToVisible = vi.fn()
		node.isAccessibilityEnabled = () => !node.props?.accessibilityState?.disabled
		for (const child of node.children ?? []) { child.superview = node; hydrate(child, owner) }
	}
	const key = (surface: any, name: string, extra = {}) => {
		const event: any = { key: name, code: '', altKey: false, ctrlKey: false, metaKey: false, shiftKey: false,
			repeat: false, isComposing: false, defaultPrevented: false, stopped: false,
			preventDefault() { this.defaultPrevented = true }, stopPropagation() { this.stopped = true }, ...extra }
		surface.props.onKeyDown(event); return event
	}
	return { excluded, retained, observers, window, hydrate, key }
}

it('menu surface wires current manual focus/activation, preserves nested editors and releases native ownership', async () => {
	const f = nativeMenuFixture(), owner = f.window(), initial = vi.fn(), updated = vi.fn(), check = vi.fn(), close = vi.fn()
	function Rows(props: any) {
		return <MenuSurface closeMenu={close} initialFocus="first">
			<DropdownMenuItem id="alpha" label="Alpha" hasCloseOnSelect={false} endContent={<TextInput id="menu-editor" />} />
			<DropdownMenuCheckboxItem id="beta" label={props.label ?? 'Beta'} value={false} onValueChange={check} />
			<DropdownMenuItem id="blocked" label="Blocked" isDisabled />
			<DropdownMenuItem id="gamma" label="Gamma" onSelect={props.select} isDisabled={props.disabled} hasCloseOnSelect={false} />
		</MenuSurface>
	}
	const env = mount(Rows, { select: initial })
	try {
		const surface = lists(env)[0]; f.hydrate(surface, owner)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(f.observers.size).toBe(1); expect(owner.firstResponder).toBe(env.byID('alpha')) })
		expect(f.retained.has(surface)).toBe(true)
		expect(f.key(surface, 'ArrowDown').defaultPrevented).toBe(true)
		expect(owner.firstResponder).toBe(env.byID('beta')); expect(check).not.toHaveBeenCalled()
		f.key(surface, 'Enter'); expect(check).toHaveBeenCalledWith(true)
		f.key(surface, 'End'); expect(owner.firstResponder).toBe(env.byID('gamma'))
		const cachedPress = env.byID('gamma').props.onTap
		env.render({ select: updated }); f.hydrate(surface, owner)
		f.key(surface, 'Enter'); expect(updated).toHaveBeenCalledOnce(); expect(initial).not.toHaveBeenCalled()
		env.render({ select: updated, disabled: true, label: 'Banana' }); f.hydrate(surface, owner)
		cachedPress(); expect(updated).toHaveBeenCalledOnce()
		f.key(surface, 'Home'); f.key(surface, 'b'); expect(owner.firstResponder).toBe(env.byID('beta'))
		for (const notify of f.observers.values()) notify({ object: owner })
		expect(f.excluded.has(env.byID('gamma'))).toBe(false)
		owner.firstResponder = env.byID('menu-editor')
		expect(f.key(surface, 'Home').defaultPrevented).toBe(false)
		expect(f.key(surface, 'Enter').defaultPrevented).toBe(false)
		expect(owner.firstResponder).toBe(env.byID('menu-editor'))
		const cachedKeys = { props: { onKeyDown: surface.props.onKeyDown } }
		env.root.unmount(); cachedPress(); expect(updated).toHaveBeenCalledOnce()
		expect(f.key(cachedKeys, 'Enter').defaultPrevented).toBe(false)
		expect(f.excluded.size).toBe(0); expect(f.retained.size).toBe(0)
		await vi.waitFor(() => expect(f.observers.size).toBe(0))
		expect(close).not.toHaveBeenCalled()
	} finally { env.root.unmount(); vi.unstubAllGlobals() }
})

it('submenu keys stay in their popup registry and controlled close does not restore before acceptance', async () => {
	const f = nativeMenuFixture(), main = f.window(), child = f.window(), changes = vi.fn(), close = vi.fn(), picked = vi.fn()
	function Rows(props: any) {
		return <MenuSurface closeMenu={close} initialFocus="first">
			<DropdownMenuItem id="alpha" label="Alpha" />
			<DropdownMenuSubMenu id="sub" label="More" isOpen={props.open} onOpenChange={changes}>
				<DropdownMenuItem id="nested" label="Nested" onSelect={picked} hasCloseOnSelect={false} />
			</DropdownMenuSubMenu>
		</MenuSurface>
	}
	const env = mount(Rows, { open: false })
	try {
		let surfaces = lists(env); f.hydrate(surfaces[0], main)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(f.observers.size).toBe(1); expect(main.firstResponder).toBe(env.byID('alpha')) })
		f.key(surfaces[0], 'End'); expect(main.firstResponder).toBe(env.byID('sub'))
		f.key(surfaces[0], 'ArrowRight'); expect(changes).toHaveBeenLastCalledWith(true)
		expect(lists(env)).toHaveLength(1)
		env.render({ open: true }); surfaces = lists(env); f.hydrate(surfaces[0], main); f.hydrate(surfaces[1], child)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(f.observers.size).toBe(2); expect(child.firstResponder).toBe(env.byID('nested')) })
		expect(popup.current.finalFocusRef.current).toBe(env.byID('sub')) // Ref intent only; Popover is mocked.
		f.key(surfaces[1], 'Enter'); expect(picked).toHaveBeenCalledOnce()
		f.key(surfaces[1], 'ArrowLeft'); expect(changes).toHaveBeenLastCalledWith(false)
		expect(close).not.toHaveBeenCalled(); expect(lists(env)).toHaveLength(2)
		expect(child.firstResponder).toBe(env.byID('nested'))
		const cached = { props: { onKeyDown: surfaces[1].props.onKeyDown } }, press = env.byID('nested').props.onTap
		env.render({ open: false }); expect(lists(env)).toHaveLength(1)
		press(); expect(picked).toHaveBeenCalledOnce()
		expect(f.key(cached, 'Enter').defaultPrevented).toBe(false)
		await vi.waitFor(() => expect(f.observers.size).toBe(1))
	} finally {
		env.root.unmount(); expect(f.excluded.size).toBe(0); expect(f.retained.size).toBe(0)
		expect(f.observers.size).toBe(0); vi.unstubAllGlobals()
	}
})

function triggerKeysFixture() {
	const f = nativeMenuFixture(), subscriptions = new Map<object, Set<any>>()
	let registrations = 0, releases = 0
	;(globalThis as any).__xplatAppKit.observeViewKeys = (view: object, handlers: any) => {
		let owned = subscriptions.get(view)
		if (!owned) { owned = new Set(); subscriptions.set(view, owned) }
		owned.add(handlers); registrations++
		return () => { owned.delete(handlers); if (!owned.size) subscriptions.delete(view); releases++ }
	}
	const key = (view: any, name: string, extra = {}) => {
		const event: any = { key: name, code: '', target: view, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false,
			isComposing: false, repeat: false, defaultPrevented: false, stopped: false,
			preventDefault() { this.defaultPrevented = true }, stopPropagation() { this.stopped = true }, ...extra }
		for (const handlers of subscriptions.get(view) ?? []) handlers.onKeyDown(event)
		flushUniversalSync(() => {}); return event
	}
	return { ...f, subscriptions, triggerKey: key, get registrations() { return registrations }, get releases() { return releases } }
}

it('closed dropdown trigger arrows request first/last focus on the existing Button host', async () => {
	const f = triggerKeysFixture(), main = f.window(), panel = f.window(), changes = vi.fn(), ref = vi.fn()
	const props = { id: 'menu', button: { label: 'Actions', ref }, onOpenChange: changes,
		items: [{ type: 'action', key: 'alpha', label: 'Alpha' }, { type: 'action', key: 'gamma', label: 'Gamma' }] }
	const env = mount(DropdownMenu, props)
	try {
		const trigger = env.byID('menu'); f.hydrate(trigger, main); main.firstResponder = trigger
		expect(ref).toHaveBeenCalledWith(trigger)
		expect(f.subscriptions.has(trigger)).toBe(true); expect(f.registrations).toBe(1)
		const up = f.triggerKey(trigger, 'ArrowUp'); expect(up.defaultPrevented).toBe(true); expect(up.stopped).toBe(true)
		expect(changes).toHaveBeenCalledWith(true)
		let surface = lists(env)[0]; f.hydrate(surface, panel)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(f.observers.size).toBe(1); expect(panel.firstResponder).toBe(env.byID('gamma')) })
		f.key(surface, 'Tab'); flushUniversalSync(() => {}); expect(lists(env)).toHaveLength(0)
		expect(env.byID('menu')).toBe(trigger)
		f.triggerKey(trigger, 'ArrowDown'); surface = lists(env)[0]; f.hydrate(surface, panel)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(panel.firstResponder).toBe(env.byID('alpha')) })
		expect(env.byID('menu')).toBe(trigger); expect(f.registrations).toBe(1)
	} finally {
		env.root.unmount(); expect(f.subscriptions.size).toBe(0); expect(f.releases).toBe(1)
		expect(f.observers.size).toBe(0); vi.unstubAllGlobals()
	}
})

it('controlled trigger arrows preserve pending edge intent and current guards, ignore descendants and clean cached callbacks', async () => {
	const f = triggerKeysFixture(), main = f.window(), panel = f.window(), changes = vi.fn()
	const base = { id: 'menu', isOpen: false, onOpenChange: changes, button: { label: 'Actions', endContent: <TextInput id="trigger-editor" /> },
		items: [{ type: 'action', key: 'alpha', label: 'Alpha' }, { type: 'action', key: 'gamma', label: 'Gamma' }] }
	const env = mount(DropdownMenu, base)
	try {
		const trigger = env.byID('menu'); f.hydrate(trigger, main); main.firstResponder = trigger
		const cached = [...f.subscriptions.get(trigger)!][0].onKeyDown
		for (const flag of ['isComposing', 'altKey', 'ctrlKey', 'metaKey', 'shiftKey', 'defaultPrevented']) {
			const event = f.triggerKey(trigger, 'ArrowDown', { [flag]: true }); expect(event.stopped).toBe(false)
		}
		expect(f.triggerKey(trigger, 'ArrowDown', { target: env.byID('trigger-editor') }).defaultPrevented).toBe(false)
		expect(changes).not.toHaveBeenCalled()
		f.triggerKey(trigger, 'ArrowUp'); expect(changes).toHaveBeenLastCalledWith(true); expect(lists(env)).toHaveLength(0)
		env.render({ ...base, isOpen: true }); f.hydrate(lists(env)[0], panel)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(panel.firstResponder).toBe(env.byID('gamma')) })
		changes.mockClear()
		for (const patch of [{ isDisabled: true }, { button: { ...base.button, isDisabled: true } }]) {
			env.render({ ...base, ...patch }); changes.mockClear()
			expect(f.triggerKey(trigger, 'ArrowDown').defaultPrevented).toBe(false)
			expect(changes).not.toHaveBeenCalled()
		}
		env.root.unmount()
		const event: any = { target: trigger, key: 'ArrowDown', preventDefault: vi.fn(), stopPropagation: vi.fn() }
		cached(event); expect(event.preventDefault).not.toHaveBeenCalled(); expect(changes).not.toHaveBeenCalled()
		expect(f.subscriptions.size).toBe(0)
	} finally { env.root.unmount(); vi.unstubAllGlobals() }
})


function popupFor(id: string) {
	return [...popup.byAnchor.values()].find((props) => props.anchor?.current?.props?.id === id)
}

it('owned dropdown Tab/Shift-Tab records same-window return intent without restoring before controlled closure', async () => {
	const f = nativeMenuFixture(), main = f.window(), panel = f.window(), changes = vi.fn()
	const props = { id: 'menu', isOpen: true, onOpenChange: changes, button: { label: 'Actions' }, items: [{ type: 'action', key: 'alpha', label: 'Alpha' }] }
	const env = mount(DropdownMenu, props)
	try {
		const trigger = env.byID('menu'), next = { window: main }, previous = { window: main }
		f.hydrate(trigger, main); trigger.nextValidKeyView = next; trigger.previousValidKeyView = previous
		const surface = lists(env)[0]; f.hydrate(surface, panel)
		const restore = vi.spyOn(main, 'makeFirstResponder')
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(panel.firstResponder).toBe(env.byID('alpha')) })
		const owner = popupFor('menu')
		expect(f.key(surface, 'Tab').defaultPrevented).toBe(true)
		expect(changes).toHaveBeenCalledWith(false); expect(lists(env)).toHaveLength(1)
		expect(owner.finalFocusRef.current).toBe(next); expect(restore).not.toHaveBeenCalled()
		expect(f.key(surface, 'Tab', { shiftKey: true }).stopped).toBe(true)
		expect(owner.finalFocusRef.current).toBe(previous)
		env.render({ ...props, isOpen: false }); expect(lists(env)).toHaveLength(0)
		expect(owner.finalFocusRef.current).toBe(previous) // Intent only; the actual Popover is mocked.
		expect(restore).not.toHaveBeenCalled()
	} finally { env.root.unmount(); vi.unstubAllGlobals() }
})

it('nested Tab requests the whole menu chain and return refs follow accepted ancestor visibility', async () => {
	const f = nativeMenuFixture(), main = f.window(), parentWindow = f.window(), childWindow = f.window()
	const rootClose = vi.fn(), subClose = vi.fn()
	function Menus(props: any) {
		return <DropdownMenu id="menu" isOpen={props.root} onOpenChange={rootClose} button={{ label: 'Actions' }}>
			<DropdownMenuSubMenu id="sub" label="More" isOpen={props.sub} onOpenChange={subClose}>
				<DropdownMenuItem id="nested" label="Nested" />
			</DropdownMenuSubMenu>
		</DropdownMenu>
	}
	const env = mount(Menus, { root: true, sub: true })
	try {
		const trigger = env.byID('menu'), next = { window: main }
		f.hydrate(trigger, main); trigger.nextValidKeyView = next
		const surfaces = lists(env); f.hydrate(surfaces[0], parentWindow); f.hydrate(surfaces[1], childWindow)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(f.observers.size).toBe(2); expect(childWindow.firstResponder).toBe(env.byID('nested')) })
		const outer = popupFor('menu'), inner = popupFor('sub'), sub = env.byID('sub')
		expect(f.key(surfaces[1], 'Tab').defaultPrevented).toBe(true)
		expect(rootClose).toHaveBeenCalledWith(false); expect(subClose).toHaveBeenCalledWith(false)
		expect(lists(env)).toHaveLength(2)
		expect(outer.finalFocusRef.current).toBe(next)
		expect(inner.finalFocusRef.current).toBe(sub)
		env.render({ root: true, sub: false }); expect(lists(env)).toHaveLength(1)
		expect(inner.finalFocusRef.current).toBe(sub)
		env.render({ root: false, sub: false }); expect(lists(env)).toHaveLength(0)
		expect(inner.finalFocusRef.current).toBe(next)
		expect(outer.finalFocusRef.current).toBe(next)
	} finally { env.root.unmount(); vi.unstubAllGlobals() }
})

it.each([{ key: 'F10', shiftKey: true }, { key: 'ContextMenu', shiftKey: false }])('ContextMenu $key opens from owned content and records controlled Tab return through its invoker', async ({ key, shiftKey }) => {
	const f = nativeMenuFixture(), main = f.window(), panel = f.window(), changes = vi.fn()
	const base = { id: 'context', isOpen: false, label: 'Item actions', onOpenChange: changes,
		children: <TextInput id="context-input" />, menu: <DropdownMenuItem id="context-action" label="Archive" /> }
	const env = mount(ContextMenu, base)
	try {
		const host = env.byID('context'); f.hydrate(host, main)
		expect(host.props.accessibilityLabel).toBe('Item actions')
		const field = env.byID('context-input'), next = { window: main }; field.nextValidKeyView = next
		main.firstResponder = field
		expect(f.key(host, key, { target: field, shiftKey }).stopped).toBe(true)
		expect(changes).toHaveBeenLastCalledWith(true); expect(lists(env)).toHaveLength(0)
		env.render({ ...base, isOpen: true }); f.hydrate(lists(env)[0], panel)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(panel.firstResponder).toBe(env.byID('context-action')) })
		const owner = popupFor('context'); expect(owner.finalFocusRef.current).toBe(field)
		expect(f.key(lists(env)[0], 'Tab').defaultPrevented).toBe(true)
		expect(changes).toHaveBeenLastCalledWith(false); expect(lists(env)).toHaveLength(1)
		expect(owner.finalFocusRef.current).toBe(next)
		env.render(base); expect(lists(env)).toHaveLength(0); expect(owner.finalFocusRef.current).toBe(next)
	} finally { env.root.unmount(); vi.unstubAllGlobals() }
})

it('visible context triggers keep primitive content and provide ordinary/Tab return without replacing the wrapper', async () => {
	const f = nativeMenuFixture(), main = f.window(), panel = f.window(), changes = vi.fn()
	const props = { id: 'context', label: 'Item actions', trigger: 'Actions', onOpenChange: changes,
		menu: <DropdownMenuItem id="context-action" label="Archive" /> }
	const env = mount(ContextMenu, props)
	try {
		const host = env.byID('context'); f.hydrate(host, main)
		const trigger = env.all().find((node) => String(node.props?.className).split(' ').includes('vx-contextmenu-trigger'))
		const previous = { window: main }; trigger.previousValidKeyView = previous
		expect(env.all().some((node) => node.type === 'label' && node.props?.text === 'Actions')).toBe(true)
		trigger.props.onTap(); flushUniversalSync(() => {}); f.hydrate(lists(env)[0], panel)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(panel.firstResponder).toBe(env.byID('context-action')) })
		expect(popupFor('context').finalFocusRef.current).toBe(trigger)
		expect(f.key(lists(env)[0], 'Tab', { shiftKey: true }).stopped).toBe(true)
		flushUniversalSync(() => {}); expect(lists(env)).toHaveLength(0)
		expect(env.byID('context')).toBe(host)
		expect(popupFor('context').finalFocusRef.current).toBe(previous)
		const cached = trigger.props.onTap; env.render({ ...props, isDisabled: true }); changes.mockClear()
		cached(); expect(changes).not.toHaveBeenCalled()
	} finally { env.root.unmount(); vi.unstubAllGlobals() }
})

it.each([{ key: 'F10', shiftKey: true }, { key: 'ContextMenu', shiftKey: false }])('context $key guards reject stale blocked/detached/foreign/prevented/composing/modified events; originless long press retains Tab fallback', async ({ key, shiftKey }) => {
	const f = nativeMenuFixture(), main = f.window(), panel = f.window(), changes = vi.fn()
	const base = { id: 'context', isOpen: false, onOpenChange: changes, children: <TextInput id="context-input" />,
		menu: <DropdownMenuItem id="context-action" label="Archive" /> }
	const env = mount(ContextMenu, base)
	try {
		const host = env.byID('context'); f.hydrate(host, main)
		const field = env.byID('context-input'), cached = { props: { onKeyDown: host.props.onKeyDown } }
		for (const extra of [{ isComposing: true }, { altKey: true }, { ctrlKey: true }, { metaKey: true }, { defaultPrevented: true }, { shiftKey: !shiftKey }, { target: { window: main } }]) {
			expect(f.key(host, key, { target: field, shiftKey, ...extra }).stopped).toBe(false)
		}
		env.render({ ...base, isDisabled: true }); expect(f.key(cached, key, { target: field, shiftKey }).defaultPrevented).toBe(false)
		expect(changes).not.toHaveBeenCalled()
		env.render(base); host.props.onLongPress(); flushUniversalSync(() => {}); expect(changes).toHaveBeenLastCalledWith(true)
		env.render({ ...base, isOpen: true }); f.hydrate(lists(env)[0], panel)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(panel.firstResponder).toBe(env.byID('context-action')) })
		expect(f.key(lists(env)[0], 'Tab').defaultPrevented).toBe(false)
		expect(changes).toHaveBeenLastCalledWith(false)
		env.root.unmount(); changes.mockClear()
		expect(f.key(cached, key, { target: field, shiftKey }).defaultPrevented).toBe(false)
		expect(changes).not.toHaveBeenCalled()
	} finally { env.root.unmount(); vi.unstubAllGlobals() }
})

function contextPointerFixture() {
	const f = nativeMenuFixture(), owners = new Map<object, (target: any) => boolean>()
	let registered = 0, released = 0
	Object.assign((globalThis as any).__xplatAppKit, { contextMenuEventsSupported: true,
		observeContextMenu(view: object, handler: (target: any) => boolean) {
			owners.set(view, handler); registered++
			return () => { owners.delete(view); released++ }
		},
	})
	return { ...f, owners, get registered() { return registered }, get released() { return released } }
}

it('context pointer intent opens from decorative content without directly invoking its primary action and retains the focus host', async () => {
	const f = contextPointerFixture(), main = f.window(), panel = f.window(), changes = vi.fn(), primary = vi.fn()
	const base = { id: 'context', isOpen: false, onOpenChange: changes,
		children: <Button id="context-item" label="Item" clickAction={primary} />, menu: <DropdownMenuItem id="context-action" label="Archive" /> }
	const env = mount(ContextMenu, base)
	try {
		const host = env.byID('context'); f.hydrate(host, main)
		const button = env.byID('context-item'); button.acceptsFirstResponder = () => true
		const label = env.all().find((node) => node.type === 'label' && node.props?.text === 'Item')
		expect(f.owners.has(host)).toBe(true); expect(f.registered).toBe(1)
		expect(f.owners.get(host)!(label)).toBe(true); flushUniversalSync(() => {})
		expect(changes).toHaveBeenLastCalledWith(true); expect(primary).not.toHaveBeenCalled() // Callback wiring only; no native mouse arbitration proof.
		expect(lists(env)).toHaveLength(0)
		env.render({ ...base, isOpen: true }); f.hydrate(lists(env)[0], panel)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(panel.firstResponder).toBe(env.byID('context-action')) })
		expect(popupFor('context').finalFocusRef.current).toBe(button)
	} finally { env.root.unmount(); expect(f.owners.size).toBe(0); expect(f.released).toBe(1); vi.unstubAllGlobals() }
})


it('pointer context scope falls back to the visible invoker and rejects stale disabled/foreign/detached callbacks', async () => {
	const f = contextPointerFixture(), main = f.window(), panel = f.window(), changes = vi.fn()
	const base = { id: 'context', trigger: 'Actions', onOpenChange: changes, children: <label id="context-text" text="Plain content" />,
		menu: <DropdownMenuItem id="context-action" label="Archive" /> }
	const env = mount(ContextMenu, base)
	try {
		const host = env.byID('context'); f.hydrate(host, main)
		const handler = f.owners.get(host)!, trigger = env.all().find((node) => String(node.props?.className).split(' ').includes('vx-contextmenu-trigger'))
		expect(handler({ window: main, superview: null })).toBe(false); expect(changes).not.toHaveBeenCalled()
		expect(handler(env.byID('context-text'))).toBe(true); flushUniversalSync(() => {}); f.hydrate(lists(env)[0], panel)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(panel.firstResponder).toBe(env.byID('context-action')) })
		expect(popupFor('context').finalFocusRef.current).toBe(trigger)
		env.render({ ...base, isDisabled: true }); changes.mockClear()
		expect(handler(env.byID('context-text'))).toBe(false); expect(changes).not.toHaveBeenCalled()
		env.root.unmount(); expect(handler(host)).toBe(false)
		expect(f.owners.size).toBe(0)
	} finally { env.root.unmount(); vi.unstubAllGlobals() }
})


it('AppKit menu links forward their current text label and clear it for non-text content', () => {
	function Links(props: any) {
		return <MenuSurface closeMenu={() => {}}><DropdownMenuLink id="named-link" label={props.label} href="https://example.test/help" /></MenuSurface>
	}
	const env = mount(Links, { label: 'Help' })
	try {
		const host = env.byID('named-link')
		expect(host.props.accessibilityRole).toBe('menuitem')
		expect(host.props.accessibilityLabel).toBe('Help')
		env.render({ label: 'Documentation' }); expect(env.byID('named-link')).toBe(host)
		expect(host.props.accessibilityLabel).toBe('Documentation')
		env.render({ label: <label text="Rich label" /> }); expect(host.props.accessibilityLabel).toBeUndefined()
	} finally { env.root.unmount() }
})
