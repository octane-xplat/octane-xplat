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

const key = (el: Element, value: string, init: KeyboardEventInit = {}) => {
	const event = new KeyboardEvent('keydown', {
		bubbles: true,
		cancelable: true,
		key: value,
		...init,
	})

	act(() => el.dispatchEvent(event))
	return event
}

const focus = (el: HTMLElement) => act(() => el.focus())
const focusedDate = () => (document.activeElement as HTMLElement)?.dataset.date

describe('date-family keyboard and locale parity', () => {
	it('moves actual focus through row edges, RTL, and weekly disabled cells', () => {
		const { el } = mount(
			<Calendar
				focusDate="2026-03-01"
				direction="rtl"
				weekStartsOn={1}
				dateConstraints={[(date) => ![12, 19].includes(date.getDate())]}
			/>,
		)

		focus(el.querySelector('button[data-date="2026-03-05"]')!)
		key(document.activeElement!, 'ArrowDown')
		expect(focusedDate()).toBe('2026-03-26')
		key(document.activeElement!, 'ArrowUp')
		expect(focusedDate()).toBe('2026-03-05')
		key(document.activeElement!, 'ArrowLeft')
		expect(focusedDate()).toBe('2026-03-06')
		key(document.activeElement!, 'Home')
		expect(focusedDate()).toBe('2026-03-02')
		key(document.activeElement!, 'End')
		expect(focusedDate()).toBe('2026-03-08')
	})

	it('keeps one enabled tab stop across two months and uses grid/button semantics', () => {
		const { el, render } = mount(
			<Calendar focusDate="2026-03-01" numberOfMonths={2} value="2026-04-15" />,
		)

		expect(el.querySelectorAll('button[data-date][tabindex="0"]')).toHaveLength(1)
		const selected = el.querySelector('button[data-date="2026-04-15"]')!
		expect(selected.getAttribute('role')).toBeNull()
		expect(selected.parentElement?.getAttribute('aria-selected')).toBe('true')
		expect(el.querySelectorAll('[role="grid"]')).toHaveLength(2)
		focus(selected as HTMLElement)
		key(selected, 'Home', { ctrlKey: true })
		expect(focusedDate()).toBe('2026-03-01')
		key(document.activeElement!, 'End', { ctrlKey: true })
		expect(focusedDate()).toBe('2026-04-30')
		render(<Calendar focusDate="2026-03-01" numberOfMonths={2} min="2026-04-01" max="2026-04-20" />)
		expect(el.querySelectorAll('button[data-date][tabindex="0"]')).toHaveLength(1)
		expect(
			(el.querySelector('button[data-date][tabindex="0"]') as HTMLButtonElement).disabled,
		).toBe(false)
	})

	it('pages actual focus across months and never focuses duplicate outside-day labels', () => {
		const { el } = mount(
			<Calendar
				defaultValue="2026-03-31"
				numberOfMonths={1}
				dateConstraints={[(date) => date.getDate() !== 30]}
			/>,
		)

		focus(el.querySelector('button[data-date="2026-03-31"]')!)
		key(document.activeElement!, 'ArrowRight')
		expect(focusedDate()).toBe('2026-04-01')
		key(document.activeElement!, 'PageUp')
		expect(focusedDate()).toBe('2026-03-01')
		key(document.activeElement!, 'PageUp')
		expect(focusedDate()).toBe('2026-02-01')
	})

	it('ignores navigation from header buttons and IME events', () => {
		const { el } = mount(<Calendar focusDate="2026-03-01" />)
		focus(el.querySelector('button[data-date="2026-03-05"]')!)
		expect(key(document.activeElement!, 'ArrowDown', { isComposing: true }).defaultPrevented).toBe(
			false,
		)

		expect(focusedDate()).toBe('2026-03-05')
		const nav = el.querySelector('.vx-calendar-nav') as HTMLElement
		focus(nav)
		expect(key(nav, 'ArrowDown').defaultPrevented).toBe(false)
		expect(document.activeElement).toBe(nav)
	})

	it('keeps range Escape local and announces translated range and selection state', () => {
		const change = vi.fn()
		const { el } = mount(
			<Calendar
				mode="range"
				focusDate="2026-03-01"
				locale="fr-FR"
				messages={{
					rangeStart: (date) => `Début : ${date}`,
					rangeCleared: 'Annulée',
					rangeSelected: (start, end) => `Du ${start} au ${end}`,
				}}
				onChange={change}
			/>,
		)

		const day = el.querySelector('button[data-date="2026-03-05"]') as HTMLElement
		click(day)
		focus(day)
		expect(day.getAttribute('aria-label')).toContain('Début')
		expect(el.querySelector('[role="status"]')?.textContent).toContain('mars')
		key(day, 'Escape')
		expect(el.querySelector('[role="status"]')?.textContent).toBe('Annulée')
		expect(change).not.toHaveBeenCalled()
		click(day)
		click(el.querySelector('button[data-date="2026-03-09"]')!)
		expect(el.querySelector('[role="status"]')?.textContent).toContain('Du ')
	})

	it('uses explicit app locale for entry, errors and calendar labels after a locale change', () => {
		const change = vi.fn()
		const { el, render } = mount(
			<DateInput
				presentation="popover"
				locale="fr-FR"
				onChange={change}
				messages={{ invalidDate: 'Date invalide' }}
			/>,
		)

		const input = el.querySelector('input')!
		fireInput(input, '04/05/2026')
		expect(change).toHaveBeenLastCalledWith('2026-05-04')
		fireInput(input, '31/02/2026')
		expect(el.querySelector('[role="alert"]')?.textContent).toBe('Date invalide')
		expect(input.getAttribute('aria-invalid')).toBe('true')
		render(
			<DateInput
				presentation="popover"
				locale="en-US"
				value="2026-03-05"
				onChange={change}
				messages={{ openCalendar: 'Show dates' }}
			/>,
		)

		expect((input as HTMLInputElement).value).toContain('March')
		expect(el.querySelector('.vx-dateinput-toggle')?.getAttribute('aria-label')).toBe('Show dates')
	})

	it.each(['date', 'time', 'datetime-date', 'datetime-time'])(
		'defers valid %s text and Enter until IME composition ends',
		(kind) => {
			const change = vi.fn()
			const { el } = mount(
				kind === 'date' ? (
					<DateInput presentation="popover" onChange={change} />
				) : kind === 'time' ? (
					<TimeInput presentation="text-input" onChange={change} />
				) : (
					<DateTimeInput presentation="popover" value="2026-03-01T10:00" onChange={change} />
				),
			)

			const input = el.querySelector(
				kind === 'datetime-time' ? '.vx-datetimeinput-timeinput' : 'input',
			) as HTMLInputElement

			act(() => input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })))
			fireInput(input, kind === 'date' || kind === 'datetime-date' ? '2026-03-05' : '14:30')
			expect(change).not.toHaveBeenCalled()
			expect(key(input, 'Enter', { isComposing: true }).defaultPrevented).toBe(false)
			expect(key(input, 'ArrowDown', { keyCode: 229 }).defaultPrevented).toBe(false)
			act(() => input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })))
			expect(change).toHaveBeenCalledTimes(1)
		},
	)

	it('navigates time options with focus retained in the input, then commits and closes', () => {
		const change = vi.fn()
		const { el } = mount(
			<DateTimeInput
				presentation="popover"
				value="2026-03-05T10:00"
				min="2026-03-05T10:00"
				max="2026-03-05T11:00"
				timeOptionInterval={15}
				onChange={change}
			/>,
		)

		const input = el.querySelector('.vx-datetimeinput-timeinput') as HTMLInputElement
		focus(input)
		expect(document.querySelectorAll('[role="option"]')).toHaveLength(5)
		key(input, 'ArrowDown')
		const active = document.getElementById(input.getAttribute('aria-activedescendant')!)!
		expect(active.textContent).toBe('10:15 AM')
		expect(document.activeElement).toBe(input)
		key(input, 'End')
		key(input, 'ArrowDown')
		key(input, 'Enter')
		expect(change).toHaveBeenLastCalledWith('2026-03-05T11:00')
		expect(input.getAttribute('aria-expanded')).toBe('false')
		expect(input.hasAttribute('aria-activedescendant')).toBe(false)
		expect(document.activeElement).toBe(input)
	})

	it('preserves typed times between options and closed-list stepping', () => {
		const change = vi.fn()
		const { el } = mount(
			<DateTimeInput
				presentation="popover"
				value="2026-03-05T10:00"
				timeIncrement={5}
				timeOptionInterval={15}
				onChange={change}
			/>,
		)

		const input = el.querySelector('.vx-datetimeinput-timeinput') as HTMLInputElement
		focus(input)
		fireInput(input, '10:07')
		key(input, 'Enter')
		expect(change).toHaveBeenLastCalledWith('2026-03-05T10:07')
		key(input, 'ArrowUp')
		expect(change).toHaveBeenLastCalledWith('2026-03-05T10:05')
		key(input, 'ArrowDown', { altKey: true })
		expect(input.getAttribute('aria-expanded')).toBe('true')
		key(input, 'Escape')
		expect(input.getAttribute('aria-expanded')).toBe('false')
	})

	it('never commits disabled typed date or time or invalid option text', () => {
		const change = vi.fn()
		const { el } = mount(
			<DateTimeInput
				presentation="popover"
				value="2026-03-05T10:00"
				min="2026-03-05T10:00"
				max="2026-03-05T11:00"
				timeOptionInterval={15}
				onChange={change}
			/>,
		)

		const date = el.querySelector('.vx-datetimeinput-dateinput')!
		fireInput(date as HTMLElement, '2026-03-04')
		key(date, 'Enter')
		expect(change).not.toHaveBeenCalled()
		const time = el.querySelector('.vx-datetimeinput-timeinput') as HTMLInputElement
		focus(time)
		fireInput(time, '25:90')
		key(time, 'Enter')
		expect(change).not.toHaveBeenCalled()
	})
})

it('keeps translated selection and clear announcements after the calendar closes', () => {
	const { el } = mount(
		<DateInput
			value="2026-03-05"
			onChange={() => {}}
			presentation="popover"
			locale="fr-FR"
			hasClear
			messages={{ selected: (date) => `Choisi : ${date}`, cleared: 'Effacé' }}
		/>,
	)
	click(el.querySelector('.vx-dateinput-toggle')!)
	click(document.querySelector('button[data-date="2026-03-09"]')!)
	expect(document.querySelector('.vx-dateinput-popover')).toBeNull()
	expect(el.querySelector('[role="status"]')?.textContent).toContain('Choisi :')
	expect(el.querySelector('[role="status"]')?.textContent).toContain('mars')
	click(el.querySelector('.vx-dateinput-clear')!)
	expect(el.querySelector('[role="status"]')?.textContent).toBe('Effacé')
})

it('repairs highlighted time options when bounds and display locale change', () => {
	const change = vi.fn()
	const { el, render } = mount(
		<DateTimeInput
			presentation="popover"
			value="2026-03-05T10:00"
			timeOptionInterval={15}
			onChange={change}
		/>,
	)
	const input = el.querySelector('.vx-datetimeinput-timeinput') as HTMLInputElement
	focus(input)
	key(input, 'End')
	render(
		<DateTimeInput
			presentation="popover"
			locale="fr-FR"
			hourFormat="24h"
			value="2026-03-05T10:00"
			min="2026-03-05T10:00"
			max="2026-03-05T11:00"
			timeOptionInterval={15}
			onChange={change}
		/>,
	)
	const active = document.getElementById(input.getAttribute('aria-activedescendant')!)!
	expect(active.textContent).toBe('10:00')
	key(input, 'End')
	key(input, 'Enter')
	expect(change).toHaveBeenLastCalledWith('2026-03-05T11:00')
})

it('has no day tab stop or focus movement when every day is disabled', () => {
	const { el } = mount(<Calendar focusDate="2026-03-01" dateConstraints={[() => false]} />)
	expect(el.querySelector('button[data-date][tabindex="0"]')).toBeNull()
	const nav = el.querySelector('.vx-calendar-nav') as HTMLElement
	focus(nav)
	key(nav, 'End')
	expect(document.activeElement).toBe(nav)
})

it('waits for the parent to accept a controlled month before moving focus', () => {
	const changeMonth = vi.fn()
	const { el, render } = mount(<Calendar focusDate="2026-03-01" onFocusDateChange={changeMonth} />)
	focus(el.querySelector('button[data-date="2026-03-31"]')!)
	key(document.activeElement!, 'ArrowRight')
	expect(changeMonth).toHaveBeenCalledWith('2026-04-01')
	expect(focusedDate()).toBe('2026-03-31')
	render(<Calendar focusDate="2026-04-01" onFocusDateChange={changeMonth} />)
	expect(focusedDate()).toBe('2026-04-01')
})

it('announces a rejected date after Enter and clears the error on external correction', () => {
	const change = vi.fn()
	const { el, render } = mount(
		<DateInput
			presentation="popover"
			value="2026-03-05"
			min="2026-03-05"
			locale="fr-FR"
			messages={{ invalidDate: 'Date refusée' }}
			onChange={change}
		/>,
	)
	const input = el.querySelector('input') as HTMLInputElement
	fireInput(input, '2026-03-04')
	key(input, 'Enter')
	expect(change).not.toHaveBeenCalled()
	expect(el.querySelector('[role="alert"]')?.textContent).toBe('Date refusée')
	expect(input.getAttribute('aria-invalid')).toBe('true')
	render(<DateInput presentation="popover" value="2026-03-06" min="2026-03-05" onChange={change} />)
	expect(input.hasAttribute('aria-invalid')).toBe(false)
})
