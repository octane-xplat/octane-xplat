/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect, useRef } from 'octane'
import type { AppKitSheetProps } from './macos/types'

const host = (): any => (globalThis as any).__xplatAppKit ?? {}

function ContentRoot(props: { render?: () => any }) @{
	<>{props.render?.()}</>;
}

/** macOS sheet — presents the `content` subtree in a real AppKit window
 *  sheet (`beginSheet` on the leaf's parent window), falling back to a
 *  floating window when no parent exists. `open` controls presentation;
 *  closing the sheet window (Esc/close button) or `open`→false fires
 *  `onDismissed`. Detents don't exist on macOS — the window sizes to the
 *  content's fitting size. */
export function AppKitSheet(props: AppKitSheetProps) @{
	const anchor = useRef<any>(null)
	const presented = useRef<any>(null)

	useEffect(() => {
		if (!props.open) return
		if (presented.current) {
			presented.current.update({ render: props.content })
			return
		}

		const view = anchor.current
		const present = host().presentSheet
		if (!view || typeof present !== 'function') return
		presented.current = present(view, {
			component: ContentRoot,
			props: { render: props.content },
			onDismissed: () => {
				presented.current = null
				props.onDismissed?.()
			},
		})

		return () => {
			const entry = presented.current
			presented.current = null
			entry?.close()
		}
	}, [props.open])

	// Push content render-fn changes into the presented sheet while open.
	useEffect(() => {
		presented.current?.update?.({ render: props.content })
	})

	<flexboxlayout ref={(v: any) => { anchor.current = v }} id={props.id} />;
}
