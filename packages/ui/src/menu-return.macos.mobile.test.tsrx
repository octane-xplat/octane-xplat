import { expect, it, vi } from 'vitest'
import { createAppKitMenuReturn } from './menu-return.macos'

function fixture() {
	const window: any = {}, anchor: any = { window }, next: any = { window }, previous: any = { window }
	anchor.nextValidKeyView = next; anchor.previousValidKeyView = previous
	let open = true
	const close = vi.fn(), owner = createAppKitMenuReturn({ anchor: () => anchor, open: () => open, close })
	return { owner, anchor, window, next, previous, close, accept: (value: boolean) => { open = value } }
}

it('Tab resolution uses current same-window next/previous targets and only records close intent', () => {
	const f = fixture()
	expect(f.owner.resolveTab(false)).toBe(f.next); expect(f.owner.resolveTab(true)).toBe(f.previous)
	f.owner.requestTab(f.next); expect(f.close).toHaveBeenCalledOnce()
	expect(f.owner.isOpen()).toBe(true); expect(f.owner.focusTarget()).toBe(f.next)
	f.owner.reset(); expect(f.owner.focusTarget()).toBe(f.anchor)
})

it('accepted ancestor state chooses the closest surviving return target through nested menus', () => {
	const f = fixture(), popup: any = {}, anchor: any = { window: popup }, deep: any = { window: {} }
	let childOpen = true, deepOpen = true
	const childClose = vi.fn(), deepClose = vi.fn()
	const child = createAppKitMenuReturn({ anchor: () => anchor, open: () => childOpen, close: childClose, parent: () => f.owner })
	const nested = createAppKitMenuReturn({ anchor: () => deep, open: () => deepOpen, close: deepClose, parent: () => child })
	expect(nested.resolveTab(true)).toBe(f.previous)
	nested.requestTab(f.previous)
	expect(deepClose).toHaveBeenCalledOnce(); expect(childClose).toHaveBeenCalledOnce(); expect(f.close).toHaveBeenCalledOnce()
	expect(nested.focusTarget()).toBe(deep) // Parent still accepts an open surface.
	deepOpen = false; childOpen = false
	expect(nested.focusTarget()).toBe(anchor) // Root still open; return to its submenu row.
	f.accept(false)
	expect(nested.isOpen()).toBe(false)
	expect(nested.focusTarget()).toBe(f.previous)
})

it('foreign/detached key-view candidates fall back to the anchor and stale pending targets are rejected', () => {
	const f = fixture()
	f.anchor.nextValidKeyView = { window: {} }; expect(f.owner.resolveTab(false)).toBe(f.anchor)
	f.anchor.previousValidKeyView = null; expect(f.owner.resolveTab(true)).toBe(f.anchor)
	f.owner.requestTab(f.next); f.next.window = {}; expect(f.owner.focusTarget()).toBe(f.anchor)
	f.anchor.window = null; expect(f.owner.resolveTab(false)).toBeNull()
})
