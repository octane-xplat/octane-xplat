import { useCallback, useId, useLayoutEffect, useRef, useState } from 'octane'

type Part = 'title' | 'description'
type Entry = { part: Part; id: string; text: string }

/** Per-viewer dialog text ownership; no document-global IDs or registry. */
type DialogTextResult = {
	register: (token: object, entry: Entry) => () => void
	labelledBy: string | undefined
	describedBy: string | undefined
	label: string | undefined
}

export function useDialogText(): DialogTextResult {
	const [entries, setEntries] = useState(() => new Map<object, Entry>())
	const register = useCallback((token: object, entry: Entry) => {
		setEntries((previous) => new Map(previous).set(token, entry))
		return () =>
			setEntries((previous) => {
				if (previous.get(token) !== entry) {
					return previous
				}

				const next = new Map(previous)
				next.delete(token)
				return next
			})
	}, [])

	const values = [...entries.values()]
	return {
		register,
		labelledBy:
			values
				.filter((entry) => entry.part === 'title')
				.map((entry) => entry.id)
				.join(' ') || undefined,
		describedBy:
			values
				.filter((entry) => entry.part === 'description')
				.map((entry) => entry.id)
				.join(' ') || undefined,
		label:
			values
				.filter((entry) => entry.part === 'title')
				.map((entry) => entry.text)
				.filter(Boolean)
				.join(' ') || undefined,
	}
}

export function useDialogPart(
	dialog: ReturnType<typeof useDialogText>,
	part: Part,
	explicitId: string | undefined,
	children: unknown,
	host?: {
		current: {
			text: string
			on(event: string, callback: () => void): void
			off(event: string, callback: () => void): void
		} | null
	},
): string {
	const generated = useId()
	const id = explicitId ?? `vx-lightbox-${part}-${generated}`
	const token = useRef({})
	const text = typeof children === 'string' || typeof children === 'number' ? String(children) : ''
	const register = dialog.register
	useLayoutEffect(() => {
		let remove = () => {}
		const view = host?.current
		const update = () => {
			remove()
			remove = register(token.current, { part, id, text: view?.text ?? text })
		}

		update()
		view?.on('textChange', update)
		return () => {
			view?.off('textChange', update)
			remove()
		}
	}, [register, part, id, text, host])

	return id
}
