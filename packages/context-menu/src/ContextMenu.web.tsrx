/** @jsxImportSource octane */
import { useState } from 'octane'
import type { ContextMenuProps } from './web/types'

/** Web context menu: the trigger subtree renders inline; right-click (or
 *  long-press via the `activation` prop's 'singlePress' = click) opens an
 *  in-page menu at the pointer. */
export function ContextMenu(props: ContextMenuProps) @{
	const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
	const items = props.items ?? []
	const openAt = (e: any) => {
		e.preventDefault?.()
		setMenu({ x: e.clientX ?? 0, y: e.clientY ?? 0 })
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
				<span
					style={{ position: 'fixed', inset: 0, zIndex: 999 }}
					onClick={() => setMenu(null)}
					onContextMenu={(e: any) => {
						e.preventDefault?.()
						setMenu(null)
					}}
				/>
				<ul
					role="menu"
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
					}}
				>
					{items.map((item) => (
						<>
							{item.divider && (
								<li
									aria-hidden="true"
									style={{ borderTop: '1px solid color-mix(in srgb, CanvasText 15%, transparent)', margin: '4px 0' }}
								/>
							)}
							<li
								role="menuitem"
								aria-disabled={item.disabled || undefined}
								style={{
									padding: '6px 12px',
									cursor: item.disabled ? 'default' : 'pointer',
									opacity: item.disabled ? 0.5 : 1,
									color: item.destructive ? 'crimson' : undefined,
								}}
								onClick={() => {
									if (item.disabled) return
									setMenu(null)
									props.onItemSelected?.(item.id)
								}}
							>
								{item.title}
							</li>
						</>
					))}
				</ul>
			</>
		)}
	</span>;
}
