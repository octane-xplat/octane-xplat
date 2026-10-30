import type { NativeKeyboardEvent } from '@octane-xplat/jsx/intrinsics'
import type { CalendarMonthGrid } from './calendar-core'
import type { DateRange, ISODateString } from '../../props'
import { monthStart } from './calendar-core'
import { plainDateFromISO, plainDateToISO, type PlainDate } from './datetime'
import { calendarKeyTarget } from './date-keyboard'
import { createAppKitChoiceFocus } from './choice-focus.macos'
import { appKitHost } from '../../internal/platform/host-bridge'
import type { NSView, NSWindow } from '@octane-xplat/platform/macos'

export interface AppKitCalendarState {
	months: readonly CalendarMonthGrid[]
	isDisabled(date: PlainDate): boolean
	value?: ISODateString | DateRange
	mode: 'single' | 'range'
	rangeAnchor: ISODateString | null
	direction: 'ltr' | 'rtl'
	min?: ISODateString
	max?: ISODateString
}

/** AppKit adaptation of the portable calendar model. Query/selection owners stay in Calendar. */
export function createAppKitCalendarFocus(
	options: {
		current(): AppKitCalendarState
		navigate(month: ISODateString): void
		pick(iso: ISODateString): void
		cancelRange(): void
	},
	bridge = appKitHost,
	native: () => Record<string, any> = () => globalThis,
) {
	const views = new Map<ISODateString, NSView>()
	let root: NSView | null = null,
		owner: NSWindow | null = null,
		focused: string | undefined
	let pending: { iso: string; window: NSWindow } | null = null,
		queued = false,
		stopObserver: (() => void) | undefined
	const cells = () =>
		options
			.current()
			.months.flatMap((month) => month.weeks.flat())
			.filter((day) => !day.isOutsideMonth && !options.current().isDisabled(day.date))
	const preferred = () => {
		const enabled = cells(),
			value = options.current().value,
			selected = typeof value === 'string' ? value : value?.start
		return (
			enabled.find((day) => day.iso === focused)?.iso ??
			enabled.find((day) => day.iso === selected)?.iso ??
			enabled.find((day) => day.isToday)?.iso ??
			enabled[0]?.iso
		)
	}
	const navigation = createAppKitChoiceFocus(
		{
			root: () => root,
			views,
			selected: preferred,
			orientation: () => 'both',
			direction: () => options.current().direction,
			reveal: (view) => {
				view.scrollRectToVisible(view.bounds)
			},
		},
		bridge,
	)
	const refresh = () => {
		const window = root?.window
		const flag = (name: string) => {
			const value = root ? Reflect.get(root, name) : false
			return Boolean(typeof value === 'function' ? value.call(root) : value)
		}
		if (
			!window ||
			flag('hidden') ||
			flag('hiddenOrHasHiddenAncestor') ||
			!bridge()?.keyboardEventsSupported
		) {
			navigation.dispose()
			owner = null
			pending = null
			return
		}
		if (owner !== window) {
			navigation.dispose()
			owner = window
		}
		if (pending && pending.window !== window) {
			pending = null
		}
		navigation.synchronize()
		if (pending) {
			if (!cells().some((day) => day.iso === pending!.iso)) {
				return
			} // Controlled page awaits acceptance.

			if (navigation.focus(pending.iso)) {
				focused = pending.iso
				pending = null
			}
		} else if (
			[...views].some(([, view]) => view === window.firstResponder) &&
			!navigation.focusedView()
		) {
			navigation.focus() // Repair a focused date invalidated by new constraints.
		}
	}
	const refreshSafely = () => {
		try {
			refresh()
		} catch (error) {
			console.warn('[macos-calendar] focus refresh failed', error)
		}
	}
	const update = () => {
		if (queued) {
			return
		}
		queued = true
		void Promise.resolve().then(() => {
			queued = false
			if (root) {
				refreshSafely()
			}
		})
	}
	const bind = (view: NSView | null) => {
		if (root === view) {
			return
		}
		navigation.dispose()
		stopObserver?.()
		stopObserver = undefined
		root = view
		owner = null
		pending = null
		focused = undefined
		if (!view) {
			views.clear()
			return
		}
		const host = native(),
			center = host.NSNotificationCenter?.defaultCenter
		if (
			bridge()?.keyboardEventsSupported &&
			center?.addObserverForNameObjectQueueUsingBlock &&
			center?.removeObserver
		) {
			try {
				const token = center.addObserverForNameObjectQueueUsingBlock(
					host.NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification',
					null,
					null,
					(note: { object: NSWindow }) => {
						if (root && (note.object === root.window || note.object === owner)) {
							refreshSafely()
						}
					},
				)

				stopObserver = () => center.removeObserver(token)
			} catch (error) {
				console.warn('[macos-calendar] focus observation unavailable', error)
			}
		}
		update()
	}
	const activate = (iso: ISODateString) => {
		const view = views.get(iso)
		if (
			!root?.window ||
			view?.window !== root.window ||
			!navigation.orderedKeys().includes(iso) ||
			!cells().some((day) => day.iso === iso)
		) {
			return
		}
		if (bridge()?.keyboardEventsSupported && navigation.focus(iso)) {
			focused = iso
		}
		options.pick(iso)
	}

	return {
		bind,
		update,
		activate,
		register(iso: ISODateString, view: NSView): () => void {
			views.set(iso, view)
			update()
			return () => {
				if (views.get(iso) === view) {
					views.delete(iso)
				}
				update()
			}
		},
		cancelPending() {
			pending = null
		},
		dispose() {
			bind(null)
		},
		keyDown(event: NativeKeyboardEvent<NSView>) {
			const window = root?.window,
				target = event.target,
				state = options.current()
			if (
				!window ||
				!bridge()?.keyboardEventsSupported ||
				target?.window !== window ||
				window.firstResponder !== target ||
				event.defaultPrevented ||
				event.isComposing ||
				event.altKey
			) {
				return
			}
			if ((event.ctrlKey || event.metaKey) && event.key !== 'Home' && event.key !== 'End') {
				return
			}
			const iso = [...views].find(([, view]) => view === target)?.[0]
			if (
				!iso ||
				!navigation.orderedKeys().includes(iso) ||
				!cells().some((day) => day.iso === iso)
			) {
				return
			}
			const stop = () => {
				event.preventDefault()
				event.stopPropagation()
			}
			if (event.key === 'Escape' && state.mode === 'range' && state.rangeAnchor !== null) {
				stop()
				pending = null
				options.cancelRange()
				return
			}
			if (event.key === 'Enter' || event.key === ' ') {
				stop()
				pending = null
				options.pick(iso)
				return
			}
			if (
				![
					'ArrowLeft',
					'ArrowRight',
					'ArrowUp',
					'ArrowDown',
					'Home',
					'End',
					'PageUp',
					'PageDown',
				].includes(event.key)
			) {
				return
			}
			const next = calendarKeyTarget({
				iso,
				event,
				months: state.months,
				isDisabled: state.isDisabled,
				rtl: state.direction === 'rtl',
				min: state.min,
				max: state.max,
			})
			stop()
			if (!next) {
				return
			}
			const date = plainDateFromISO(next)!
			if (!state.months.some((month) => month.year === date.year && month.month === date.month)) {
				pending = { iso: next, window }
				try {
					options.navigate(plainDateToISO(monthStart(date)))
				} catch (error) {
					pending = null
					throw error
				}

				update()
			} else {
				pending = null
				if (navigation.focus(next)) {
					focused = next
				}
			}
		},
	}
}
