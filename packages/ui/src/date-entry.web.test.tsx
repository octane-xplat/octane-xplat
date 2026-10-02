// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import type { DateRange } from './props'
import { Calendar } from './Calendar.web.tsrx'
import { DateInput } from './DateInput.web.tsrx'
import { TimeInput } from './TimeInput.web.tsrx'
import { DateTimeInput } from './DateTimeInput.web.tsrx'
import { DateRangeInput } from './DateRangeInput.web.tsrx'

vi.stubGlobal('matchMedia', (query: string) => ({
	matches: false,
	media: query,
	onchange: null,
	addEventListener() {},
	removeEventListener() {},
	addListener() {},
	removeListener() {},
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

afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	document.body.innerHTML = ''
})

const fireInput = (el: HTMLElement, value: string) => {
	;(el as any).value = value
	act(() => el.dispatchEvent(new Event('input', { bubbles: true })))
}

const click = (el: Element) =>
	act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })))

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
		const { el } = mount(
			<Calendar
				mode="single"
				onChange={change}
				min="2026-03-10"
				max="2026-03-20"
				focusDate="2026-03-01"
			/>,
		)

		const blocked = el.querySelector('[data-date="2026-03-05"]') as HTMLButtonElement
		expect(blocked.disabled).toBe(true)
		click(blocked)
		expect(change).not.toHaveBeenCalled()
	})

	it('navigates months via ref handle', () => {
		let handle: any
		const { el } = mount(
			<Calendar
				mode="single"
				ref={(h: any) => {
					handle = h
				}}
			/>,
		)

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
		const { el } = mount(
			<DateInput value="2026-03-25" onChange={change} presentation="popover" hasClear={true} />,
		)

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
		const { el } = mount(
			<TimeInput value="10:00" onChange={change} increment={15} presentation="text-input" />,
		)

		const input = el.querySelector('input.vx-timeinput-input')! as HTMLInputElement
		act(() =>
			input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })),
		)

		expect(change).toHaveBeenCalledWith('09:45')
	})
})

describe('DateTimeInput (web)', () => {
	it('clears a combined ISO local date-time value', () => {
		const change = vi.fn()
		const { el } = mount(
			<DateTimeInput
				value="2026-03-25T14:30"
				onChange={change}
				presentation="popover"
				hasClear={true}
			/>,
		)

		click(el.querySelector('.vx-datetimeinput-clear')!)
		expect(change).toHaveBeenCalledWith(undefined)
	})
})

describe('DateRangeInput (web)', () => {
	it('commits ranges from the popover calendar', () => {
		const change = vi.fn()
		const { el } = mount(<DateRangeInput value={null} onChange={change} />)
		click(el.querySelector('.vx-daterangeinput-trigger')!)
		const days = Array.from(document.querySelectorAll('button[data-date]')).filter(
			(d) => !(d as HTMLButtonElement).disabled,
		)

		expect(days.length).toBeGreaterThan(0)
		click(days[10])
		click(days[3])
		expect(change).toHaveBeenLastCalledWith(
			expect.objectContaining({ start: expect.any(String), end: expect.any(String) }),
		)
	})

	it('commits presets', () => {
		const change = vi.fn()
		mount(
			<DateRangeInput
				value={null}
				onChange={change}
				presets={[{ label: 'Fixed', getRange: () => ({ start: '2026-01-01', end: '2026-01-31' }) }]}
			/>,
		)

		click(document.querySelector('.vx-daterangeinput-trigger')!)
		click(document.querySelector('.vx-daterangeinput-preset')!)
		expect(change).toHaveBeenCalledWith({ start: '2026-01-01', end: '2026-01-31' })
	})
})

describe('controlled date fields', () => {
	it('keeps typed text on echo and replaces it on external correction/reset', () => {
		const change = vi.fn()
		const { el, render } = mount(
			<DateInput value="2026-03-25" onChange={change} presentation="popover" />,
		)

		const input = () => el.querySelector('input')! as HTMLInputElement
		fireInput(input(), '3/26/2026')
		render(<DateInput value="2026-03-26" onChange={change} presentation="popover" />)
		expect(input().value).toBe('3/26/2026')
		render(<DateInput value="2026-04-01" onChange={change} presentation="popover" />)
		expect(input().value).toBe('April 1, 2026')
		render(<DateInput value={undefined} onChange={change} presentation="popover" />)
		expect(input().value).toBe('')
	})

	it('follows the parent after a range commit, correction, and reset', () => {
		const change = vi.fn()
		const preset: DateRange = { start: '2026-03-25', end: '2026-03-27' }
		const presets = [{ label: 'Three days', getRange: () => preset }]
		const { el, render } = mount(
			<DateRangeInput value={null} onChange={change} presets={presets} />,
		)

		click(el.querySelector('.vx-daterangeinput-trigger')!)
		click(document.querySelector('.vx-daterangeinput-preset')!)
		expect(change).toHaveBeenCalledWith(preset)
		expect(document.querySelector('.vx-daterangeinput-dialog')).toBeNull()
		// No echo means the parent rejected the change: no committed local draft.
		expect(el.querySelector('.vx-daterangeinput-text')!.textContent).toBe('Select a date range')
		render(<DateRangeInput value={preset} onChange={change} presets={presets} />)
		expect(el.querySelector('.vx-daterangeinput-text')!.textContent).toContain('March 25')
		render(
			<DateRangeInput
				value={{ start: '2026-04-01', end: '2026-04-03' }}
				onChange={change}
				presets={presets}
			/>,
		)

		expect(el.querySelector('.vx-daterangeinput-text')!.textContent).toContain('April 1')
		render(<DateRangeInput value={null} onChange={change} presets={presets} />)
		expect(el.querySelector('.vx-daterangeinput-text')!.textContent).toBe('Select a date range')
	})

	it('follows corrected time and combined date-time values', () => {
		const change = vi.fn()
		const time = mount(
			<TimeInput value="09:00" onChange={change} presentation="text-input" hourFormat="24h" />,
		)

		fireInput(time.el.querySelector('input')!, '10:30')
		time.render(
			<TimeInput value="11:00" onChange={change} presentation="text-input" hourFormat="24h" />,
		)

		expect((time.el.querySelector('input') as HTMLInputElement).value).toBe('11:00')
		const combined = mount(
			<DateTimeInput
				value="2026-03-25T09:00"
				onChange={change}
				presentation="popover"
				hourFormat="24h"
			/>,
		)

		fireInput(combined.el.querySelector('.vx-datetimeinput-dateinput')!, '3/26/2026')
		combined.render(
			<DateTimeInput
				value="2026-04-01T11:00"
				onChange={change}
				presentation="popover"
				hourFormat="24h"
			/>,
		)

		expect(
			(combined.el.querySelector('.vx-datetimeinput-dateinput') as HTMLInputElement).value,
		).toBe('April 1, 2026')

		expect(
			(combined.el.querySelector('.vx-datetimeinput-timeinput') as HTMLInputElement).value,
		).toBe('11:00')
	})

	it('releases loading when an async save rejects without retaining a local range', async () => {
		let reject!: (reason: Error) => void
		const action = vi.fn(
			() =>
				new Promise<void>((_, fail) => {
					reject = fail
				}),
		)

		const range: DateRange = { start: '2026-03-25', end: '2026-03-27' }
		const { el } = mount(
			<DateRangeInput
				value={null}
				onChange={() => {}}
				changeAction={action}
				presets={[{ label: 'Three days', getRange: () => range }]}
			/>,
		)

		click(el.querySelector('.vx-daterangeinput-trigger')!)
		click(document.querySelector('.vx-daterangeinput-preset')!)
		await act(async () => {
			await Promise.resolve()
		})

		expect(
			el.querySelector('.vx-daterangeinput')!.classList.contains('vx-daterangeinput--loading'),
		).toBe(true)

		await act(async () => {
			reject(new Error('Save rejected'))
			await Promise.resolve()
			await Promise.resolve()
		})

		expect(
			el.querySelector('.vx-daterangeinput')!.classList.contains('vx-daterangeinput--loading'),
		).toBe(false)

		expect(el.querySelector('.vx-daterangeinput-text')!.textContent).toBe('Select a date range')
	})
})

describe('range commit validation', () => {
	it('disables presets outside endpoint, ordering, and inclusive span constraints', () => {
		const change = vi.fn()
		const presets = [
			{
				label: 'Too early',
				getRange: () => ({ start: '2026-03-01', end: '2026-03-12' }) as DateRange,
			},
			{
				label: 'Too late',
				getRange: () => ({ start: '2026-03-18', end: '2026-03-25' }) as DateRange,
			},
			{
				label: 'Too short',
				getRange: () => ({ start: '2026-03-12', end: '2026-03-12' }) as DateRange,
			},
			{
				label: 'Too long',
				getRange: () => ({ start: '2026-03-11', end: '2026-03-18' }) as DateRange,
			},
			{
				label: 'Reversed',
				getRange: () => ({ start: '2026-03-15', end: '2026-03-12' }) as DateRange,
			},
			{
				label: 'Blocked endpoint',
				getRange: () => ({ start: '2026-03-14', end: '2026-03-16' }) as DateRange,
			},
			{
				label: 'Allowed',
				getRange: () => ({ start: '2026-03-12', end: '2026-03-14' }) as DateRange,
			},
		]

		const { el } = mount(
			<DateRangeInput
				value={null}
				onChange={change}
				presets={presets}
				min="2026-03-10"
				max="2026-03-20"
				minRangeSpan={2}
				maxRangeSpan={4}
				dateConstraints={[(d: Date) => d.getDate() !== 16]}
			/>,
		)

		click(el.querySelector('.vx-daterangeinput-trigger')!)
		const buttons = Array.from(
			document.querySelectorAll('.vx-daterangeinput-preset'),
		) as HTMLButtonElement[]

		expect(buttons.map((b) => b.disabled)).toEqual([true, true, true, true, true, true, false])
		for (const b of buttons.slice(0, -1)) {
			click(b)
		}

		expect(change).not.toHaveBeenCalled()
		click(buttons[6])
		expect(change).toHaveBeenCalledWith({ start: '2026-03-12', end: '2026-03-14' })
	})

	it('closes the calendar on a complete range commit', () => {
		const change = vi.fn()
		const range: DateRange = { start: '2026-03-12', end: '2026-03-14' }
		const { el } = mount(<DateRangeInput value={range} onChange={change} />)
		click(el.querySelector('.vx-daterangeinput-trigger')!)
		click(document.querySelector('button[data-date="2026-03-12"]')!)
		expect(document.querySelector('.vx-daterangeinput-dialog')).not.toBeNull()
		click(document.querySelector('button[data-date="2026-03-14"]')!)
		expect(change).toHaveBeenCalledWith(range)
		expect(document.querySelector('.vx-daterangeinput-dialog')).toBeNull()
	})
})

describe('date action settlement', () => {
	it.each(['resolve', 'throw'] as const)(
		'releases loading after actions that %s',
		async (outcome) => {
			const action = vi.fn(() => {
				if (outcome === 'throw') {
					throw new Error('Synchronous save failure')
				}

				return Promise.resolve()
			})

			const range: DateRange = { start: '2026-03-12', end: '2026-03-14' }
			const { el } = mount(
				<DateRangeInput
					value={null}
					onChange={() => {}}
					changeAction={action}
					presets={[{ label: 'Three days', getRange: () => range }]}
				/>,
			)

			click(el.querySelector('.vx-daterangeinput-trigger')!)
			click(document.querySelector('.vx-daterangeinput-preset')!)
			await act(async () => {
				await Promise.resolve()
				await Promise.resolve()
				await Promise.resolve()
			})

			expect(action).toHaveBeenCalledWith(range)
			expect(
				el.querySelector('.vx-daterangeinput')!.classList.contains('vx-daterangeinput--loading'),
			).toBe(false)

			expect(el.querySelector('.vx-daterangeinput-text')!.textContent).toBe('Select a date range')
		},
	)
})
