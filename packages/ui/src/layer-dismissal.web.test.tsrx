// @vitest-environment jsdom
import { act, createRoot, useRef, useEffect } from 'octane'
import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('./theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }))
import { BottomSheet } from './BottomSheet.web.tsrx'
import { Dialog } from './Dialog.web.tsrx'
import { DropdownMenu } from './DropdownMenu.web.tsrx'
import { Popover } from './Popover.web.tsrx'
import { useLayer } from './use-layer.web.tsrx'
import { useHoverCard } from './use-hover-card.web.tsrx'

const roots: ReturnType<typeof createRoot>[] = []

function mount(Component: any, props: any) {
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	roots.push(root)
	act(() => root.render(Component, props))
	return root
}

function escape(options: KeyboardEventInit = {}) {
	const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true, ...options })
	act(() => document.activeElement!.dispatchEvent(event))
	return event
}

function Nested(props: { dialog: boolean; menu: boolean; closeDialog: any; closeMenu: any; purpose?: any }) @{
	<Dialog isOpen={props.dialog} onOpenChange={props.closeDialog} purpose={props.purpose} accessibilityLabel="Outer">
		<DropdownMenu open={props.menu} onOpenChange={props.closeMenu} trigger="Menu" items={[{ key: 'one', label: 'One' }]} />
	</Dialog>
}

function Pair(props: { outer: boolean; inner: boolean; closeOuter: any; closeInner: any }) @{
	const anchor = useRef<any>(null)

	<>
		<button ref={anchor}>Anchor</button>
		<Popover open={props.outer} anchor={anchor} onDismiss={props.closeOuter}>
			<button>Outer content</button>
			<Popover open={props.inner} anchor={anchor} onDismiss={props.closeInner}><button>Inner content</button></Popover>
		</Popover>
	</>
}

function Card(props: { open: boolean; close: any; closeDialog: any; menu?: boolean; closeMenu?: any }) @{
	const card = useHoverCard({ isOpen: props.open, onHide: props.close, focusTrigger: 'none' })

	<Dialog isOpen accessibilityLabel="Outer" onOpenChange={props.closeDialog}>
		<button ref={card.ref}>Card</button>
		{card.renderHoverCard(<><button>Card content</button>{props.menu && <DropdownMenu open onOpenChange={props.closeMenu} trigger="Inner menu" items={[]} />}</>)}
	</Dialog>
}

function ManualLayer(props: { escape?: boolean; hide: any; closeDialog: any }) @{
	const layer = useLayer({ mode: 'context', get dismissOnEscape() { return props.escape }, onHide: () => props.hide() })
	useEffect(() => { layer.show() }, [])

	<Dialog isOpen accessibilityLabel="Outer" onOpenChange={props.closeDialog}>
		<button ref={layer.ref}>Anchor</button>
		{layer.render('Manual layer')}
	</Dialog>
}

afterEach(() => {
	act(() => { for (const root of roots.splice(0)) root.unmount() })
	document.body.replaceChildren()
})

describe('shared nested dismissal', () => {
	it('keeps a controlled menu as owner until its parent accepts, with live callbacks', () => {
		const closeDialog = vi.fn(), closeMenu = vi.fn(), updated = vi.fn()
		const root = mount(Nested, { dialog: true, menu: true, closeDialog, closeMenu })
		expect(escape().defaultPrevented).toBe(true)
		expect(closeMenu).toHaveBeenCalledWith(false)
		expect(closeDialog).not.toHaveBeenCalled()
		act(() => root.render(Nested, { dialog: true, menu: true, closeDialog, closeMenu: updated }))
		escape()
		expect(updated).toHaveBeenCalledTimes(1)
		expect(closeDialog).not.toHaveBeenCalled()
		act(() => root.render(Nested, { dialog: true, menu: false, closeDialog, closeMenu: updated }))
		escape()
		expect(closeDialog).toHaveBeenCalledTimes(1)
	})

	it('ranks same-commit nested portals ahead of their parent and cleans up on removal', () => {
		const closeOuter = vi.fn(), closeInner = vi.fn()
		const root = mount(Pair, { outer: true, inner: true, closeOuter, closeInner })
		escape()
		expect(closeInner).toHaveBeenCalledTimes(1)
		expect(closeOuter).not.toHaveBeenCalled()
		act(() => root.render(Pair, { outer: true, inner: false, closeOuter, closeInner }))
		escape()
		expect(closeOuter).toHaveBeenCalledTimes(1)
		act(() => root.unmount())
		expect(escape().defaultPrevented).toBe(false)
	})

	it('blocks required dialogs, composing Escape and platform cancel', () => {
		const closeDialog = vi.fn()
		const root = mount(Nested, { dialog: true, menu: false, purpose: 'required', closeDialog, closeMenu: vi.fn() })
		escape()
		expect(closeDialog).not.toHaveBeenCalled()
		act(() => root.render(Nested, { dialog: true, menu: false, purpose: 'form', closeDialog, closeMenu: vi.fn() }))
		expect(escape({ isComposing: true }).defaultPrevented).toBe(true)
		expect(escape({ keyCode: 229 }).defaultPrevented).toBe(true)
		act(() => document.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })))
		act(() => document.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true })))
		expect(closeDialog).not.toHaveBeenCalled()
		act(() => document.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })))
		escape()
		expect(closeDialog).toHaveBeenCalledTimes(1)
	})

	it('honors an editor claiming Escape', () => {
		const closeOuter = vi.fn()
		mount(Pair, { outer: true, inner: false, closeOuter, closeInner: vi.fn() })
		const button = Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Outer content')!
		button.addEventListener('keydown', event => event.preventDefault())
		act(() => button.focus())
		escape()
		expect(closeOuter).not.toHaveBeenCalled()
	})

	it('a controlled hover card requests only its own close', () => {
		const close = vi.fn(), closeDialog = vi.fn()
		mount(Card, { open: true, close, closeDialog })
		escape()
		escape()
		expect(close).toHaveBeenCalledTimes(2)
		expect(closeDialog).not.toHaveBeenCalled()
	})

	it('routes one Escape through dialog, hover card and its nested menu', () => {
		const close = vi.fn(), closeDialog = vi.fn(), closeMenu = vi.fn()
		const root = mount(Card, { open: true, menu: true, close, closeDialog, closeMenu })
		escape()
		expect(closeMenu).toHaveBeenCalledTimes(1)
		expect(close).not.toHaveBeenCalled()
		expect(closeDialog).not.toHaveBeenCalled()
		act(() => root.render(Card, { open: true, menu: false, close, closeDialog, closeMenu }))
		escape()
		expect(close).toHaveBeenCalledTimes(1)
		expect(closeDialog).not.toHaveBeenCalled()
	})

	it('nested popup ownership also wins over the existing sheet focus helper', () => {
		const closeSheet = vi.fn(), closeMenu = vi.fn()
		mount(BottomSheet, { isOpen: true, onOpenChange: closeSheet, children: <DropdownMenu open onOpenChange={closeMenu} trigger="Menu" items={[]} /> })
		escape()
		expect(closeMenu).toHaveBeenCalledTimes(1)
		expect(closeSheet).not.toHaveBeenCalled()
	})

	it('removing a lower dialog preserves focus in the surviving dialog', () => {
		const lowerTarget = document.createElement('button'), upperTarget = document.createElement('button')
		document.body.append(lowerTarget, upperTarget)
		const lowerFocus = vi.spyOn(lowerTarget, 'focus')
		const lower = mount(Dialog, { isOpen: true, accessibilityLabel: 'Lower', finalFocusRef: { current: lowerTarget }, children: <button data-autofocus>Lower focus</button> })
		const upper = mount(Dialog, { isOpen: true, accessibilityLabel: 'Upper', finalFocusRef: { current: upperTarget }, children: <button data-autofocus>Upper focus</button> })
		const current = document.activeElement
		act(() => lower.render(Dialog, { isOpen: false }))
		expect(document.activeElement).toBe(current)
		expect(lowerFocus).not.toHaveBeenCalled()
		act(() => upper.render(Dialog, { isOpen: false }))
		expect(document.activeElement).toBe(upperTarget)
	})

	it('returns accepted hover-card focus to its interaction trigger', () => {
		const close = vi.fn(), closeDialog = vi.fn()
		const root = mount(Card, { open: true, close, closeDialog })
		const content = Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Card content')!
		const trigger = Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Card')!
		act(() => content.focus())
		escape()
		expect(document.activeElement).toBe(content)
		act(() => root.render(Card, { open: false, close, closeDialog }))
		expect(document.activeElement).toBe(trigger)
		expect(closeDialog).not.toHaveBeenCalled()
	})

	it('preserves manual useLayer Escape blocking and supports an independent override', () => {
		const hide = vi.fn(), closeDialog = vi.fn()
		const root = mount(ManualLayer, { hide, closeDialog })
		escape()
		expect(hide).not.toHaveBeenCalled()
		expect(closeDialog).not.toHaveBeenCalled()
		act(() => root.render(ManualLayer, { escape: true, hide, closeDialog }))
		escape()
		expect(hide).toHaveBeenCalledTimes(1)
		expect(closeDialog).not.toHaveBeenCalled()
	})

	it('returns focus after accepted removal, without reporting programmatic close', () => {
		const trigger = document.createElement('button')
		document.body.append(trigger)
		trigger.focus()
		const closeDialog = vi.fn()
		const root = mount(Nested, { dialog: true, menu: false, closeDialog, closeMenu: vi.fn() })
		act(() => root.render(Nested, { dialog: false, menu: false, closeDialog, closeMenu: vi.fn() }))
		expect(document.activeElement).toBe(trigger)
		expect(closeDialog).not.toHaveBeenCalled()
	})
})
