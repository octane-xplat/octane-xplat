/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('../../theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }))
import { TextInput } from '../../components/forms/TextInput.web.tsrx'
import { Switch } from '../../components/forms/Switch.web.tsrx'
import { Checkbox } from '../../components/forms/Checkbox.web.tsrx'
import { RadioGroup } from '../../components/forms/RadioGroup.web.tsrx'
import { Overlay } from '../../components/overlays/Overlay.web.tsrx'
import { Drawer } from '../../components/overlays/Drawer.web.tsrx'
import { Popover } from '../../components/overlays/Popover.web.tsrx'
import { BottomSheet, BottomSheetSwitcher } from '../../components/overlays/BottomSheet.web.tsrx'
import { Dialog } from '../../components/overlays/Dialog.web.tsrx'
import { AlertDialog } from '../../components/overlays/AlertDialog.web.tsrx'

const roots: ReturnType<typeof createRoot>[] = []

function mount(Component: any, props: any) {
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	roots.push(root)
	act(() => root.render(Component, props))
	return container
}

const click = (host: Element) =>
	act(() => host.dispatchEvent(new MouseEvent('click', { bubbles: true })))

const type = (input: HTMLInputElement, value: string) =>
	act(() => {
		input.value = value
		input.dispatchEvent(new Event('input', { bubbles: true }))
	})

afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	document.body.innerHTML = ''
})

describe('text inputs', () => {
	it('seeds defaultValue, keeps user edits internally, and reports the new string', () => {
		const change = vi.fn()
		mount(TextInput, { defaultValue: 'seed', onChange: change, placeholder: 'Name' })
		const input = document.querySelector('input.vx-input') as HTMLInputElement
		expect(input.value).toBe('seed')
		type(input, 'seed-x')
		expect(change).toHaveBeenLastCalledWith('seed-x')
		expect(input.value).toBe('seed-x')
	})

	it('controlled value wins over defaultValue', () => {
		mount(TextInput, { value: 'owned', defaultValue: 'ignored' })
		expect((document.querySelector('input.vx-input') as HTMLInputElement).value).toBe('owned')
	})

	it('uncontrolled clear empties the field and reports an empty string', () => {
		const change = vi.fn()
		const cleared = vi.fn()
		mount(TextInput, { defaultValue: 'seed', hasClear: true, onChange: change, onClear: cleared })
		click(document.querySelector('.vx-input-clear')!)
		expect(change).toHaveBeenLastCalledWith('')
		expect(cleared).toHaveBeenCalled()
		expect((document.querySelector('input.vx-input') as HTMLInputElement).value).toBe('')
	})
})

describe('boolean inputs', () => {
	it('Switch seeds defaultValue and toggles internally', () => {
		const change = vi.fn()
		mount(Switch, { defaultValue: true, onChange: change })
		const host = document.querySelector('input[role="switch"]') as HTMLInputElement
		expect(host.checked).toBe(true)
		click(host)
		expect(change).toHaveBeenLastCalledWith(false)
		expect(host.checked).toBe(false)
	})

	it('Switch controlled checked wins and stays caller-owned', () => {
		const change = vi.fn()
		mount(Switch, { value: true, defaultValue: false, onChange: change })
		const host = document.querySelector('input[role="switch"]') as HTMLInputElement
		expect(host.checked).toBe(true)
		click(host)
		expect(change).toHaveBeenLastCalledWith(false)
		expect(host.checked).toBe(true)
	})

	it('Checkbox seeds defaultValue and toggles internally', () => {
		const change = vi.fn()
		mount(Checkbox, { defaultValue: true, onChange: change })
		const host = document.querySelector('input[type="checkbox"]') as HTMLInputElement
		expect(host.checked).toBe(true)
		click(host)
		expect(change).toHaveBeenLastCalledWith(false)
		expect(host.checked).toBe(false)
	})

	it('Checkbox indeterminate resolves to checked on toggle', () => {
		const change = vi.fn()
		mount(Checkbox, { value: 'indeterminate', onChange: change })
		const host = document.querySelector('input[type="checkbox"]') as HTMLInputElement
		expect(host.indeterminate).toBe(true)
		click(host)
		expect(change).toHaveBeenLastCalledWith(true)
	})
})

describe('choices', () => {
	it('RadioGroup seeds defaultValue and selects internally', () => {
		const change = vi.fn()
		const options = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' },
		]

		mount(RadioGroup, { defaultValue: 'b', options, onValueChange: change })
		const rows = document.querySelectorAll('.vx-radio-row')
		expect(rows[1].getAttribute('aria-checked')).toBe('true')
		click(rows[0])
		expect(change).toHaveBeenLastCalledWith('a')
		expect(document.querySelectorAll('.vx-radio-row')[0].getAttribute('aria-checked')).toBe('true')
	})

	it('RadioGroup controlled value wins over defaultValue', () => {
		const change = vi.fn()
		const options = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' },
		]

		mount(RadioGroup, { value: 'b', defaultValue: 'a', options, onValueChange: change })
		const rows = document.querySelectorAll('.vx-radio-row')
		expect(rows[1].getAttribute('aria-checked')).toBe('true')
		click(rows[0])
		expect(change).toHaveBeenLastCalledWith('a')
		expect(rows[0].getAttribute('aria-checked')).toBe('false')
	})
})

describe('overlays', () => {
	it('Overlay seeds defaultOpen and closes itself on shade tap', () => {
		const dismiss = vi.fn()
		mount(Overlay, { defaultOpen: true, shadeCover: true, onDismiss: dismiss, children: 'Panel' })
		expect(document.querySelector('.vx-overlay-content')).not.toBeNull()
		click(document.querySelector('.vx-overlay-shade')!)
		expect(dismiss).toHaveBeenCalled()
		expect(document.querySelector('.vx-overlay-content')).toBeNull()
	})

	it('Overlay controlled open wins over defaultOpen and stays open after shade tap', () => {
		const dismiss = vi.fn()
		mount(Overlay, {
			open: true,
			defaultOpen: false,
			shadeCover: true,
			onDismiss: dismiss,
			children: 'Panel',
		})

		click(document.querySelector('.vx-overlay-shade')!)
		expect(dismiss).toHaveBeenCalled()
		expect(document.querySelector('.vx-overlay-content')).not.toBeNull()
	})

	it('Drawer seeds defaultOpen and closes itself on backdrop tap', () => {
		const dismiss = vi.fn()
		mount(Drawer, { defaultOpen: true, onDismiss: dismiss, main: 'Main', drawer: 'Drawer' })
		expect(document.querySelector('.vx-drawer-panel')).not.toBeNull()
		click(document.querySelector('.vx-drawer-backdrop')!)
		expect(dismiss).toHaveBeenCalled()
		expect(document.querySelector('.vx-drawer-panel')).toBeNull()
	})

	it('Popover seeds defaultOpen with an anchor and dismisses on outside tap', () => {
		const dismiss = vi.fn()
		const anchorEl = document.createElement('button')
		document.body.append(anchorEl)
		mount(Popover, {
			anchor: { current: anchorEl },
			defaultOpen: true,
			onDismiss: dismiss,
			children: 'Inside',
		})

		expect(document.querySelector('.vx-popover')).not.toBeNull()
		click(document.querySelector('.vx-popover-backdrop')!)
		expect(dismiss).toHaveBeenCalled()
		expect(document.querySelector('.vx-popover')).toBeNull()
	})

	it('BottomSheet seeds defaultOpen; scrim tap reports onOpenChange(false) and closes', () => {
		const change = vi.fn()
		mount(BottomSheet, { defaultOpen: true, onOpenChange: change, children: 'Sheet' })
		expect(document.querySelector('.vx-bottom-sheet-layer')).not.toBeNull()
		click(document.querySelector('.vx-sheet-backdrop')!)
		expect(change).toHaveBeenLastCalledWith(false)
		expect(document.querySelector('.vx-bottom-sheet-layer')).toBeNull()
	})

	it('BottomSheet controlled isOpen stays open after scrim tap', () => {
		const change = vi.fn()
		mount(BottomSheet, { isOpen: true, onOpenChange: change, children: 'Sheet' })
		click(document.querySelector('.vx-sheet-backdrop')!)
		expect(change).toHaveBeenLastCalledWith(false)
		expect(document.querySelector('.vx-bottom-sheet-layer')).not.toBeNull()
	})

	it('BottomSheetSwitcher seeds defaultActiveSheet; scrim tap reports null and closes', () => {
		const change = vi.fn()
		mount(BottomSheetSwitcher, {
			defaultActiveSheet: 'one',
			onActiveSheetChange: change,
			children: (
				<BottomSheet sheetId="one">
					<div data-sheet="one">One</div>
				</BottomSheet>
			),
		})

		expect(document.querySelector('[data-sheet="one"]')).not.toBeNull()
		click(document.querySelector('.vx-sheet-backdrop')!)
		expect(change).toHaveBeenLastCalledWith(null)
		expect(document.querySelector('.vx-bottom-sheet-layer')).toBeNull()
	})

	it('Dialog seeds defaultOpen; Escape reports onOpenChange(false) and closes', () => {
		const change = vi.fn()
		mount(Dialog, {
			defaultOpen: true,
			onOpenChange: change,
			accessibilityLabel: 'Test dialog',
			children: <button>Body</button>,
		})

		expect(document.querySelector('.vx-dialog')).not.toBeNull()
		act(() =>
			document.activeElement!.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
			),
		)

		expect(change).toHaveBeenLastCalledWith(false)
		expect(document.querySelector('.vx-dialog')).toBeNull()
	})

	it('AlertDialog seeds defaultOpen; Cancel reports onOpenChange(false) and closes', () => {
		const change = vi.fn()
		mount(AlertDialog, { defaultOpen: true, onOpenChange: change, title: 'Delete item?' })
		const cancel = [...document.querySelectorAll('.vx-alertdialog-actions .vx-button')].find(
			(b) => b.textContent === 'Cancel',
		)!

		click(cancel)
		expect(change).toHaveBeenLastCalledWith(false)
		expect(document.querySelector('.vx-dialog')).toBeNull()
	})
})
