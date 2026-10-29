/** @jsxImportSource @octane-xplat/jsx */
import './AppKitContextMenu.macos.css'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import type { AppKitContextMenuProps } from './macos/types'
import { createContextMenuOwner } from './context-menu-owner.macos'
import type { ContextMenuAttach } from './context-menu-owner.macos'
import { cx } from '@octane-xplat/lib'

const host = (): any => (globalThis as any).__xplatAppKit ?? {}

/** macOS context menu — the trigger renders inline as this element's
 *  children and a real NSMenu is attached to the backing NSView's `menu`,
 *  so AppKit drives right-click activation and disabled items. Items are
 *  serialized data; selection reports through `onItemSelected`. */
export function AppKitContextMenu(props: AppKitContextMenuProps) @{
	const latest = useRef(props)
	latest.current = props
	const [, rerender] = useState(0)
	const owner = useMemo(() => createContextMenuOwner({
		props: () => latest.current,
		attach: () => typeof host().attachContextMenu === 'function' ? host().attachContextMenu as ContextMenuAttach : undefined,
		status: () => rerender((n) => n + 1),
	}), [])
	useLayoutEffect(() => owner.update(), null)
	useEffect(() => () => owner.dispose(), [])

	<masonview
		ref={owner.bind}
		id={props.id}
		className={cx('xplat-appkit-context-menu', props.className)}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
	>
		{props.trigger()}
		@if (owner.getStatus() === 'invalid' || owner.getStatus() === 'unavailable') {
			<label text="Menu actions are unavailable." accessibilityLiveRegion="polite" />
		}
	</masonview>
}
