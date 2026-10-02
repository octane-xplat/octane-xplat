import { useEffect, useRef } from 'octane'
import type { MenuSurfaceProps } from './props'
import { MenuProvider } from './menu-context'

/** Each portaled submenu is its own keyboard boundary. Escape belongs to Popover. */
export function MenuSurface(props: MenuSurfaceProps) @{
	const panel = useRef<HTMLDivElement | null>(null)
	const search = useRef({ text: '', at: 0 })
	const context = { closeMenu: () => props.closeMenu(), menuSize: 'md' as const }
	const rows = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]') ?? [])
		.filter((row) => row.closest('[role="menu"]') === panel.current)

	useEffect(() => {
		const items = rows()
		for (const item of items) item.tabIndex = -1
		const enabled = items.filter((item) => item.getAttribute('aria-disabled') !== 'true')
		if (props.initialFocus === 'first' && enabled.length) enabled[0].focus()
		else if (props.initialFocus === 'last' && enabled.length) enabled.at(-1)?.focus()
		else panel.current?.focus()
	}, [])

	const keydown = (event: KeyboardEvent) => {
		if (event.isComposing || event.keyCode === 229 || event.defaultPrevented) return
		const items = rows()
		const index = items.indexOf(document.activeElement as HTMLElement)
		let next: number | undefined
		if (event.key === 'ArrowDown') next = (index + 1) % items.length
		else if (event.key === 'ArrowUp') next = index <= 0 ? items.length - 1 : index - 1
		else if (event.key === 'Home') next = 0
		else if (event.key === 'End') next = items.length - 1
		else if (event.key === (getComputedStyle(panel.current!).direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft') && props.closeLevel) {
			event.preventDefault(); event.stopPropagation(); props.closeLevel(); return
		} else if (event.key === 'Tab') { props.closeMenu(); return }
		else if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.altKey && !event.metaKey) {
			const now = Date.now()
			search.current.text = (now - search.current.at < 500 ? search.current.text : '') + event.key.toLowerCase()
			search.current.at = now
			const query = search.current.text
			const match = items.map((_, offset) => (index + offset + 1) % items.length)
				.find((i) => (items[i].getAttribute('aria-label') ?? items[i].textContent ?? '').trim().toLowerCase().startsWith(query))

			next = match
		}

		if (next !== undefined && items[next]) {
			event.preventDefault(); event.stopPropagation(); items[next].focus()
		}
	}

	<div ref={panel} role="menu" aria-label={props.label} tabIndex={-1} className="vx-menu-list" onKeyDown={keydown}>
		<MenuProvider value={context}>{props.children}</MenuProvider>
	</div>
}
