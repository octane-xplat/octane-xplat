/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect, useRef } from 'octane'
import { useState } from 'octane'
import { createPortal as createUniversalPortal, type UniversalRenderable } from 'octane/universal/native'
import type { AppKitSheetProps } from './macos/types'

const host = (): any => (globalThis as any).__xplatAppKit ?? {}

function ContentRoot(props: { render?: () => any }) @{
	<>{props.render?.()}</>;
}

function createPortal(children: unknown, target: unknown) {
	return createUniversalPortal(children as UniversalRenderable, target)
}

/** macOS sheet — portals the `content` subtree into a real AppKit window
 *  sheet (`beginSheet` on the leaf's parent window), falling back to a
 *  floating window when no parent exists. `open` controls presentation;
 *  closing the sheet window (Esc/close button) or `open`→false fires
 *  `onDismissed`. Detents don't exist on macOS — the window sizes to the
 *  content's fitting size. */
export function AppKitSheet(props: AppKitSheetProps) @{
	const anchor = useRef<any>(null)
	const presented = useRef<any>(null)
	const [portalTarget, setPortalTarget] = useState<any>(null)

	useEffect(() => {
		if (!props.open) {
			setPortalTarget(null)
			return
		}

		const view = anchor.current
		const present = host().presentSheet
		if (!view || typeof present !== 'function') return
		let entry: any = null
		entry = present(view, {
			onDismissed: () => {
				if (presented.current === entry) {
					presented.current = null
					setPortalTarget(null)
				}
				props.onDismissed?.()
			},
		})
		if (!entry) return
		presented.current = entry
		setPortalTarget(entry.target)

		return () => {
			if (presented.current === entry) {
				presented.current = null
			}
			entry?.close()
		}
	}, [props.open])

	// Wait until the portal has attached its children before measuring and showing
	// the native window so fitting-size presentation includes the current content.
	useEffect(() => {
		if (!portalTarget) return
		const entry = presented.current
		if (entry?.target === portalTarget && !entry.present()) {
			presented.current = null
			setPortalTarget(null)
		}
	}, [portalTarget])

	<>
		<masonview ref={(v: any) => { anchor.current = v }} id={props.id} style={{display: "flex"}}/>
		{props.open && portalTarget && props.content
			? createPortal(<ContentRoot render={props.content} />, portalTarget)
			: null}
	</>;
}
