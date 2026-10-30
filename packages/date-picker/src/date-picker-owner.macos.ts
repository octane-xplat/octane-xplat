import type { AppKitDatePickerProps } from './macos/types'

export interface DatePickerOptions {
	mode: NonNullable<AppKitDatePickerProps['components']>
	style: NonNullable<AppKitDatePickerProps['pickerStyle']>
	selectionMillis: number
	minimumMillis?: number
	maximumMillis?: number
	enabled: boolean
	accessibilityLabel?: string
}

export interface DatePickerHandle {
	update(options: DatePickerOptions): void
	detach(): void
}

export type DatePickerAttach = (
	view: object,
	options: DatePickerOptions,
	onChange: (millis: number) => void,
) => DatePickerHandle | null

export type DatePickerStatus = 'ready' | 'invalid' | 'unavailable'

function milliseconds(date: Date | undefined): number | undefined {
	try {
		return date === undefined ? undefined : date.getTime()
	} catch {
		return NaN
	}
}

const valid = (value: number) =>
	Number.isFinite(value) && Number.isFinite(new Date(value).getTime())

/** Own one mounted attachment. Default selection seeds once; mode/view changes
 * retain the accepted selection. This model does not prove native editing. */
export function createDatePickerOwner(deps: {
	props(): AppKitDatePickerProps
	attach(): DatePickerAttach | undefined
	status?(status: DatePickerStatus): void
	now?(): number
}): {
	update: () => void
	bind(next: object | null): void
	dispose(): void
	getStatus: () => DatePickerStatus
} {
	let view: object | null = null,
		disposed = false,
		retained: number | undefined
	let status: DatePickerStatus = 'unavailable'
	type Session = {
		view: object
		mode: string
		style: string
		writing: number
		handle: DatePickerHandle | null
	}
	let session: Session | null = null
	const report = (next: DatePickerStatus) => {
		if (!disposed && next !== status) {
			status = next
			deps.status?.(next)
		}
	}
	const detach = () => {
		const old = session
		session = null
		try {
			old?.handle?.detach()
		} catch {}
	}
	const plan = (): DatePickerOptions | null => {
		const props = deps.props(),
			min = milliseconds(props.minimumDate),
			max = milliseconds(props.maximumDate)
		if (
			(min !== undefined && !valid(min)) ||
			(max !== undefined && !valid(max)) ||
			(min !== undefined && max !== undefined && min > max)
		) {
			return null
		}
		const controlled = props.selection !== undefined
		let selected = controlled
			? milliseconds(props.selection)!
			: (retained ?? milliseconds(props.defaultSelection) ?? (deps.now ?? Date.now)())
		if (!valid(selected)) {
			return null
		}
		if (
			controlled &&
			((min !== undefined && selected < min) || (max !== undefined && selected > max))
		) {
			return null
		}
		if (!controlled) {
			selected = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, selected))
		}
		const mode = props.components ?? 'date'
		return {
			mode,
			style: mode === 'date' ? (props.pickerStyle ?? 'textField') : 'textField',
			selectionMillis: selected,
			minimumMillis: min,
			maximumMillis: max,
			enabled: !props.disabled,
			accessibilityLabel: props.accessibilityLabel,
		}
	}
	const update = () => {
		if (disposed || !view) {
			return
		}
		const options = plan()
		if (!options) {
			detach()
			report('invalid')
			return
		}
		retained = options.selectionMillis
		if (
			session &&
			(session.view !== view || session.mode !== options.mode || session.style !== options.style)
		) {
			detach()
		}
		if (session?.handle) {
			const owner = session
			owner.writing++
			try {
				owner.handle!.update(options)
				if (session === owner) {
					report('ready')
				}
			} catch {
				if (session === owner) {
					detach()
					report('unavailable')
				}
			} finally {
				owner.writing--
			}

			return
		}
		const attach = deps.attach()
		if (!attach) {
			report('unavailable')
			return
		}
		const owner: Session = {
			view,
			mode: options.mode,
			style: options.style,
			writing: 1,
			handle: null,
		}
		session = owner
		try {
			const handle = attach(view, options, (millis) => {
				if (disposed || session !== owner || owner.writing || !owner.handle) {
					return
				}
				const current = plan()
				if (!current || !current.enabled || !valid(millis)) {
					update()
					return
				}
				const picked = new Date(millis).getTime()
				if (
					(current.minimumMillis !== undefined && picked < current.minimumMillis) ||
					(current.maximumMillis !== undefined && picked > current.maximumMillis)
				) {
					update()
					return
				}
				if (picked === current.selectionMillis) {
					return
				}
				if (deps.props().selection === undefined) {
					retained = picked
				}
				try {
					deps.props().onSelectionChange?.(new Date(picked))
				} finally {
					update()
				} // Restore a rejected controlled value; suppress programmatic echoes.
			})

			if (disposed || session !== owner) {
				handle?.detach()
				return
			}

			owner.handle = handle
			if (!handle) {
				session = null
				report('unavailable')
			} else {
				report('ready')
			}
		} catch {
			if (session === owner) {
				detach()
				report('unavailable')
			}
		} finally {
			owner.writing--
		}
	}
	return {
		update,
		bind(next: object | null) {
			if (!disposed && next !== view) {
				detach()
				view = next
				if (view) {
					update()
				}
			}
		},
		dispose() {
			if (!disposed) {
				disposed = true
				detach()
				view = null
			}
		},
		getStatus: () => status,
	}
}
