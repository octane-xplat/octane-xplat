// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { describe, expect, it, vi } from 'vitest'
import { View } from './View.web.tsrx'
import { TextInput } from './TextInput.web.tsrx'
import { Calendar } from './Calendar.web.tsrx'
import type { CalendarHandle, TextInputHandle, ViewProps } from './props'
import type { Octane } from 'octane/jsx-runtime'

function RefFixture(props: {
	viewRef?: ViewProps['ref']
	inputRef?: Octane.Ref<TextInputHandle>
	calendarRef?: Octane.Ref<CalendarHandle>
}) @{
	<View ref={props.viewRef}>
		<TextInput ref={props.inputRef} />
		<Calendar ref={props.calendarRef} mode="single" focusDate="2026-10-01" />
	</View>
}

describe('standard component refs on web', () => {
	it('forwards object and nested array refs, replaces owners, and clears on unmount', () => {
		const container = document.createElement('div')
		const root = createRoot(container)
		const view = { current: null as HTMLElement | null }
		const input = { current: null as TextInputHandle | null }
		const calendar = { current: null as CalendarHandle | null }
		const cleanup = vi.fn()
		const callback = vi.fn(() => cleanup)
		const next = { current: null as TextInputHandle | null }
		try {
			act(() => root.render(RefFixture, {
				viewRef: view,
				inputRef: [input, [callback, undefined]],
				calendarRef: calendar,
			}))

			expect(view.current).toBe(container.firstElementChild)
			expect(input.current?.native).toBe(container.querySelector('input'))
			expect(calendar.current?.navigateTo).toBeTypeOf('function')
			expect(callback).toHaveBeenCalledExactlyOnceWith(input.current)
			act(() => root.render(RefFixture, { viewRef: view, inputRef: next, calendarRef: calendar }))
			expect(input.current).toBeNull()
			expect(next.current?.native).toBe(container.querySelector('input'))
			expect(cleanup).toHaveBeenCalledTimes(1)
			expect(callback).toHaveBeenCalledTimes(1)
		} finally {
			act(() => root.unmount())
		}

		expect(view.current).toBeNull()
		expect(next.current).toBeNull()
		expect(calendar.current).toBeNull()
	})

	it('calls ordinary callback refs with null on detach', () => {
		const container = document.createElement('div')
		const root = createRoot(container)
		const callback = vi.fn()
		act(() => root.render(RefFixture, { inputRef: callback }))
		expect(callback.mock.calls[0][0]?.focus).toBeTypeOf('function')
		act(() => root.unmount())
		expect(callback.mock.calls.at(-1)).toEqual([null])
	})
})
