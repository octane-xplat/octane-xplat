/** @jsxImportSource @octane-xplat/jsx/dom */
import { useEffect, useRef, useState } from 'octane'
import type { DrawerProps } from './props'
import type { JSX } from 'octane/jsx-runtime'

function applyWebProps(node: any, bag?: Record<string, any>) {
	if (!node || !bag) {
		return
	}

	for (const [key, value] of Object.entries(bag)) {
		if (key.includes('-')) {
			node.setAttribute(key, String(value))
		} else {
			node[key] = value
		}
	}
}

/** Composed desktop/web Drawer. Mobile uses the same props with native edge gestures. */
export function Drawer(props: DrawerProps): JSX.Element @{
	const latest = useRef(props)
	latest.current = props
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.open ?? internal
	const requestDismiss = () => {
		if (latest.current.open === undefined) {
			setInternal(false)
		}

		latest.current.onOpenChange?.(false)
		latest.current.onDismiss?.()
	}

	const panel = useRef<HTMLDivElement | null>(null)
	useEffect(() => {
		if (!open) {
			return
		}

		const previous = document.activeElement as HTMLElement | null
		const node = panel.current
		const focusable = () =>
			Array.from(
				node?.querySelectorAll<HTMLElement>(
					'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
				) ?? [],
			)

		;(focusable()[0] ?? node)?.focus()
		const keydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault()
				requestDismiss()
			}

			if (event.key === 'Tab') {
				const items = focusable()
				const first = items[0] ?? node
				const last = items.at(-1) ?? node
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault()
					last?.focus()
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault()
					first?.focus()
				}
			}
		}

		node?.addEventListener('keydown', keydown)
		return () => {
			node?.removeEventListener('keydown', keydown)
			if (node?.contains(document.activeElement) || document.activeElement === document.body) {
				previous?.focus()
			}
		}
	}, [open])

	<div
		id={props.id}
		ref={(node: HTMLDivElement | null) => applyWebProps(node, props.web)}
		className={['vx-drawer', props.className]}
		style={props.style}
	>
		<div className="vx-drawer-main" inert={open} aria-hidden={open}>
			{props.main}
		</div>
		@if (open) {
			<>
				<div className="vx-drawer-backdrop" onClick={requestDismiss} />
				<div
					className="vx-drawer-panel"
					ref={panel}
					role="dialog"
					aria-modal="true"
					tabIndex={-1}
					aria-label={props.accessibilityLabel ?? 'Navigation'}
					style={{ width: props.width ?? 280 }}
				>
					{props.drawer}
				</div>
			</>
		}
	</div>
}
