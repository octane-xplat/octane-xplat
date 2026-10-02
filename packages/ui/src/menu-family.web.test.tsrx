// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('./theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }))
import { DropdownMenu } from './DropdownMenu.web.tsrx'
import { ContextMenu } from './ContextMenu.web.tsrx'
import { Breadcrumb } from './Breadcrumb.web.tsrx'
import { DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuDivider, DropdownMenuSubMenu } from './MenuParts.web.tsrx'

const roots: ReturnType<typeof createRoot>[] = []
function mount(Component: any, props: any) {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	roots.push(root)
	act(() => root.render(Component, props))
	return root
}

function key(key: string, options: KeyboardEventInit = {}) {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })
	act(() => document.activeElement!.dispatchEvent(event))
	return event
}

function click(id: string) { act(() => document.getElementById(id)!.click()) }
afterEach(() => { act(() => roots.splice(0).forEach((r) => r.unmount())); document.body.replaceChildren() })
function Compound(props: any) @{
	<DropdownMenu trigger="Actions" isOpen={props.open} onOpenChange={props.close}>
		<DropdownMenuItem id="first" label="First" onSelect={props.pick} />
		<DropdownMenuDivider />
		<DropdownMenuItem id="disabled" label="Disabled" isDisabled onSelect={props.pick} />
		<DropdownMenuCheckboxItem id="check" label="Archived" value={props.checked} onValueChange={props.check} />
		<DropdownMenuRadioGroup label="Sort" value={props.value} onValueChange={props.radio}>
			<DropdownMenuRadioItem id="new" label="Newest" value="new" />
			<DropdownMenuRadioItem id="old" label="Oldest" value="old" />
		</DropdownMenuRadioGroup>
		<DropdownMenuSubMenu id="sub" label="Move">
			<DropdownMenuItem id="folder" label="Folder" onSelect={props.pick} />
			<DropdownMenuSubMenu id="deep" label="More"><DropdownMenuItem id="leaf" label="Leaf" onSelect={props.pick} /></DropdownMenuSubMenu>
		</DropdownMenuSubMenu>
	</DropdownMenu>
}

function ControlledSub(props: any) @{
	<DropdownMenu trigger="Actions" isOpen>
		<DropdownMenuSubMenu id="controlled-sub" label="More" isOpen={props.open} onOpenChange={props.change}>
			<DropdownMenuItem id="controlled-leaf" label="Leaf" />
		</DropdownMenuSubMenu>
	</DropdownMenu>
}

function Choices(props: any) @{
	<DropdownMenu trigger="Choices" isOpen onOpenChange={props.close}>
		<DropdownMenuCheckboxItem id="closing-check" label="Checked" value={false} hasCloseOnSelect onValueChange={props.check} />
		<DropdownMenuRadioGroup label="Options" defaultValue="a" hasCloseOnSelect={false} isDisabled={props.disabled} onValueChange={props.radio}>
			<DropdownMenuRadioItem id="choice-a" label="A" value="a" />
			<DropdownMenuRadioItem id="choice-b" label="B" value="b" />
		</DropdownMenuRadioGroup>
	</DropdownMenu>
}

describe('menu family contracts', () => {
	it('navigates one level, keeps disabled rows discoverable and blocks activation', () => {
		const pick = vi.fn()
		mount(Compound, { open: true, pick })
		expect(document.activeElement?.getAttribute('role')).toBe('menu')
		key('ArrowDown'); expect(document.activeElement?.id).toBe('first')
		key('ArrowDown'); expect(document.activeElement?.id).toBe('disabled')
		key('Enter'); expect(pick).not.toHaveBeenCalled()
		key('End'); expect(document.activeElement?.id).toBe('sub')
		key('Home'); expect(document.activeElement?.id).toBe('first')
		key('o'); expect(document.activeElement?.id).toBe('old')
	})

	it('opens from the trigger with keyboard focus and returns focus after accepted root dismissal', () => {
		const pick = vi.fn()
		mount(DropdownMenu, { id: 'trigger', trigger: 'Actions', items: [{ key: 'one', label: 'One', onSelect: pick }, { key: 'two', label: 'Two' }] })
		act(() => document.getElementById('trigger')!.focus())
		key('ArrowUp'); expect(document.activeElement?.id).toBe('two')
		key('Escape'); expect(document.activeElement?.id).toBe('trigger')
		key('Enter'); expect(document.activeElement?.id).toBe('one')
		key('Enter'); expect(pick).toHaveBeenCalledOnce()
		expect(document.activeElement?.id).toBe('trigger')
	})

	it('dismisses only the top submenu through its inherited outside backdrop', () => {
		const close = vi.fn()
		mount(Compound, { open: true, close })
		key('End'); key('ArrowRight')
		act(() => (Array.from(document.querySelectorAll('.vx-popover-backdrop')).at(-1) as HTMLElement).click())
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1)
		expect(close).not.toHaveBeenCalled()
		expect(document.activeElement?.id).toBe('sub')
	})

	it('keeps controlled checked/radio values with the caller and uses their close defaults', () => {
		const close = vi.fn(), check = vi.fn(), radio = vi.fn()
		const root = mount(Compound, { open: true, checked: false, value: 'new', close, check, radio })
		click('check'); expect(check).toHaveBeenCalledWith(true); expect(close).not.toHaveBeenCalled()
		expect(document.getElementById('check')?.getAttribute('aria-checked')).toBe('false')
		act(() => root.render(Compound, { open: true, checked: true, value: 'new', close, check, radio }))
		expect(document.getElementById('check')?.getAttribute('aria-checked')).toBe('true')
		click('old'); expect(radio).toHaveBeenCalledWith('old'); expect(close).toHaveBeenCalledWith(false)
		expect(document.getElementById('old')?.getAttribute('aria-checked')).toBe('false')
	})

	it('honors close overrides, uncontrolled radio ownership and group disabled state', () => {
		const close = vi.fn(), check = vi.fn(), radio = vi.fn()
		const root = mount(Choices, { close, check, radio })
		click('closing-check'); expect(check).toHaveBeenCalledWith(true); expect(close).toHaveBeenCalledWith(false)
		close.mockClear()
		click('choice-b'); expect(radio).toHaveBeenCalledWith('b'); expect(close).not.toHaveBeenCalled()
		expect(document.getElementById('choice-b')?.getAttribute('aria-checked')).toBe('true')
		click('choice-b'); expect(radio).toHaveBeenCalledTimes(1)
		act(() => root.render(Choices, { close, check, radio, disabled: true }))
		click('choice-a'); expect(radio).toHaveBeenCalledTimes(1)
		expect(document.getElementById('choice-a')?.getAttribute('aria-disabled')).toBe('true')
	})

	it('opens nested keyboard surfaces, returns to the immediate parent and inherits Escape ownership', () => {
		const close = vi.fn(), pick = vi.fn()
		mount(Compound, { open: true, close, pick })
		key('End'); key('ArrowRight')
		expect(document.activeElement?.id).toBe('folder')
		key('End'); key('ArrowRight')
		expect(document.activeElement?.id).toBe('leaf')
		key('ArrowLeft'); expect(document.activeElement?.id).toBe('deep')
		key('Escape'); expect(close).not.toHaveBeenCalled()
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1)
		key('End'); key('ArrowRight'); click('folder')
		expect(pick).toHaveBeenCalledTimes(1); expect(close).toHaveBeenCalledWith(false)
	})

	it('ignores composing and IME ArrowRight and retains controlled submenu focus until close acceptance', () => {
		mount(Compound, { open: true })
		key('End'); key('ArrowRight', { isComposing: true })
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1)
		key('ArrowRight', { keyCode: 229 })
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1)
		act(() => roots.splice(0).forEach((root) => root.unmount()))
		const change = vi.fn()
		const root = mount(ControlledSub, { open: true, change })
		key('ArrowDown')
		expect(document.activeElement?.id).toBe('controlled-leaf')
		key('ArrowLeft')
		expect(change).toHaveBeenCalledWith(false)
		expect(document.activeElement?.id).toBe('controlled-leaf')
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(2)
		key('Escape'); expect(document.querySelectorAll('[role="menu"]')).toHaveLength(2)
		act(() => root.render(ControlledSub, { open: false, change }))
		expect(document.activeElement?.id).toBe('controlled-sub')
	})

	it('preserves legacy items and ContextMenu children and supports a visible trigger', () => {
		const pick = vi.fn()
		mount(ContextMenu, { children: 'Target', trigger: 'Actions', items: [{ key: 'legacy', label: 'Legacy', onSelect: pick }] })
		act(() => (document.querySelector('[role="button"]') as HTMLElement).click())
		click('legacy'); expect(pick).toHaveBeenCalledTimes(1)
		expect(document.querySelector('[role="menu"]')).toBeNull()
	})

	it('reuses the menu for hidden breadcrumb ancestors', () => {
		const select = vi.fn()
		mount(Breadcrumb, { maxVisibleItems: 2, items: [{ label: 'Home', onSelect: select }, { label: 'Team', onSelect: select }, { label: 'Project', onSelect: select }, { label: 'Current' }] })
		act(() => (document.querySelector('[aria-label="More ancestors"]') as HTMLElement).click())
		expect(document.querySelector('[role="menu"]')?.textContent).toContain('Team')
		click('ancestor-1'); expect(select).toHaveBeenCalledTimes(1)
		expect(document.querySelector('[aria-current="page"]')?.textContent).toBe('Current')
	})
})
