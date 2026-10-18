/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect, useRef } from 'octane'
import type { AppKitContextMenuProps } from './macos/types'

const host = (): any => (globalThis as any).__xplatAppKit ?? {}

/** macOS context menu — the trigger renders inline as this element's
 *  children and a real NSMenu is attached to the backing NSView's `menu`,
 *  so AppKit drives right-click activation and disabled items. Items are
 *  serialized data; selection reports through `onItemSelected`. */
export function AppKitContextMenu(props: AppKitContextMenuProps) @{
	const anchor = useRef<any>(null)
	// Selection must reach the latest handler — re-attaching the NSMenu on
	// every callback change would churn the view's `menu` subtree.
	const latest = useRef(props)
	latest.current = props

	useEffect(() => {
		const view = anchor.current
		const attach = host().attachContextMenu
		if (!view || typeof attach !== 'function') return
		return attach(
			view,
			{ items: latest.current.items ?? [] },
			(id: string) => latest.current.onItemSelected?.(id),
		)
	}, [props.items])

	<masonview display="flex" ref={(v: any) => { anchor.current = v }} id={props.id} className={props.className} style={props.style} accessibilityLabel={props.accessibilityLabel}>
		{props.trigger()}
	</masonview>;
}
