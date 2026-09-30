/** @jsxImportSource @xplat/macos/renderer */
import { useEffect, useRef } from 'octane'
import type { AppKitContextMenuProps } from './macos/types'

const host = (): any => (globalThis as any).__xplatAppKit ?? {}

/** macOS context menu — the trigger renders inline as this element's
 *  children and a real NSMenu is attached to the backing NSView's `menu`,
 *  so AppKit drives right-click activation and disabled items. Items are
 *  serialized data; selection reports through `onItemSelected`. */
export function AppKitContextMenu(props: AppKitContextMenuProps) @{
	const anchor = useRef<any>(null)

	useEffect(() => {
		const view = anchor.current
		const attach = host().attachContextMenu
		if (!view || typeof attach !== 'function') return
		return attach(
			view,
			{ items: props.items ?? [] },
			(id: string) => props.onItemSelected?.(id),
		)
	}, [props.items])

	<flexboxlayout
		ref={(v: any) => { anchor.current = v }}
		id={props.id}
		className={props.className}
		style={props.style}
	>
		{props.trigger()}
	</flexboxlayout>;
}
