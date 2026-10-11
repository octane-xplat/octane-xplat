/** @jsxImportSource octane */
import { Fragment, useLayoutEffect, useRef, useState } from 'octane'
import type { ContextMenuProps } from './web/types'

/** Web context menu: the trigger subtree renders inline; right-click (or
 *  long-press via the `activation` prop's 'singlePress' = click) opens an
 *  in-page menu at the pointer. */
export function ContextMenu(props: ContextMenuProps) @{
	const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
	const [active, setActive] = useState(0)
	const listRef = useRef<HTMLUListElement | null>(null)
	const items = props.items ?? []
	const enabled = items
		.map((item, index) => (item.disabled ? -1 : index))
		.filter((index) => index >= 0)

	const openAt = (e: any) => {
		e.preventDefault?.()
		setActive(enabled[0] ?? 0)
		setMenu({ x: e.clientX ?? 0, y: e.clientY ?? 0 })
	}

	const choose = (index: number) => {
		const item = items[index]
		if (!item || item.disabled) return
		setMenu(null)
		props.onItemSelected?.(item.id)
	}

	// Once the menu is mounted: clamp it into the viewport so every item
	// stays reachable, then focus it so the keyboard contract works.
	useLayoutEffect(() => {
		const el = listRef.current
		if (!menu || !el) return
		const x = Math.max(0, Math.min(menu.x, window.innerWidth - el.offsetWidth - 8))
		const y = Math.max(0, Math.min(menu.y, window.innerHeight - el.offsetHeight - 8))
		if (x !== menu.x || y !== menu.y) {
			setMenu({ x, y })
			return
		}

		el.focus()
	}, [menu])

	const onMenuKeyDown = (e: any) => {
		if (e.key === 'Escape') {
			e.preventDefault?.()
			e.stopPropagation?.()
			setMenu(null)
			return
		}

		if (!enabled.length) return
		const at = Math.max(0, enabled.indexOf(active))
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault?.()
			const step = e.key === 'ArrowDown' ? 1 : -1
			setActive(enabled[(at + step + enabled.length) % enabled.length])
		} else if (e.key === 'Home') {
			e.preventDefault?.()
			setActive(enabled[0])
		} else if (e.key === 'End') {
			e.preventDefault?.()
			setActive(enabled[enabled.length - 1])
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault?.()
			choose(active)
		}
	}

	<span
		id={props.id}
		className={props.className}
		style={{ display: 'inline-block', ...(props.style ?? {}) }}
		onContextMenu={props.activation === 'singlePress' ? undefined : openAt}
		onClick={props.activation === 'singlePress' ? openAt : undefined}
		aria-label={props.accessibilityLabel}
	>
		{props.trigger()}
		{menu && (
			<>
				{/* Events from the backdrop and the menu must not bubble to the
				    opener handlers — dismissal stays final. */}
				<span
					style={{ position: 'fixed', inset: 0, zIndex: 999 }}
					onClick={(e: any) => {
						e.stopPropagation?.()
						setMenu(null)
					}}
					onContextMenu={(e: any) => {
						e.preventDefault?.()
						e.stopPropagation?.()
						setMenu(null)
					}}
				/>
				<ul
					role="menu"
					tabIndex={-1}
					ref={(el: any) => {
						listRef.current = el
					}}
					onClick={(e: any) => e.stopPropagation?.()}
					onContextMenu={(e: any) => {
						e.preventDefault?.()
						e.stopPropagation?.()
					}}
					onKeyDown={onMenuKeyDown}
					style={{
						position: 'fixed',
						left: menu.x,
						top: menu.y,
						zIndex: 1000,
						margin: 0,
						padding: '4px 0',
						listStyle: 'none',
						background: 'var(--menu-bg, Canvas)',
						color: 'var(--menu-fg, CanvasText)',
						border: '1px solid color-mix(in srgb, CanvasText 20%, transparent)',
						borderRadius: 8,
						boxShadow: '0 6px 24px rgb(0 0 0 / 0.18)',
						minWidth: 160,
						outline: 'none',
					}}
				>
					{items.map((item, index) => (
						<Fragment key={item.id}>
							{item.divider && (
								<li
									aria-hidden="true"
									style={{ borderTop: '1px solid color-mix(in srgb, CanvasText 15%, transparent)', margin: '4px 0' }}
								/>
							)}
							<li
								role="menuitem"
								aria-disabled={item.disabled || undefined}
								aria-current={index === active || undefined}
								style={{
									padding: '6px 12px',
									cursor: item.disabled ? 'default' : 'pointer',
									opacity: item.disabled ? 0.5 : 1,
									color: item.destructive ? 'crimson' : undefined,
									background:
										index === active
											? 'color-mix(in srgb, CanvasText 10%, transparent)'
											: undefined,
								}}
								onClick={() => choose(index)}
							>
								{item.title}
							</li>
						</Fragment>
					))}
				</ul>
			</>
		)}
	</span>;
}
