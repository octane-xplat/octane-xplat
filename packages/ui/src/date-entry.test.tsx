// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { Calendar } from './Calendar.web.tsrx'
import { DateInput } from './DateInput.web.tsrx'
import { TimeInput } from './TimeInput.web.tsrx'
import { DateTimeInput } from './DateTimeInput.web.tsrx'
import { DateRangeInput } from './DateRangeInput.web.tsrx'
import { FileInput } from './FileInput.web.tsrx'

vi.stubGlobal('matchMedia', (query: string) => ({
	matches: false, media: query, onchange: null,
	addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
	dispatchEvent: () => false,
}))

const roots: any[] = []
function mount(jsx: any) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	act(() => root.render(jsx))
	return { el, root, render: (next: any) => act(() => root.render(next)) }
}

afterEach(() => { for (const root of roots.splice(0)) act(() => root.unmount()); document.body.innerHTML = '' })

const fireInput = (el: HTMLElement, value: string) => {
	(el as any).value = value
	act(() => el.dispatchEvent(new Event('input', { bubbles: true })))
}
const click = (el: Element) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })))

describe('Calendar (web)', () => {
	it('single mode emits ISO + Date', () => {
		const change = vi.fn()
		const { el } = mount(<Calendar mode="single" onChange={change} focusDate="2026-03-01" />)
		const day = el.querySelector('[data-date="2026-03-15"]')!
		click(day)
		expect(change).toHaveBeenCalledWith('2026-03-15', expect.any(Date))
	})
	it('range mode anchors, normalizes order, and commits', () => {
		const change = vi.fn()
		const { el } = mount(<Calendar mode="range" onChange={change} focusDate="2026-03-01" />)
		click(el.querySelector('[data-date="2026-03-20"]')!)
		click(el.querySelector('[data-date="2026-03-10"]')!)
		expect(change).toHaveBeenCalledWith({ start: '2026-03-10', end: '2026-03-20' })
	})
	it('blocks days outside min/max', () => {
		const change = vi.fn()
		const { el } = mount(<Calendar mode="single" onChange={change} min="2026-03-10" max="2026-03-20" focusDate="2026-03-01" />)
		const blocked = el.querySelector('[data-date="2026-03-05"]') as HTMLButtonElement
		expect(blocked.disabled).toBe(true)
		click(blocked)
		expect(change).not.toHaveBeenCalled()
	})
	it('navigates months via bind handle', () => {
		let handle: any
		const { el } = mount(<Calendar mode="single" bind={(h: any) => { handle = h }} />)
		const initial = el.querySelector('.vx-calendar-title')!.textContent
		act(() => handle.navigateTo('2026-06-15'))
		expect(el.querySelector('.vx-calendar-title')!.textContent).toContain('June')
		expect(el.querySelector('.vx-calendar-title')!.textContent).not.toBe(initial)
		expect(el.querySelector('[data-date="2026-06-15"]')).not.toBeNull()
	})
})

describe('DateInput (web)', () => {
	it('parses typed input into ISO onChange', () => {
		const change = vi.fn()
		const { el } = mount(<DateInput onChange={change} presentation="popover" />)
		const input = el.querySelector('input.vx-dateinput-input')! as HTMLInputElement
		fireInput(input, '3/25/2026')
		expect(change).toHaveBeenCalledWith('2026-03-25')
	})
	it('opens the calendar and commits picks', () => {
		const change = vi.fn()
		const { el } = mount(<DateInput onChange={change} presentation="popover" />)
		click(el.querySelector('.vx-dateinput-toggle')!)
		const days = Array.from(document.querySelectorAll('button[data-date]')) as HTMLButtonElement[]
		expect(days.length).toBeGreaterThan(0)
		const day = days.find((d) => !d.disabled)!
		click(day)
		expect(change).toHaveBeenCalledWith(day.getAttribute('data-date'))
	})
	it('clears via the clear affordance', () => {
		const change = vi.fn()
		const { el } = mount(<DateInput value="2026-03-25" onChange={change} presentation="popover" hasClear={true} />)
		click(el.querySelector('.vx-dateinput-clear')!)
		expect(change).toHaveBeenCalledWith(undefined)
	})
})

describe('TimeInput (web)', () => {
	it('parses 12h and compact input', () => {
		const change = vi.fn()
		const { el } = mount(<TimeInput onChange={change} presentation="text-input" />)
		const input = el.querySelector('input.vx-timeinput-input')! as HTMLInputElement
		fireInput(input, '2:30 PM')
		expect(change).toHaveBeenCalledWith('14:30')
		fireInput(input, '1430')
		expect(change).toHaveBeenLastCalledWith('14:30')
	})
	it('steps by increment on arrow keys', () => {
		const change = vi.fn()
		const { el } = mount(<TimeInput value="10:00" onChange={change} increment={15} presentation="text-input" />)
		const input = el.querySelector('input.vx-timeinput-input')! as HTMLInputElement
		act(() => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })))
		expect(change).toHaveBeenCalledWith('09:45')
	})
})

describe('DateTimeInput (web)', () => {
	it('clears a combined ISO local date-time value', () => {
		const change = vi.fn()
		const { el } = mount(<DateTimeInput value="2026-03-25T14:30" onChange={change} presentation="popover" hasClear={true} />)
		click(el.querySelector('.vx-datetimeinput-clear')!)
		expect(change).toHaveBeenCalledWith(undefined)
	})
})

describe('DateRangeInput (web)', () => {
	it('commits ranges from the popover calendar', () => {
		const change = vi.fn()
		const { el } = mount(<DateRangeInput value={null} onChange={change} />)
		click(el.querySelector('.vx-daterangeinput-trigger')!)
		const days = Array.from(document.querySelectorAll('button[data-date]')).filter((d) => !(d as HTMLButtonElement).disabled)
		expect(days.length).toBeGreaterThan(0)
		click(days[10])
		click(days[3])
		expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ start: expect.any(String), end: expect.any(String) }))
	})
	it('commits presets', () => {
		const change = vi.fn()
		mount(<DateRangeInput value={null} onChange={change} presets={[{ label: 'Fixed', getRange: () => ({ start: '2026-01-01', end: '2026-01-31' }) }]} />)
		click(document.querySelector('.vx-daterangeinput-trigger')!)
		click(document.querySelector('.vx-daterangeinput-preset')!)
		expect(change).toHaveBeenCalledWith({ start: '2026-01-01', end: '2026-01-31' })
	})
})

describe('FileInput (web)', () => {
	it('validates and emits FileInputFile refs', async () => {
		const change = vi.fn()
		mount(<FileInput value={null} onChange={change} isMultiple={true} accept=".txt" pick={() => Promise.resolve([
			{ name: 'ok.txt', uri: 'blob:1', size: 10 },
			{ name: 'no.exe', uri: 'blob:2', size: 10 },
		])} />)
		await act(async () => {
			document.querySelector('.vx-fileinput-trigger')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		})
		expect(change).toHaveBeenCalledWith([{ name: 'ok.txt', uri: 'blob:1', size: 10 }])
		expect(document.querySelector('.vx-field-status')?.textContent).toContain('no.exe')
	})
	it('replaces a single value even when the list length stays one', async () => {
		const change = vi.fn()
		mount(<FileInput value={{ name: 'old.txt', uri: 'blob:old' }} onChange={change} pick={() => Promise.resolve({ name: 'new.txt', uri: 'blob:new' })} />)
		await act(async () => {
			document.querySelector('.vx-fileinput-trigger')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		})
		expect(change).toHaveBeenCalledWith({ name: 'new.txt', uri: 'blob:new' })
	})
	it('retains the current file when a replacement fails validation', async () => {
		const change = vi.fn()
		mount(<FileInput value={{ name: 'old.txt', uri: 'blob:old' }} onChange={change} accept=".txt" pick={() => Promise.resolve({ name: 'new.exe', uri: 'blob:new' })} />)
		await act(async () => {
			document.querySelector('.vx-fileinput-trigger')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		})
		expect(change).not.toHaveBeenCalled()
		expect(document.querySelector('.vx-field-status')?.textContent).toContain('new.exe')
	})
})
